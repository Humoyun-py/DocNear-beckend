import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, apiList, setAuthTokens, clearTokens, ApiError, AUTH_EXPIRED } from '../src/services/apiClient';
class MemoryStorage {
 data = new Map<string,string>();
 getItem(key:string) { return this.data.get(key) ?? null; }
 setItem(key:string,value:string) { this.data.set(key,value); }
 removeItem(key:string) { this.data.delete(key); }
}
Object.defineProperty(globalThis,'sessionStorage',{value:new MemoryStorage(),configurable:true});
Object.defineProperty(globalThis,'localStorage',{value:new MemoryStorage(),configurable:true});
Object.defineProperty(globalThis,'window',{value:new EventTarget(),configurable:true});
const response=(data:unknown,status=200)=>new Response(JSON.stringify(status<400?{success:true,data}:{success:false,message:'Rejected',errors:{}}),{status});
beforeEach(()=>clearTokens());
test('unwraps paginated backend responses, including all pages',async()=>{
 let calls=0;
 globalThis.fetch=async()=>response({results:[{id:++calls}],next:calls===1?'next':null,count:2});
 assert.deepEqual(await apiList('doctors/'),[{id:1},{id:2}]);
});
test('parallel 401s share one refresh and retry with the new access token',async()=>{
 setAuthTokens({access:'old',refresh:'refresh'});
 let refreshes=0;
 globalThis.fetch=async(url,init)=>{
  if(String(url).includes('token/refresh')) { refreshes++; await new Promise(resolve=>setTimeout(resolve,20)); return response({access:'new',refresh:'rotated'}); }
  return new Headers(init?.headers).get('Authorization')==='Bearer new'?response({id:17}):response({},401);
 };
 assert.deepEqual(await Promise.all([apiRequest('auth/me/'),apiRequest('appointments/17/')]),[{id:17},{id:17}]);
 assert.equal(refreshes,1);
 assert.equal(sessionStorage.getItem('docnear_refresh_token'),'rotated');
});
test('invalid refresh clears credentials and emits expired-session event',async()=>{
 setAuthTokens({access:'old',refresh:'invalid'});
 let expired=false; window.addEventListener(AUTH_EXPIRED,()=>{expired=true},{once:true});
 globalThis.fetch=async()=>response({},401);
 await assert.rejects(apiRequest('auth/me/'),(e:unknown)=>e instanceof ApiError&&e.status===401);
 assert.equal(sessionStorage.getItem('docnear_access_token'),null);
 assert.equal(expired,true);
});
test('booking conflict and forbidden responses are not retried as successful writes',async()=>{
 for(const status of [403,409]) {
  let calls=0; globalThis.fetch=async()=>{calls++;return response({},status)};
  await assert.rejects(apiRequest('appointments/',{method:'POST',body:'{}'}),(e:unknown)=>e instanceof ApiError&&e.status===status);
  assert.equal(calls,1);
 }
});
test('anonymous login never carries a stale access token',async()=>{
 setAuthTokens({access:'expired',refresh:'old'});
 globalThis.fetch=async(_url,init)=>{assert.equal(new Headers(init?.headers).has('Authorization'),false);return response({user:{id:1},access:'valid'})};
 assert.equal((await apiRequest<any>('auth/login/',{method:'POST',body:'{}'})).access,'valid');
});
test('server failures keep the saved session for retry',async()=>{
 setAuthTokens({access:'valid',refresh:'refresh'});
 globalThis.fetch=async()=>response({},503);
 await assert.rejects(apiRequest('appointments/'));
 assert.equal(sessionStorage.getItem('docnear_access_token'),'valid');
});

test('a forbidden replay after successful refresh preserves the valid session', async () => {
 setAuthTokens({access:'old',refresh:'refresh'});
 globalThis.fetch=async(url,init)=>{
  if(String(url).includes('token/refresh')) return response({access:'new',refresh:'rotated'});
  return response({}, new Headers(init?.headers).get('Authorization') === 'Bearer new' ? 403 : 401);
 };
 await assert.rejects(apiRequest('appointments/'), (e:unknown)=>e instanceof ApiError && e.status===403);
 assert.equal(sessionStorage.getItem('docnear_access_token'),'new');
});

test('coded auth errors preserve code without leaking validation internals into message', async () => {
 globalThis.fetch=async()=>new Response(JSON.stringify({
  success:false,
  code:'account_already_exists',
  message:'Bu telefon raqami bilan hisob allaqachon mavjud.',
  errors:{0:'technical envelope detail'},
 }),{status:400});
 await assert.rejects(
  apiRequest('auth/telegram-handoff/',{method:'POST',body:'{}'}),
  (error:unknown)=>error instanceof ApiError
   && error.code==='account_already_exists'
   && error.message==='Bu telefon raqami bilan hisob allaqachon mavjud.'
   && !error.message.includes('technical envelope detail'),
 );
});
