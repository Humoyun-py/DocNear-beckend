import { useEffect, useState } from 'react';
import { Clinic } from '../types';
import { clinicService } from '../services/clinicService';
export function useClinic() {
 const [clinic,setClinic]=useState<Clinic>({id:'',name:'',tagline:'',logoUrl:'',coverImageUrl:'',address:'',city:'',postalCode:'',phone:'',email:'',
  workingHours:'',services:[],facilities:[],doctorCount:0,rating:0,totalReviews:0,latitude:0,longitude:0,directionsInstructions:''});
 useEffect(()=>{ let active=true; clinicService.getClinic().then(c=>{if(active)setClinic(c)}).catch(console.error);return()=>{active=false};},[]);
 return clinic;
}
