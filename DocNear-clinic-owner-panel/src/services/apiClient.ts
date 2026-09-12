import axios, { AxiosRequestConfig } from 'axios';
const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api/v1').replace(/\/$/, '');
const ACCESS_KEY = 'docnear_owner_access', REFRESH_KEY = 'docnear_owner_refresh';
export const apiClient = axios.create({baseURL, timeout:20000, headers:{Accept:'application/json'}});
export const getAccessToken=()=>sessionStorage.getItem(ACCESS_KEY);
export const hasSession=()=>!!sessionStorage.getItem(REFRESH_KEY);
export const setTokens=(data:{access:string;refresh?:string})=>{sessionStorage.setItem(ACCESS_KEY,data.access);if(data.refresh)sessionStorage.setItem(REFRESH_KEY,data.refresh)};
export const clearTokens=()=>{sessionStorage.removeItem(ACCESS_KEY);sessionStorage.removeItem(REFRESH_KEY)};
export function expire(){clearTokens();window.dispatchEvent(new Event('owner-auth-expired'))}
apiClient.interceptors.request.use(config=>{
 const token=getAccessToken(); if(token&&!/auth\/(login|register|request-otp|resend-otp|verify-otp|token\/refresh)/.test(config.url||''))config.headers.Authorization='Bearer '+token;
 return config;
});
let refreshing:Promise<void>|null=null;
apiClient.interceptors.response.use(r=>r,async error=>{
 const config=error.config;
 if(error.response?.status===401&&config&&!/auth\/(login|register|request-otp|resend-otp|verify-otp|token\/refresh)/.test(config.url||'')){
  if(!config._retry&&hasSession()){
   config._retry=true;
   if(!refreshing)refreshing=axios.post(baseURL+'/auth/token/refresh/',{refresh:sessionStorage.getItem(REFRESH_KEY)},{timeout:20000})
    .then(r=>{if(!r.data.success)throw new Error('Invalid refresh response');setTokens(r.data.data)}).finally(()=>{refreshing=null});
   try{await refreshing}catch(e){if(axios.isAxiosError(e)&&e.response&&[400,401].includes(e.response.status))expire();throw e}
   return apiClient(config);
  }
  expire();
 }
 const body=error.response?.data;
 error.message=body?.message||error.message;
 if(body?.errors)error.message+=': '+Object.entries(body.errors).map(([k,v])=>k+': '+String(v)).join('; ');
 throw error;
});
export async function request<T=Record<string,any>>(config:AxiosRequestConfig):Promise<T>{
 const response=await apiClient.request(config);
 if(response.status===204)return undefined as T;
 if(response.data?.success!==true)throw new Error('Invalid API response');
 return response.data.data;
}
export type Page<T>={results:T[];count:number;next:string|null;previous:string|null};
export const list=<T=Record<string,any>>(url:string,params?:Record<string,unknown>)=>request<Page<T>>({url,params});
export const sessionUser=()=>request<{id:number;name:string;role:string}>({url:'/auth/me/'});
export async function logout(){try{if(hasSession())await request({url:'/auth/logout/',method:'POST',data:{refresh:sessionStorage.getItem(REFRESH_KEY)}})}finally{expire()}}
