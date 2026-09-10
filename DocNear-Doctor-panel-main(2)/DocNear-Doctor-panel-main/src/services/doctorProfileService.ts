import { DoctorProfile } from '../types';
import { apiClient } from './apiClient';
import { authService, mapProfile } from './authService';
export const doctorProfileService = {
 async getProfile(): Promise<DoctorProfile> { const session = await authService.getCurrentSession(); if (!session) throw new Error('Avval tizimga kiring'); return session.profile; },
 async updateProfile(updates: Partial<DoctorProfile>): Promise<DoctorProfile> {
  const body = { ...(updates.bio !== undefined ? {bio: updates.bio} : {}),
   ...(updates.languages ? {languages: updates.languages} : {}),
   ...(updates.yearsOfExperience !== undefined ? {experience_years: updates.yearsOfExperience} : {}),
   ...(updates.education ? {education: updates.education.map(e => [e.degree,e.institution,e.year || ''].filter(Boolean).join(', ')).join('\n')} : {}),
   ...(updates.certifications ? {certifications: updates.certifications.map(c => c.title)} : {}) };
  await apiClient.patch('/doctor-panel/profile/', body);
  return this.getProfile();
 },
 async submitVerificationRequest(): Promise<DoctorProfile> { return this.getProfile(); },
};
export const doctorService = doctorProfileService;
