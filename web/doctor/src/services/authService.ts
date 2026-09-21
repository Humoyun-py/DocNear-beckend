import { apiClient, clearSession } from './apiClient';
import { User, DoctorProfile, VerificationStatus } from '../types';
export interface OtpCredentials { phoneNumber: string; code: string }
export interface AuthResponse { user: User; profile: DoctorProfile; token: string }
export function mapProfile(raw: any, user: User): DoctorProfile {
 const [firstName, ...last] = user.fullName.split(' ');
 return { id: String(raw.id), userId: user.id, firstName, lastName: last.join(' '), title: '', specialty: '', subSpecialties: [],
 medicalLicenseNumber: '', yearsOfExperience: raw.experience_years, rating: Number(raw.rating || 0), reviewCount: raw.total_reviews || 0,
 bio: raw.bio || '', phone: user.phone, email: user.email, avatarUrl: raw.profile_image || '',
 verificationStatus: !raw.is_active ? 'inactive' : raw.is_verified ? 'verified' : 'pending_verification',
 education: raw.education ? [{degree: raw.education, institution: '', year: 0}] : [],
 certifications: (raw.certifications || []).map((c: string) => ({title: c, issuingOrganization: '', year: 0})),
 languages: raw.languages || [], clinicId: '', consultationFee: 0, currency: 'UZS' };
}
function mapUser(raw: any): User {
 if (raw.role !== 'doctor') throw new Error('Shifokor akkaunti bilan kiring');
 return {id: String(raw.id), email: raw.email || '', phone: raw.phone_number || '', fullName: raw.name || '', role: 'DOCTOR', avatarUrl: raw.profile_image || ''};
}
async function session(raw: any): Promise<AuthResponse> {
 const user = mapUser(raw);
 const profile = mapProfile((await apiClient.get('/doctor-panel/profile/')).data, user);
 user.doctorId = profile.id;
 return {user,profile,token: sessionStorage.getItem('docnear_doctor_token')!};
}
export const authService = {
 async requestOtp(phoneNumber: string, channel: 'sms'|'telegram'='sms'): Promise<void> {
  await apiClient.post('/auth/request-otp/', {phone_number:phoneNumber,purpose:'login',channel});
 },
 async verifyOtp(credentials: OtpCredentials): Promise<AuthResponse> {
  const {data} = await apiClient.post('/auth/verify-otp/', {phone_number:credentials.phoneNumber,code:credentials.code,purpose:'login'});
  mapUser(data.user);
  sessionStorage.setItem('docnear_doctor_token', data.access); sessionStorage.setItem('docnear_doctor_refresh', data.refresh);
  return session(data.user);
 },
 async getCurrentSession(): Promise<AuthResponse | null> {
  if (!sessionStorage.getItem('docnear_doctor_token')) return null;
  return session((await apiClient.get('/auth/me/')).data);
 },
 async logout() {
  try { await apiClient.post('/auth/logout/', {refresh: sessionStorage.getItem('docnear_doctor_refresh')}); }
  finally { clearSession(); }
 },
 async updateVerificationStatus(_status: VerificationStatus): Promise<VerificationStatus> {
  throw new Error('Tasdiqlash holatini faqat administrator o‘zgartiradi');
 },
};
