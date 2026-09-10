import { useEffect, useState } from 'react';
import { Specialty } from '../types';
import { apiList } from '../services/apiClient';
export function useSpecialties() {
 const [items,setItems]=useState<Specialty[]>([]);
 useEffect(()=>{ let active=true; apiList<any>('specialties/').then(rows=>{
  if(active) setItems(rows.map(s=>({id:String(s.id),name:s.name,description:s.description,iconName:s.icon_name,doctorCount:0,clinicCount:0,popularConditions:[]})));
 }).catch(console.error); return ()=>{active=false}; },[]);
 return items;
}
