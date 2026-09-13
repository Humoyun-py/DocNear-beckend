import { create } from 'zustand';
import { User, DoctorProfile, VerificationStatus, UserRole } from '../types';
import { authService, OtpCredentials } from '../services/authService';
interface AuthState {
 user: User | null; profile: DoctorProfile | null; token: string | null; isAuthenticated: boolean; isLoading: boolean; error: string | null;
 restore: () => Promise<void>; requestOtp: (phone:string,channel?:'sms'|'telegram') => Promise<void>; verifyOtp: (credentials: OtpCredentials) => Promise<boolean>; logout: () => Promise<void>;
 setVerificationStatus: (status: VerificationStatus) => void; updateProfile: (profile: Partial<DoctorProfile>) => void;
 switchPersona: (role: UserRole, id?: string) => void;
}
const empty = {user: null, profile: null, token: null, isAuthenticated: false, isLoading: false};
export const useAuthStore = create<AuthState>((set, get) => ({
 ...empty, isLoading: true, error: null,
 async restore() { set({isLoading: true}); try { const data = await authService.getCurrentSession(); set(data ? {...data, isAuthenticated: true, isLoading: false} : empty); } catch (error) { set({...empty, error: String(error)}); } },
 async requestOtp(phone,channel='sms') { set({isLoading:true,error:null}); try { await authService.requestOtp(phone,channel); set({isLoading:false}); } catch(error){const message=error instanceof Error?error.message:'Tasdiqlash kodini yuborib bo‘lmadi.';set({isLoading:false,error:message});throw error;} },
 async verifyOtp(credentials) {
  set({isLoading: true, error: null});
  try { const data = await authService.verifyOtp(credentials); set({...data, isAuthenticated: true, isLoading: false}); return true; }
  catch (error) { set({...empty, error: error instanceof Error ? error.message : 'Login bajarilmadi'}); return false; }
 },
 async logout() { try { await authService.logout(); } finally { set(empty); } },
 setVerificationStatus() { void get().restore(); },
 updateProfile(updates) { const profile = get().profile; if (profile) set({profile: {...profile, ...updates}}); },
 switchPersona() { void get().logout(); },
}));
window.addEventListener('docnear:doctor-expired', () => useAuthStore.setState(empty));
