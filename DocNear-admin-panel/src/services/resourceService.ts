import {request,list} from './apiClient';
export type RecordData=Record<string,any>;
export function resourceService(name:string) {
 const url='/admin-panel/'+name+'/';
 return {list:(params?:Record<string,unknown>)=>list<RecordData>(url,params),
 get:(id:string)=>request<RecordData>({url:url+id+'/'}),
 save:(id:string|undefined,data:RecordData)=>request<RecordData>({url:url+(id?id+'/':''),method:id?'PATCH':'POST',data}),
 action:(id:string,action:string,data:RecordData={})=>request<RecordData>({url:url+id+'/'+action+'/',method:'POST',data}),
 remove:(id:string)=>request({url:url+id+'/',method:'DELETE'})};
}
export const settingsService={get:()=>request({url:'/admin-panel/settings/'}),save:(data:RecordData)=>request({url:'/admin-panel/settings/',method:'PATCH',data})};
