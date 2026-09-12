import {chromium,expect as baseExpect,request} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const expect=baseExpect.configure({timeout:20000});
const root=resolve('../..'),dir=resolve(root,'.runtime/integration');
const v=Object.fromEntries(JSON.parse(readFileSync(resolve(dir,'postman.env.json'),'utf8')).values.map(v=>[v.key,v.value]));
const booking=JSON.parse(readFileSync(resolve(dir,'e2e-appointment.json'),'utf8'));
const api=await request.newContext({baseURL:'http://127.0.0.1:8001/api/v1/'});
const login=async phone=>{let r=await api.post('auth/request-otp/',{data:{phone_number:phone,purpose:'login',channel:'sms'}});expect(r.status()).toBe(200);r=await api.post('auth/verify-otp/',{data:{phone_number:phone,purpose:'login',code:v.otp_test_code}});expect(r.status()).toBe(200);return (await r.json()).data};
const register=async phone=>{let r=await api.post('auth/request-otp/',{data:{phone_number:phone,purpose:'register',channel:'sms',first_name:'QA Register'}});expect(r.status()).toBe(200);r=await api.post('auth/verify-otp/',{data:{phone_number:phone,purpose:'register',code:v.otp_test_code}});expect(r.status()).toBe(200);return (await r.json()).data};
const loginUi=async(page,port,phone)=>{await page.goto('http://localhost:'+port+'/login');await page.locator('input[type=tel]').fill(phone);await page.getByRole('button',{name:'Tasdiqlash kodini yuborish',exact:true}).click();await page.locator('input[inputmode=numeric]').fill(v.otp_test_code);await page.getByRole('button',{name:'Tasdiqlash',exact:true}).click();await expect(page).not.toHaveURL(/login/)};
const patient=await login(v.patient_phone),patientB=await login(v.patient_b_phone),admin=await login(v.super_admin_phone);
const headers=t=>({Authorization:'Bearer '+t.access});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/google/chrome/chrome',headless:true});
const adminPage=await browser.newPage(),ownerPage=await browser.newPage();
const errors=[];for(const page of [adminPage,ownerPage])page.on('pageerror',e=>errors.push(e.message));
const report={};
try{
 const registered=await register('+99894'+Date.now().toString().slice(-7));
 expect(registered.user.role).toBe('patient');
 report.phoneRegisterOtp=true;
 for(const [page,port,phone] of [[adminPage,3003,v.super_admin_phone],[ownerPage,3004,v.clinic_owner_phone]]){
  await loginUi(page,port,phone);
  await page.goto('http://localhost:'+port+'/appointments');
  await page.getByRole('textbox',{name:'Search records'}).fill(booking.booking_id);
  await expect(page.getByText(booking.booking_id,{exact:true})).toBeVisible();
  await expect(page.getByRole('cell',{name:'confirmed',exact:true})).toBeVisible();
  await page.screenshot({path:resolve(dir,port===3003?'admin-confirmed.png':'owner-confirmed.png'),fullPage:true});
 }
 report.adminAndOwnerSeeConfirmed=true;
 await adminPage.getByRole('link',{name:'View',exact:true}).click();
 await expect(adminPage.getByRole('heading',{name:booking.booking_id,exact:true})).toBeVisible();
 report.adminDetailRoute=true;
 // Exercise a real admin create/edit workflow through the form.
 await adminPage.goto('http://localhost:3003/specialties');
 await adminPage.getByRole('button',{name:'Add Specialties',exact:true}).click();
 const suffix=Date.now().toString();
 let dialog=adminPage.getByRole('dialog');
 await dialog.getByLabel('Name',{exact:true}).fill('QA Specialty '+suffix);
 await dialog.getByLabel('Slug',{exact:true}).fill('qa-specialty-'+suffix);
 const created=adminPage.waitForResponse(r=>r.url().endsWith('/admin-panel/specialties/')&&r.request().method()==='POST');
 await dialog.getByRole('button',{name:'Save',exact:true}).click();
 expect((await created).status()).toBe(201);
 await adminPage.getByRole('textbox',{name:'Search records'}).fill('QA Specialty '+suffix);
 await adminPage.getByRole('link',{name:'View',exact:true}).click();
 await adminPage.getByRole('button',{name:'Edit',exact:true}).click();
 dialog=adminPage.getByRole('dialog');
 await dialog.getByLabel('Description').fill('Fictional integration test specialty.');
 await dialog.getByRole('button',{name:'Save',exact:true}).click();
 await expect(dialog).not.toBeVisible();
 await expect(adminPage.getByText('Fictional integration test specialty.',{exact:true})).toBeVisible();
 report.adminCreateEdit=true;
 const apt=await api.get('appointments/'+booking.id+'/',{headers:headers(patient)});
 const current=(await apt.json()).data;
 const duplicate=await api.post('appointments/',{headers:headers(patientB),data:{doctor_id:current.doctor,clinic_id:current.clinic,date:current.appointment_date,time:current.start_time}});
 expect(duplicate.status()).toBe(409);
 const duplicateBody=await duplicate.json();expect(duplicateBody.code).toBe('slot_unavailable');
 report.secondPatientBlocked=true;
 const near=await api.get('clinics/nearby/?latitude=41.3111&longitude=69.2797&radius=50');
 expect((await near.json()).data.results.some(c=>c.id===Number(v.clinic_id))).toBe(true);
 report.nearby=true;
 // Clinic owner cannot read or change a clinic outside the account scope.
 const owner=await login(v.clinic_owner_phone);
 const otherOwner=await api.post('admin-panel/owners/',{headers:headers(admin),data:{first_name:'QA Scope',phone_number:'+99893'+suffix.slice(-7)}});
 expect(otherOwner.status()).toBe(201);const ownerLookup=await api.get('admin-panel/owners/?search='+encodeURIComponent('QA Scope'),{headers:headers(admin)});const otherOwnerId=(await ownerLookup.json()).data.results.find(row=>row.phone_number==='+99893'+suffix.slice(-7)).id;
 const otherClinic=await api.post('admin-panel/clinics/',{headers:headers(admin),data:{owner:otherOwnerId,name:'QA Isolated Clinic',slug:'qa-isolated-'+suffix,address:'Fictional QA address',latitude:41.3,longitude:69.3,working_hours:{},facilities:[]}});
 expect(otherClinic.status()).toBe(201);const otherId=(await otherClinic.json()).data.id;
 expect((await api.get('clinic-owner/clinic/?clinic_id='+otherId,{headers:headers(owner)})).status()).toBe(404);
 expect((await api.patch('clinic-owner/clinic/?clinic_id='+otherId,{headers:headers(owner),data:{name:'Unauthorized'}})).status()).toBe(404);
 report.ownerIsolation=true;
 const date=new Date(Date.now()+4*86400000).toISOString().slice(0,10);
 const slots=(await (await api.get('doctors/'+v.doctor_id+'/availability/?clinic_id='+v.clinic_id+'&date='+date)).json()).data.slots;
 const slot=slots.find(s=>s.available);
 // Telegram shares the actual Django patient and Appointment model.
 const link=(await (await api.post('telegram/link-code/',{headers:headers(patientB)})).json()).data;
 const telegramId=String(100000000+Math.floor(Math.random()*100000000));
 const botHeaders={'X-Telegram-Bot-Secret':readFileSync(resolve(dir,'telegram-secret'),'utf8'),'X-Telegram-User-Id':telegramId};
 expect((await api.post('telegram/link/',{headers:botHeaders,data:{code:link.code,telegram_user_id:Number(telegramId)}})).status()).toBe(200);
 const telegramBooking=await api.post('telegram/appointments/',{headers:botHeaders,data:{doctor_id:Number(v.doctor_id),clinic_id:Number(v.clinic_id),date,time:slot.time}});
 expect(telegramBooking.status()).toBe(201);const tg=(await telegramBooking.json()).data;
 expect((await api.get('telegram/appointments/by-booking-id/'+tg.booking_id+'/',{headers:botHeaders})).status()).toBe(200);
 for(const [path,token] of [['appointments/',patientB],['admin-panel/appointments/',admin],['clinic-owner/appointments/',owner],['doctor-panel/appointments/',await login(v.doctor_phone)]]){
  const r=await api.get(path+tg.id+'/',{headers:headers(token)});expect(r.status()).toBe(200);expect((await r.json()).data.booking_id).toBe(tg.booking_id);
 }
 expect((await api.post('telegram/appointments/'+tg.id+'/cancel/',{headers:botHeaders,data:{reason:'QA cleanup'}})).status()).toBe(200);
 report.telegramSharedBookingAndCancel=true;
 const notifications=(await (await api.get('notifications/',{headers:headers(patientB)})).json()).data.results;
 expect(notifications.length).toBeGreaterThan(0);
 expect((await api.post('notifications/'+notifications[0].id+'/read/',{headers:headers(patientB)})).status()).toBe(200);
 report.notifications=true;
 expect(errors).toEqual([]);report.browserErrors=errors;
 writeFileSync(resolve(dir,'ecosystem-results.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}catch(e){
 await adminPage.screenshot({path:resolve(dir,'admin-failure.png'),fullPage:true}).catch(()=>{});
 await ownerPage.screenshot({path:resolve(dir,'owner-failure.png'),fullPage:true}).catch(()=>{});
 console.error(e.stack);process.exitCode=1;
}finally{await browser.close();await api.dispose()}
