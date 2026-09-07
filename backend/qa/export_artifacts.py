"""Generate inventory and Postman v2.1 requests from the actual Django router.

Run: PYTHONPATH=backend DJANGO_SETTINGS_MODULE=config.settings.test .venv/bin/python -m qa.export_artifacts
"""
import json
import os
from collections import defaultdict
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.test')
import django
django.setup()
from qa.endpoints import endpoints, module, allowed_roles, ROLES  # noqa: E402 — Django must be initialized before these imports.

ROOT = Path(__file__).resolve().parents[2]
VARIABLES = {
    'base_url': 'http://127.0.0.1:8000', 'access_token': '', 'refresh_token': '',
    'patient_token': '', 'doctor_token': '', 'admin_token': '', 'clinic_owner_token': '', 'super_admin_token': '',
    'patient_b_token': '', 'booking_id': '', 'appointment_id': '', 'doctor_id': '', 'clinic_id': '',
    'patient_id': '', 'owner_id': '', 'admin_id': '', 'specialty_id': '', 'service_id': '', 'affiliation_id': '',
    'review_id': '', 'notification_id': '', 'break_id': '', 'blocked_time_id': '', 'image_id': '', 'log_id': '',
    'latitude': '41.3111', 'longitude': '69.2797', 'radius': '5', 'date': '', 'time': '',
    'next_time': '', 'booking_weekday': '', 'q': 'QA', 'telegram_user_id': '123456', 'telegram_bot_secret': '',
    'telegram_link_code': '', 'reset_uid': '', 'reset_token': '', 'test_password': '', 'new_password': '',
    'patient_email': 'qa.patient@docnear.example', 'patient_b_email': 'qa.patient-b@docnear.example',
    'doctor_email': 'qa.doctor@docnear.example', 'clinic_owner_email': 'qa.owner@docnear.example',
    'admin_email': 'qa.admin@docnear.example', 'super_admin_email': 'qa.super-admin@docnear.example',
    'created_email': 'qa.created-{{$guid}}@docnear.example', 'created_slug': 'qa-{{$guid}}',
}
for role in ['patient', 'patient_b', 'doctor', 'clinic_owner', 'admin', 'super_admin']:
    VARIABLES[role + '_refresh_token'] = ''

def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + '\n')


def id_variable(path):
    if '/favorites/' in path:
        return 'doctor_id' if '/doctors/' in path else 'clinic_id'
    names = {'appointments':'appointment_id','doctors':'doctor_id','clinics':'clinic_id','patients':'patient_id',
             'owners':'owner_id','admin-users':'admin_id','specialties':'specialty_id','services':'service_id',
             'affiliations':'affiliation_id','reviews':'review_id','notifications':'notification_id',
             'breaks':'break_id','blocked-times':'blocked_time_id','clinic-images':'image_id','logs':'log_id'}
    return next((names[p] for p in path.split('/') if p in names), 'id')


def bearer(path, method):
    roles = allowed_roles(path, method)
    if roles is None or 'anonymous' in roles:
        return None
    for role in ['patient','doctor','clinic_owner','admin','super_admin']:
        if role in roles:
            return role + '_token'
    return 'access_token'


def body_for(path, method):
    if method not in {'POST','PATCH'}:
        return None
    if path == '/api/auth/register/':
        return {'email':'{{created_email}}','first_name':'QA Patient','password':'{{test_password}}'}
    if path == '/api/auth/login/':
        return {'identifier':'{{patient_email}}','password':'{{test_password}}'}
    if path in ['/api/auth/token/refresh/', '/api/auth/logout/']:
        return {'refresh':'{{refresh_token}}'}
    if path == '/api/auth/change-password/':
        return {'old_password':'{{test_password}}','new_password':'{{new_password}}'}
    if path == '/api/auth/forgot-password/':
        return {'email':'{{patient_email}}'}
    if path == '/api/auth/reset-password/':
        return {'uid':'{{reset_uid}}','token':'{{reset_token}}','new_password':'{{new_password}}'}
    if path in ['/api/auth/me/', '/api/profile/']:
        return {'first_name':'QA Patient'}
    if path == '/api/telegram/link/':
        return {'code':'{{telegram_link_code}}','telegram_user_id':'{{telegram_user_id}}'}
    if path.endswith('/reschedule/'):
        return {'date':'{{date}}','time':'{{next_time}}'}
    if path.endswith('/cancel/') or path.endswith('/reject/'):
        return {'reason':'QA cancellation; fictional data'}
    if path.endswith('/appointments/') and method == 'POST':
        return {'doctor_id':'{{doctor_id}}','clinic_id':'{{clinic_id}}','date':'{{date}}','time':'{{time}}','patient_note':'QA booking; no real health data'}
    if '/appointments/{pk}/' in path and method == 'PATCH':
        return {'status':'confirmed','reason':''}
    if path.endswith('/availability/toggle/'):
        return {'available':True}
    if path == '/api/doctor-panel/schedule/':
        return {'schedules':[{'clinic':'{{clinic_id}}','day_of_week':'{{booking_weekday}}','start_time':'09:00','end_time':'17:00','is_working':True}],
                'policies':[{'clinic':'{{clinic_id}}','consultation_duration':30,'buffer_time':0,'max_appointments_per_day':20}]}
    if path.endswith('/breaks/'):
        return {'clinic':'{{clinic_id}}','date':'{{date}}','start_time':'12:00','end_time':'13:00','reason':'QA break'}
    if path.endswith('/blocked-times/'):
        return {'clinic':'{{clinic_id}}','start_datetime':'{{date}}T15:00:00+05:00','end_datetime':'{{date}}T16:00:00+05:00','reason':'QA time away'}
    if path == '/api/doctor-panel/profile/':
        return {'bio':'Fictional QA doctor profile','education':'Fictional credential pending review','languages':['Uzbek','English']}
    if path == '/api/admin-panel/settings/':
        return {'support_email':'qa.support@docnear.example','support_phone':'','maintenance_message':'QA instance'}
    if path == '/api/clinic-owner/services/':
        return {'services':['{{service_id}}']}
    if path.endswith('/notifications/send/'):
        return {'user_id':'{{patient_id}}','title':'QA notification','message':'Fictional test message'}
    if path.endswith('/notifications/broadcast/'):
        return {'role':'doctor','title':'QA broadcast','message':'Fictional test message'}
    if path == '/api/reviews/' and method == 'POST':
        return {'appointment':'{{appointment_id}}','rating':5,'comment':'Fictional QA review'}
    if path.endswith('/doctors/') and method == 'POST':
        return {'account':{'email':'{{created_email}}','first_name':'QA Doctor','password':'{{test_password}}'},'clinic':'{{clinic_id}}','specialty':'{{specialty_id}}'}
    if '/doctors/{pk}/' in path and method == 'PATCH':
        return {'consultation_duration':30,'buffer_time':0,'max_appointments_per_day':20} if '/clinic-owner/' in path else {'bio':'Updated fictional QA profile'}
    if path.endswith('/clinics/') and method == 'POST':
        return {'owner':'{{owner_id}}','name':'QA Clinic','slug':'{{created_slug}}','address':'Fictional test address','latitude':41.3111,'longitude':69.2797,'working_hours':{str(i):[['08:00','18:00']] for i in range(7)}}
    if (path.endswith('/clinics/{pk}/') or path.endswith('/clinic/')) and method == 'PATCH':
        return {'description':'Updated fictional QA clinic'}
    if '/affiliations/' in path:
        return {'doctor':'{{doctor_id}}','clinic':'{{clinic_id}}','specialty':'{{specialty_id}}','consultation_duration':30,'buffer_time':0,'max_appointments_per_day':20} if method == 'POST' else {'buffer_time':0}
    if any(f'/{name}/' in path for name in ['specialties','services']):
        return {'name':'QA care','slug':'{{created_slug}}','icon_name':'heart-pulse','description':'Fictional test item'} if method == 'POST' else {'description':'Updated fictional QA item'}
    if any(f'/{name}/' in path for name in ['owners','admin-users','patients']):
        return {'email':'{{created_email}}','first_name':'QA Staff','password':'{{test_password}}'} if '{pk}' not in path else {'first_name':'QA Updated'} if method == 'PATCH' else {}
    return {}


def expected_status(path, method):
    if method == 'DELETE':
        return 200 if path in {'/api/admin-panel/clinics/{pk}/','/api/admin-panel/doctors/{pk}/'} else 204
    if method == 'POST' and (path.endswith(('/register/','/link-code/','/broadcast/','/send/')) or path.split('/')[-2] in ['appointments','clinics','doctors','specialties','services','clinic-images','affiliations','admin-users','owners','reviews','breaks','blocked-times']):
        return 201
    if method == 'POST' and '/favorites/' in path:
        return 201
    return 200


def request_item(path, method, name=None, token=None, body=None, status=None, extra_tests=(), params=None):
    raw = '{{base_url}}' + path.replace('{pk}', '{{'+id_variable(path)+'}}').replace('{booking_id}', '{{booking_id}}')
    query = params if params is not None else ({'date':'{{date}}','clinic_id':'{{clinic_id}}'} if path.endswith('/availability/') else {'latitude':'{{latitude}}','longitude':'{{longitude}}','radius':'{{radius}}'} if path.endswith('/nearby/') else {'q':'{{q}}'} if path.endswith('/search/') else {})
    if query:
        raw += '?' + '&'.join(f'{key}={value}' for key,value in query.items())
    selected_token = token or bearer(path, method)
    request = {'method':method, 'url':raw, 'header':[{'key':'Accept','value':'application/json'}],
               'auth':{'type':'bearer','bearer':[{'key':'token','value':'{{'+selected_token+'}}','type':'string'}]} if selected_token else {'type':'noauth'},
               'description':'Expected success requires valid QA IDs and the appropriate record state. Examples are illustrative, not captured production data. See docs/qa/API_TESTING_REPORT.md. Do not run mutation folders against production.'}
    if allowed_roles(path, method) is None:
        request['header'] += [{'key':'X-Telegram-Bot-Secret','value':'{{telegram_bot_secret}}'},{'key':'X-Telegram-User-Id','value':'{{telegram_user_id}}'}]
    payload = body if body is not None else body_for(path, method)
    if '/clinic-images/' in path and method in {'POST','PATCH'}:
        request['body'] = {'mode':'formdata','formdata': ([{'key':'clinic','value':'{{clinic_id}}','type':'text'}, {'key':'image','type':'file','src':[]}] if method == 'POST' else [{'key':'order','value':'1','type':'text'}])}
    elif payload is not None:
        request['header'].append({'key':'Content-Type','value':'application/json'})
        request['body'] = {'mode':'raw','raw':json.dumps(payload,indent=2),'options':{'raw':{'language':'json'}}}
    status = status or expected_status(path, method)
    allowed_status = [status,200] if '/favorites/' in path and method=='POST' else [status]
    example = {'success':True,'data':{}}
    if method == 'GET' and '{pk}' not in path and any(part in path for part in ['/clinics/','/doctors/','/appointments/','/notifications/','/favorites/','/patients/','/specialties/','/services/','/reviews/','/owners/','/logs/','/admin-users/','/affiliations/','/breaks/','/blocked-times/']):
        example['data'] = {'count':0,'next':None,'previous':None,'results':[]}
    if status == 409:
        example = {'success':False,'code':'slot_unavailable','message':'This appointment time is no longer available.','errors':{}}
    if method == 'POST' and path.endswith('/appointments/') and status == 201:
        example['data'] = {'id':'{{appointment_id}}','booking_id':'DN-20260907-ABCDEF1234','doctor':'{{doctor_id}}','clinic':'{{clinic_id}}','patient':'{{patient_id}}','status':'pending','appointment_date':'{{date}}','start_time':'{{time}}','end_time':'09:30:00'}
    scripts = [f'pm.test("Expected HTTP status", () => pm.expect({allowed_status}).to.include(pm.response.code));']
    if path not in {'/api/docs/','/api/schema/'} and status != 204:
        scripts += ['const result = pm.response.json();', f'pm.test("Response envelope", () => pm.expect(result.success).to.eql({str(status < 400).lower()}));']
    scripts.extend(extra_tests)
    if path == '/api/auth/login/' and not extra_tests:
        scripts += ['if (pm.response.code === 200) { const d=pm.response.json().data; pm.environment.set("access_token",d.access); pm.environment.set("refresh_token",d.refresh); pm.environment.set(d.user.role+"_token",d.access); }']
    if path == '/api/auth/token/refresh/':
        scripts += ['if (pm.response.code === 200) { const d=pm.response.json().data; pm.environment.set("access_token",d.access); pm.environment.set("patient_token",d.access); pm.environment.set("refresh_token",d.refresh); pm.environment.set("patient_refresh_token",d.refresh); }']
    if path == '/api/telegram/link-code/' and method == 'POST':
        scripts += ['if(pm.response.code===201)pm.environment.set("telegram_link_code",pm.response.json().data.code);']
    return {'name':name or f'{method} {path}', 'request':request,
            'event':[{'listen':'test','script':{'type':'text/javascript','exec':scripts}}],
            'response':[{'name':f'Expected {status} (illustrative)', 'originalRequest':request, 'status':{200:'OK',201:'Created',204:'No Content',409:'Conflict'}.get(status,'Expected'), 'code':status,
                         '_postman_previewlanguage':'json', 'header':[{'key':'Content-Type','value':'application/json'}], 'body':'' if status == 204 else json.dumps(example,indent=2)}]}


def e2e():
    items=[]
    for role in ['patient','patient_b','doctor','clinic_owner','admin','super_admin']:
        tests=[f'if(pm.response.code===200){{const d=pm.response.json().data;pm.environment.set("{role}_token",d.access);pm.environment.set("{role}_refresh_token",d.refresh);'+('pm.environment.set("access_token",d.access);pm.environment.set("refresh_token",d.refresh);pm.environment.set("patient_id",d.user.id);' if role=='patient' else '')+'}']
        items.append(request_item('/api/auth/login/','POST',f'Login {role}',body={'email':'{{'+role+'_email}}','password':'{{test_password}}'},extra_tests=tests))
    items.append(request_item('/api/clinics/nearby/','GET','Find nearby QA clinic',extra_tests=['pm.test("Seeded clinic is nearby",()=>pm.expect(result.data.results.some(c=>String(c.id)===String(pm.environment.get("clinic_id")))).to.eql(true));']))
    items.append(request_item('/api/clinics/{pk}/','GET','Select the doctor at the clinic',extra_tests=['pm.test("Doctor belongs to clinic",()=>pm.expect(result.data.doctors.some(d=>String(d.id)===String(pm.environment.get("doctor_id")))).to.eql(true));']))
    items.append(request_item('/api/doctors/{pk}/availability/','GET','Choose a real available slot',extra_tests=['const free=result.data.slots.filter(s=>s.available);pm.test("At least one slot is available",()=>pm.expect(free.length).to.be.greaterThan(0));if(free.length){pm.environment.set("time",free[0].time);if(free[1])pm.environment.set("next_time",free[1].time);}']))
    items.append(request_item('/api/appointments/','POST','Patient requests appointment',extra_tests=['if(pm.response.code===201){pm.environment.set("appointment_id",result.data.id);pm.environment.set("booking_id",result.data.booking_id);}', r'pm.test("Booking ID is generated",()=>pm.expect(result.data.booking_id).to.match(/^DN-\d{8}-[A-F0-9]{10}$/));']))
    items.append(request_item('/api/doctor-panel/appointments/{pk}/','GET','Doctor sees pending booking',extra_tests=['pm.test("Pending",()=>pm.expect(result.data.status).to.eql("pending"));']))
    items.append(request_item('/api/doctor-panel/appointments/{pk}/accept/','POST','Doctor confirms booking',extra_tests=['pm.test("Confirmed",()=>pm.expect(result.data.status).to.eql("confirmed"));']))
    for prefix,role in [('','patient'),('admin-panel/','admin'),('clinic-owner/','clinic_owner'),('admin-panel/','super_admin')]:
        items.append(request_item('/api/'+prefix+'appointments/{pk}/','GET',f'{role} sees the same confirmed booking',token=role+'_token',extra_tests=['pm.test("Shared booking and status",()=>{pm.expect(result.data.booking_id).to.eql(pm.environment.get("booking_id"));pm.expect(result.data.status).to.eql("confirmed");});']))
    items.append(request_item('/api/appointments/','POST','Second patient cannot double-book',token='patient_b_token',status=409,extra_tests=['pm.test("Slot unavailable",()=>pm.expect(result.code).to.eql("slot_unavailable"));']))
    items.append(request_item('/api/appointments/{pk}/cancel/','POST','Cleanup: cancel QA booking'))
    return {'name':'00 End-to-end booking verification','description':'Run after seed_qa and filling environment variables. Uses six role logins. No real users or production data. Tokens stay in your local Postman environment. Final step cancels the test appointment.', 'item':items}


def main():
    ops=endpoints()
    grouped=defaultdict(list)
    for path,method in ops:
        grouped[module(path)].append((path,method))
    inventory=['# DocNear API endpoint inventory','','Generated from the Django URL resolver. Base URL: `http://127.0.0.1:8000`.','',
        f'{len(ops)} API method/path combinations. `HEAD`/`OPTIONS` and router format suffix aliases are omitted. `/health/`, Django `/admin/`, and router navigation roots are listed separately below.','',
        'Pagination: `data.results`, `data.count`, `data.next`, `data.previous`; page size defaults to 20 (maximum 100). All appointment times use Asia/Tashkent.','']
    inventory += ['Personal routes are role-scoped. Super admins have platform-wide record access through `/api/admin-panel/`; they do not impersonate a patient, doctor or owner. This differs from a literal “all URLs” reading of the prompt.','']
    folders=[e2e()]
    for group,entries in grouped.items():
        inventory += [f'## {group}', '']
        folder={'name':group,'item':[]}
        for path,method in entries:
            roles=allowed_roles(path,method)
            label='Bot secret + linked patient' if roles is None else 'Public' if 'anonymous' in roles else ', '.join(role for role in ROLES if role in roles)
            inventory.append(f'- `{method} {path}` — {label}.')
            folder['item'].append(request_item(path,method))
        inventory.append('')
        folders.append(folder)
    inventory += ['## Infrastructure and navigation','', '- `GET /health/` — database readiness; 200 or sanitized 503.', '- `/admin/` — Django session-based administration; not a JWT API.', '- `GET /api/`, `/api/doctor-panel/`, `/api/admin-panel/`, `/api/clinic-owner/`, `/api/telegram/` — DRF router navigation roots, no business data.', '', 'The clinic owner doctor detail ID is the DoctorClinic affiliation ID, not DoctorProfile ID. Use `affiliation_id` there.']
    # Owner doctor endpoints intentionally use affiliation primary keys.
    for folder in folders:
        for item in folder['item']:
            if '/api/clinic-owner/doctors/{{doctor_id}}/' in item['request']['url']:
                item['request']['url']=item['request']['url'].replace('{{doctor_id}}','{{affiliation_id}}')
    collection={'info':{'name':'DocNear — Full API QA','description':'Complete route inventory plus a runnable booking acceptance flow. Import the environment and read postman/README.md. Mutations require suitable fixture states; do not run the whole inventory as one sequential workflow.','schema':'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},
                'variable':[{'key':key,'value':value,'type':'string'} for key,value in VARIABLES.items()],
                'event':[{'listen':'prerequest','script':{'type':'text/javascript','exec':[
                    'if (!pm.environment.get("date")) { const day=new Date(Date.now()+86400000+5*3600000); pm.environment.set("date",day.toISOString().slice(0,10)); pm.environment.set("booking_weekday",(day.getUTCDay()+6)%7); }']}}], 'item':folders}
    dump(ROOT/'postman/DocNear.postman_collection.json', collection)
    dump(ROOT/'postman/DocNear.local.postman_environment.json', {'name':'DocNear local QA','_postman_variable_scope':'environment','values':[{'key':key,'value':value,'enabled':True,'type':'secret' if ('token' in key or 'password' in key or 'secret' in key) else 'default'} for key,value in VARIABLES.items()]})
    dump(ROOT/'docs/qa/endpoints.json',[{'path':path,'method':method,'module':module(path),'allowed_roles':sorted(allowed_roles(path,method)) if allowed_roles(path,method) is not None else None} for path,method in ops])
    (ROOT/'docs/qa/API_ENDPOINTS.md').write_text('\n'.join(inventory)+'\n')
    print(f'Exported {len(ops)} operations and {len(folders[0]["item"])} E2E requests; no credentials embedded.')

if __name__=='__main__':
    main()
