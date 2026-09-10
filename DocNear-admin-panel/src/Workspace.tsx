import {useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {ChevronLeft,ChevronRight,Plus,RefreshCw,Search,X,AlertCircle} from 'lucide-react';
import {adminClinicService} from './services/adminClinicService';
import {adminDoctorService} from './services/adminDoctorService';
import {adminPatientService} from './services/adminPatientService';
import {adminAppointmentService} from './services/adminAppointmentService';
import {adminSpecialtyService} from './services/adminSpecialtyService';
import {adminServiceService} from './services/adminServiceService';
import {adminReviewService} from './services/adminReviewService';
import {adminUserService} from './services/adminUserService';
import {adminNotificationService} from './services/adminNotificationService';
import {resourceService,settingsService,RecordData} from './services/resourceService';

type Field={key:string;label:string;type?:string;required?:boolean;options?:string[];createOnly?:boolean};
const field=(key:string,label:string,type='text',required=false):Field=>({key,label,type,required});
const account=[field('first_name','First name','text',true),field('last_name','Last name'),field('email','Email','email',true),field('password','Password','password',true)];
const catalog=[field('name','Name','text',true),field('slug','Slug','text',true),field('description','Description','textarea'),field('icon_name','Vector icon name'),field('is_active','Active','checkbox')];
const clinicFields=[field('owner','Owner user ID','number',true),field('name','Name','text',true),field('slug','Slug','text',true),field('address','Address','text',true),field('latitude','Latitude','number',true),field('longitude','Longitude','number',true),field('phone','Phone'),field('email','Email','email'),field('description','Description','textarea'),field('working_hours','Working hours','hours'),field('is_24_7','Open 24 hours','checkbox'),field('has_emergency_service','Emergency services','checkbox')];
const doctorFields=[...account.map(f=>({...f,key:'account_'+f.key,createOnly:true})),field('clinic','Clinic ID','number'),field('specialty','Specialty ID','number'),field('bio','Biography','textarea'),field('experience_years','Experience years','number'),field('education','Education','textarea'),field('languages','Languages, comma separated','list'),field('certifications','Certifications, comma separated','list')];
type Resource={title:string;service:ReturnType<typeof resourceService>;columns:string[];fields:Field[];create?:boolean;actions?:string[];filter?:string};
export const resources:Record<string,Resource>={
 clinics:{title:'Clinics',service:adminClinicService,columns:['id','name','address','is_verified','is_partner','is_active'],fields:clinicFields,create:true,actions:['verify','mark-partner','remove-partner','disable','enable'],filter:'is_active'},
 doctors:{title:'Doctors',service:adminDoctorService,columns:['id','name','is_verified','is_active'],fields:doctorFields,create:true,actions:['verify','suspend','activate'],filter:'is_verified'},
 patients:{title:'Patients',service:adminPatientService,columns:['id','name','email','phone_number','booking_count','is_active'],fields:[field('first_name','First name'),field('last_name','Last name')],actions:['disable','enable'],filter:'is_active'},
 appointments:{title:'Appointments',service:adminAppointmentService,columns:['booking_id','patient_name','doctor_name','clinic_name','appointment_date','start_time','status'],fields:[],actions:['cancel','reschedule'],filter:'status'},
 specialties:{title:'Specialties',service:adminSpecialtyService,columns:['id','name','icon_name','is_active'],fields:[...catalog,field('search_aliases','Search aliases')],create:true},
 services:{title:'Services',service:adminServiceService,columns:['id','name','is_active'],fields:catalog,create:true},
 reviews:{title:'Reviews',service:adminReviewService,columns:['id','doctor','clinic','rating','comment','is_visible'],fields:[],actions:['approve','hide'],filter:'is_visible'},
 notifications:{title:'Notifications',service:{...resourceService('notifications'),list:adminNotificationService.list},columns:['id','user','title','type','is_read','created_at'],fields:[],filter:'is_read'},
 'admin-users':{title:'Admin users',service:adminUserService,columns:['id','name','email','is_active'],fields:account.map(f=>({...f,createOnly:f.key==='password'||f.key==='email'})),create:true,actions:['enable','disable']},
 owners:{title:'Clinic owners',service:resourceService('owners'),columns:['id','name','email','is_active'],fields:account.map(f=>({...f,createOnly:f.key==='password'||f.key==='email'})),create:true,actions:['enable','disable']}
};
export function ErrorBox({error}:{error:unknown}){return <div className="error-box" role="alert"><AlertCircle size={18}/>{error instanceof Error?error.message:'Unable to complete the request'}</div>}
export function RecordForm({title,fields,initial={},onSave,onClose}:{title:string;fields:Field[];initial?:RecordData;onSave:(v:RecordData)=>Promise<unknown>;onClose:()=>void}){
 const defaults=Object.fromEntries(fields.map(f=>[f.key,f.type==='list'?(initial[f.key]||[]).join(', '):initial[f.key]??(f.type==='checkbox'?f.key==='is_active':f.key==='icon_name'?'stethoscope':'')]));
 const {register,handleSubmit}=useForm({defaultValues:defaults});const [error,setError]=useState<unknown>(null);const [busy,setBusy]=useState(false);
 const [hours,setHours]=useState<Record<string,string[][]>>(initial.working_hours||{});
 const submit=handleSubmit(async raw=>{
  setBusy(true);setError(null);
  try{
   const values:RecordData={};
   for(const f of fields){
    if(f.type==='hours'){values[f.key]=hours;continue}
    let value=raw[f.key];
    if(f.type==='number') {if(value===''||value==null){if(f.required)throw new Error(f.label+' is required');continue}value=z.coerce.number().finite().parse(value);}
    else if(f.type==='list')value=String(value||'').split(',').map(v=>v.trim()).filter(Boolean);
    else if(f.type==='password')value=z.string().min(10,'Use at least 10 characters').parse(value);
    else if(f.type==='email'&&value)value=z.string().email().parse(value);
    else if(f.required)value=z.string().trim().min(1,f.label+' is required').parse(value);
    if(f.key==='icon_name'&&value)value=z.string().regex(/^[a-z][a-z0-9-]*$/,'Use an icon name such as stethoscope').parse(value);
    values[f.key]=value;
   }
   if(values.account_email){values.account={};for(const k of Object.keys(values).filter(k=>k.startsWith('account_'))){values.account[k.slice(8)]=values[k];delete values[k]}}
   await onSave(values);onClose();
  }catch(e){setError(e)}finally{setBusy(false)}
 });
 return <div className="modal-backdrop"><form className="modal-card" role="dialog" aria-label={title} onSubmit={submit}><div className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div><div className="form-grid">
 {fields.map(f=>f.type==='hours'?<fieldset key={f.key}><legend>Working hours</legend>{['0','1','2','3','4','5','6'].map(day=><div className="hours-row" key={day}><label><input type="checkbox" checked={!!hours[day]?.length} onChange={e=>setHours(h=>({...h,[day]:e.target.checked?[['09:00','17:00']]:[]}))}/>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][Number(day)]}</label>{hours[day]?.[0]?.map((v,i)=><input key={i} type="time" aria-label={day+(i?' closes':' opens')} value={v} onChange={e=>setHours(h=>({...h,[day]:[[i===0?e.target.value:h[day][0][0],i===1?e.target.value:h[day][0][1]]]}))}/>)}</div>)}</fieldset>:<label key={f.key}>{f.label}{f.type==='textarea'?<textarea {...register(f.key)} rows={3}/>:f.options?<select {...register(f.key)}>{f.options.map(o=><option key={o}>{o}</option>)}</select>:<input {...register(f.key)} type={f.type==='list'?'text':f.type||'text'} required={f.required} step={f.type==='number'?'any':undefined} autoComplete={f.type==='password'?'new-password':undefined}/>}</label>)}
 </div>{!!error&&<ErrorBox error={error}/>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy?'Saving...':'Save'}</button></div></form></div>
}
export function ResourcePage({type}:{type:string}){
 const resource=resources[type];const [search,setSearch]=useState('');const [page,setPage]=useState(1);const [filter,setFilter]=useState('');const [create,setCreate]=useState(false);const client=useQueryClient();
 const q=useQuery({queryKey:[type,search,page,filter],queryFn:()=>resource.service.list({search:search||undefined,page,page_size:20,...(filter&&resource.filter?{[resource.filter]:filter}:{})}),refetchInterval:30000});
 const rows=q.data?.results||[];
 return <><div className="page-heading"><h1>{resource.title}</h1><div className="heading-actions"><div className="search-box"><Search size={16}/><input aria-label="Search records" placeholder={type==='appointments'?'Search Booking ID':'Search records'} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></div>{resource.filter&&<select aria-label="Filter records" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}}><option value="">All</option>{(resource.filter==='status'?['pending','confirmed','waiting','in_progress','completed','cancelled','rejected','no_show']:['true','false']).map(v=><option key={v}>{v}</option>)}</select>}{resource.create&&<button className="primary" onClick={()=>setCreate(true)}><Plus size={16}/>Add {resource.title}</button>}{type==='notifications'&&<button className="primary" onClick={()=>setCreate(true)}>Send notification</button>}</div></div>
 {q.isError?<ErrorBox error={q.error}/>:q.isLoading?<p role="status">Loading records...</p>:<div className="panel table-panel"><div className="table-meta">{q.data?.count} records <button className="icon-button" aria-label="Refresh" onClick={()=>q.refetch()}><RefreshCw size={16}/></button></div><div className="table-wrap"><table><thead><tr>{resource.columns.map(c=><th key={c}>{c.replaceAll('_',' ')}</th>)}<th>Details</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}>{resource.columns.map(c=><td key={c}>{typeof row[c]==='boolean'?(row[c]?'Yes':'No'):String(row[c]??'—')}</td>)}<td><Link to={'/'+type+'/'+row.id}>View</Link></td></tr>)}</tbody></table>{!rows.length&&<p className="empty-state">No records found.</p>}</div><div className="table-meta"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/>Previous</button><span>Page {page}</span><button disabled={!q.data?.next} onClick={()=>setPage(p=>p+1)}>Next<ChevronRight size={16}/></button></div></div>}
 {create&&<RecordForm title={type==='notifications'?'Send notification':'Add '+resource.title} fields={type==='notifications'?[field('user_id','Recipient user ID','number',true),field('title','Title','text',true),field('message','Message','textarea',true)]:resource.fields} onClose={()=>setCreate(false)} onSave={async data=>{if(type==='notifications')await adminNotificationService.send(data);else await resource.service.save(undefined,data);await client.invalidateQueries({queryKey:[type]})}}/>}</>
}
export function DetailPage({type}:{type:string}){
 const {id}=useParams();const r=resources[type];const [editing,setEditing]=useState(false);const [action,setAction]=useState('');const [error,setError]=useState<unknown>(null);const [busy,setBusy]=useState(false);const cache=useQueryClient();
 const q=useQuery({queryKey:[type,id],queryFn:()=>r.service.get(id!),enabled:!!id,refetchInterval:30000});
 async function mutate(fn:()=>Promise<unknown>){setBusy(true);setError(null);try{await fn();await cache.invalidateQueries({queryKey:[type]})}catch(e){setError(e);throw e}finally{setBusy(false)}}
 if(q.isLoading)return <p>Loading record...</p>;if(q.isError)return <ErrorBox error={q.error}/>;
 const record=q.data||{};
 return <><Link to={'/'+type}>Back to {r.title}</Link><div className="page-heading"><h1>{record.name||record.booking_id||r.title+' '+id}</h1><div className="heading-actions">{r.fields.length>0&&<button className="primary" onClick={()=>setEditing(true)}>Edit</button>}{r.actions?.map(a=><button className="secondary" disabled={busy} key={a} onClick={()=>setAction(a)}>{a.replaceAll('-',' ')}</button>)}</div></div>{!!error&&<ErrorBox error={error}/>}<div className="detail-grid">{Object.entries(record).filter(([k])=>!['appointments','appointment_history'].includes(k)).map(([k,v])=><div className="detail-field" key={k}><span>{k.replaceAll('_',' ')}</span><strong>{typeof v==='object'?JSON.stringify(v):String(v??'—')}</strong></div>)}</div>
 {record.appointments?.length>0&&<div className="panel"><h2>Appointments</h2>{record.appointments.map((a:RecordData)=><p key={a.id}><Link to={'/appointments/'+a.id}>{a.booking_id}</Link> {a.status}</p>)}</div>}
 {editing&&<RecordForm title={'Edit '+r.title} fields={r.fields.filter(f=>!f.createOnly)} initial={record} onClose={()=>setEditing(false)} onSave={data=>mutate(()=>r.service.save(id,data))}/>}
 {action&&<RecordForm title={action.replaceAll('-',' ')+' — '+(record.booking_id||record.name||id)} fields={action==='reschedule'?[field('date','New date','date',true),field('time','New time','time',true)]:action==='cancel'?[field('reason','Cancellation reason','textarea',true)]:[]} onClose={()=>setAction('')} onSave={data=>mutate(()=>r.service.action(id!,action,data))}/>}</>
}
export function SettingsPage(){
 const q=useQuery({queryKey:['platform-settings'],queryFn:settingsService.get});const [editing,setEditing]=useState(false);const cache=useQueryClient();
 if(q.isLoading)return <p>Loading settings...</p>;if(q.isError)return <ErrorBox error={q.error}/>;
 const fields=[field('support_email','Support email','email'),field('support_phone','Support phone'),field('maintenance_message','Maintenance message','textarea')];
 return <><h1>Platform settings</h1><div className="panel">{fields.map(f=><p key={f.key}><b>{f.label}:</b> {q.data?.[f.key]||'Not configured'}</p>)}<button className="primary" onClick={()=>setEditing(true)}>Edit settings</button></div>{editing&&<RecordForm title="Platform settings" fields={fields} initial={q.data} onClose={()=>setEditing(false)} onSave={async data=>{await settingsService.save(data);await cache.invalidateQueries({queryKey:['platform-settings']})}}/>}</>
}
