import { Patient } from '../types';
import { apiClient, apiList } from './apiClient';
function mapPatient(p: any): Patient { return {id:String(p.id),fullName:p.name,dateOfBirth:'',gender:'other',phone:'',email:'',bloodGroup:'',
 emergencyContact:{name:'',relationship:'',phone:''},totalAppointments:p.total_visits || 0,lastAppointmentDate:p.last_appointment?.appointment_date,
 nextAppointmentDate:p.upcoming_appointment?.appointment_date,allergies:[],medicalHistory:[],avatarColor:'#2563eb'}; }
export const patientService = {
 async getPatients(search?:string):Promise<Patient[]> { return (await apiList('/doctor-panel/patients/',search?{search}:{})).map(mapPatient); },
 async getPatientById(id:string):Promise<Patient|undefined> { return mapPatient((await apiClient.get('/doctor-panel/patients/'+id+'/')).data); },
 async updatePatientNotes(_id:string,_notes:string):Promise<Patient> { throw new Error('Klinik qaydlar bu API’da mavjud emas'); },
};
