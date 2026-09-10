import { chromium, expect as baseExpect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const expect = baseExpect.configure({timeout:20000});

const root = resolve('../..');
const directory = resolve(root,'.runtime/integration');
const values = Object.fromEntries(JSON.parse(readFileSync(resolve(directory,'postman.env.json'),'utf8')).values.map(v=>[v.key,v.value]));
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/opt/google/chrome/chrome',headless:true});
const patient = await browser.newPage();
const doctor = await browser.newPage();
patient.setDefaultTimeout(20000);
doctor.setDefaultTimeout(20000);
const failures=[];
patient.on('pageerror',e=>failures.push(e.message));
doctor.on('pageerror',e=>failures.push(e.message));
try {
 await patient.goto('http://localhost:3001/login');
 await patient.locator('input[type=password]').fill(values.test_password);
 await patient.locator('input').filter({visible:true}).first().fill(values.patient_email);
 await patient.locator('form button[type=submit]').click();
 await expect(patient).not.toHaveURL(/\/login$/);
 await patient.goto('http://localhost:3001/doctors/'+values.doctor_id);
 await expect(patient.getByRole('heading',{name:'QA Doctor',exact:true})).toBeVisible();
 await patient.screenshot({path:resolve(directory,'patient-doctor.png'),fullPage:true});
 if (process.env.INSPECT_ONLY==='1') process.exitCode=0;
 else {
  await patient.getByRole('button',{name:'Tezkor yozilish',exact:true}).click();
  const modal=patient.locator('#booking-modal-overlay');
  await expect(modal).toBeVisible();
  await modal.locator('[data-date]').nth(1).click();
  await modal.getByTestId('booking-continue').click();
  await modal.locator('[data-slot]:not([disabled])').first().click();
  await modal.getByTestId('booking-continue').click();
  await modal.getByTestId('booking-continue').click();
  const createdResponse=patient.waitForResponse(r=>r.url().endsWith('/api/v1/appointments/') && r.request().method()==='POST');
  await modal.getByTestId('booking-confirm').click();
  const response=await createdResponse;
  expect(response.status()).toBe(201);
  const appointment=(await response.json()).data;
  expect(appointment.status).toBe('pending');
  await expect(modal.getByText(appointment.booking_id,{exact:false}).first()).toBeVisible();
  await patient.screenshot({path:resolve(directory,'web-booking-created.png'),fullPage:true});
  await doctor.goto('http://localhost:3002/login');
  await doctor.locator('#login-identifier-input').fill(values.doctor_email);
  await doctor.locator('#login-password-input').fill(values.test_password);
  await doctor.locator('#sign-in-button').click();
  await expect(doctor).not.toHaveURL(/\/login$/);
  await doctor.goto('http://localhost:3002/appointments');
  await expect(doctor.getByText(appointment.booking_id,{exact:false}).first()).toBeVisible();
  const confirmedResponse=doctor.waitForResponse(r=>r.url().endsWith('/'+appointment.id+'/accept/') && r.request().method()==='POST');
  await doctor.locator('[data-appointment-id="'+appointment.id+'"]').getByRole('button',{name:'Confirm Booking',exact:true}).click();
  expect((await (await confirmedResponse).json()).data.status).toBe('confirmed');
  await doctor.screenshot({path:resolve(directory,'doctor-confirmed.png'),fullPage:true});
  await patient.goto('http://localhost:3001/appointments');
  await expect(patient.getByText(appointment.booking_id,{exact:false}).first()).toBeVisible();
  const history=await patient.evaluate(async()=>{
   const response=await fetch('http://127.0.0.1:8001/api/v1/appointments/',{headers:{Authorization:'Bearer '+sessionStorage.getItem('docnear_access_token')}});
   return (await response.json()).data.results;
  });
  expect(history.find(a=>a.id===appointment.id).status).toBe('confirmed');
  await patient.screenshot({path:resolve(directory,'patient-confirmed.png'),fullPage:true});
  const duplicate=await patient.evaluate(async a=>{
   const response=await fetch('http://127.0.0.1:8001/api/v1/appointments/',{method:'POST',headers:{Authorization:'Bearer '+sessionStorage.getItem('docnear_access_token'),'Content-Type':'application/json'},body:JSON.stringify({doctor_id:a.doctor,clinic_id:a.clinic,date:a.appointment_date,time:a.start_time})});
   return response.status;
  },appointment);
  expect(duplicate).toBe(409);
  // Rescheduling must update the existing booking, never create a second one.
  await patient.locator('[data-appointment-id="'+appointment.id+'"]').getByRole('button',{name:'Vaqtni o‘zgartirish',exact:true}).click();
  await expect(modal).toBeVisible();
  await modal.locator('[data-date]').nth(2).click();
  await modal.getByTestId('booking-continue').click();
  await modal.locator('[data-slot]:not([disabled])').first().click();
  await modal.getByTestId('booking-continue').click();
  await modal.getByTestId('booking-continue').click();
  const rescheduledResponse=patient.waitForResponse(r=>r.url().endsWith('/'+appointment.id+'/reschedule/') && r.request().method()==='POST');
  await modal.getByTestId('booking-confirm').click();
  const rescheduled=(await (await rescheduledResponse).json()).data;
  expect(rescheduled.id).toBe(appointment.id);
  expect(rescheduled.status).toBe('pending');
  await doctor.reload();
  const reconfirmed=doctor.waitForResponse(r=>r.url().endsWith('/'+appointment.id+'/accept/') && r.request().method()==='POST');
  await doctor.locator('[data-appointment-id="'+appointment.id+'"]').getByRole('button',{name:'Confirm Booking',exact:true}).click();
  expect((await (await reconfirmed).json()).data.status).toBe('confirmed');
  writeFileSync(resolve(directory,'e2e-appointment.json'),JSON.stringify({id:appointment.id,booking_id:appointment.booking_id,date:appointment.appointment_date,status:'confirmed'}));
  console.log(JSON.stringify({webCreated:appointment.id,doctorConfirmed:true,rescheduledSameId:true,patientReloadConfirmed:true,duplicateStatus:duplicate,browserErrors:failures},null,2));
  expect(failures).toEqual([]);
 }
} catch(error) {
 await doctor.screenshot({path:resolve(directory,'doctor-failure.png'),fullPage:true}).catch(()=>{});
 await patient.screenshot({path:resolve(directory,'web-failure.png'),fullPage:true}).catch(()=>{});
 console.error(error.message);
 process.exitCode=1;
} finally {
 if(failures.length) console.error('Browser errors:',failures);
 await browser.close();
}
