import {list,request,setTokens,logout,sessionUser} from './apiClient';
export const ownerAuth={login:async(identifier:string,password:string)=>{
 const data=await request<{access:string;refresh:string;user:{role:string;name:string}}>({url:'/auth/login/',method:'POST',data:{identifier,password}});
 if(data.user.role!=='clinic_owner')throw new Error('A clinic owner account is required.');
 setTokens(data);return data.user;
},logout,restore:sessionUser};
export async function ownerClinics(){let page=1,rows:Record<string,any>[]=[];for(;;){const data=await list('/clinic-owner/clinics/',{page,page_size:100});rows.push(...data.results);if(!data.next)return rows;page++}}
export const ownerApi={
 dashboard:(clinic_id:string)=>request({url:'/clinic-owner/dashboard/',params:{clinic_id}}),
 clinic:(clinic_id:string)=>request({url:'/clinic-owner/clinic/',params:{clinic_id}}),
 saveClinic:(clinic_id:string,data:Record<string,any>)=>request({url:'/clinic-owner/clinic/',method:'PATCH',params:{clinic_id},data}),
 page:(kind:string,clinic:string,page:number,search='')=>list(kind==='notifications'?'/notifications/':'/clinic-owner/'+kind+'/',{page,page_size:20,search:search||undefined,...(kind==='notifications'?{}:{clinic})}),
 doctor:(id:string,data:Record<string,any>)=>request({url:'/clinic-owner/doctors/'+id+'/',method:'PATCH',data}),
 services:(clinic_id:string)=>request<{services:Record<string,any>[]}>({url:'/clinic-owner/services/',params:{clinic_id}}),
 allServices:()=>list('/services/',{page_size:100}),
 saveServices:(clinic_id:string,services:number[])=>request({url:'/clinic-owner/services/',method:'PATCH',params:{clinic_id},data:{services}}),
 read:(id:string)=>request({url:'/notifications/'+id+'/read/',method:'POST'}),
 readAll:()=>request({url:'/notifications/read-all/',method:'POST'}),
};
