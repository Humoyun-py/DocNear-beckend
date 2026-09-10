import { UserProfile } from '../types';
import { apiRequest, apiList, setAuthTokens, clearTokens, getRefreshToken, hasSession } from './apiClient';
interface UserDto { id: number; name: string; first_name: string; last_name: string; email: string; phone_number: string; profile_image: string | null; role: string }
interface SessionDto { user: UserDto; access: string; refresh: string }
let current: UserProfile | null = null;
function mapUser(raw: UserDto): UserProfile {
  return { id: String(raw.id), name: raw.name || [raw.first_name, raw.last_name].filter(Boolean).join(' '),
    email: raw.email || '', phone: raw.phone_number || '', avatar: raw.profile_image || '',
    savedDoctorIds: [], savedClinicIds: [],
    notificationSettings: { appointmentReminders: true, smsReminders: false, emailUpdates: false, promoOffers: false } };
}
async function loadUser(raw: UserDto): Promise<UserProfile> {
  if (raw.role !== 'patient') { clearTokens(); throw new Error('Bemor akkaunti bilan kiring. Shifokor uchun doctor paneldan foydalaning.'); }
  const [doctors, clinics] = await Promise.all([apiList<{id: number}>('favorites/doctors/'), apiList<{id: number}>('favorites/clinics/')]);
  current = { ...mapUser(raw), savedDoctorIds: doctors.map(d => String(d.id)), savedClinicIds: clinics.map(c => String(c.id)) };
  return current;
}
async function favorite(kind: 'doctors' | 'clinics', id: string): Promise<string[]> {
  if (!current) throw new Error('Avval tizimga kiring');
  const field = kind === 'doctors' ? 'savedDoctorIds' : 'savedClinicIds';
  const exists = current[field].includes(id);
  await apiRequest('favorites/' + kind + '/' + encodeURIComponent(id) + '/', { method: exists ? 'DELETE' : 'POST' });
  const ids = (await apiList<{id: number}>('favorites/' + kind + '/')).map(item => String(item.id));
  current = { ...current, [field]: ids };
  return ids;
}
export const authService = {
  getCurrentUser(): UserProfile | null { return current; },
  async restoreSession(): Promise<UserProfile | null> {
    if (!hasSession()) return null;
    return loadUser(await apiRequest<UserDto>('auth/me/'));
  },
  async login(identifier: string, password: string): Promise<UserProfile> {
    const data = await apiRequest<SessionDto>('auth/login/', { method: 'POST', body: JSON.stringify({ identifier: identifier.trim(), password }) });
    setAuthTokens(data);
    return loadUser(data.user);
  },
  async register(data: { firstName: string; lastName: string; phone: string; email?: string; password?: string }): Promise<UserProfile> {
    if (!data.password) throw new Error('Parol kiriting (kamida 10 belgi)');
    const session = await apiRequest<SessionDto>('auth/register/', { method: 'POST', body: JSON.stringify({
      first_name: data.firstName.trim(), last_name: data.lastName.trim(), phone_number: data.phone.replace(/[\s()-]/g, ''),
      ...(data.email ? { email: data.email.trim() } : {}), password: data.password,
    }) });
    setAuthTokens(session);
    return loadUser(session.user);
  },
  async logout(): Promise<void> {
    const refresh = getRefreshToken();
    try { if (refresh) await apiRequest('auth/logout/', { method: 'POST', body: JSON.stringify({ refresh }) }); }
    finally { current = null; clearTokens(); }
  },
  forgetSession() { current = null; },
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!current) throw new Error('Avval tizimga kiring');
    if (updates.healthPreferences || updates.emergencyContact || updates.notificationSettings)
      throw new Error('Bu sozlamalarni saqlash API’da hozircha qo‘llab-quvvatlanmaydi');
    if ((updates.phone !== undefined && updates.phone !== current.phone) || (updates.email !== undefined && updates.email !== current.email))
      throw new Error('Telefon va emailni o‘zgartirish tasdiqlashni talab qiladi');
    const [first_name, ...rest] = (updates.name ?? current.name).trim().split(/\s+/);
    const raw = await apiRequest<UserDto>('auth/me/', { method: 'PATCH', body: JSON.stringify({ first_name, last_name: rest.join(' ') }) });
    current = { ...current, ...mapUser(raw), savedDoctorIds: current.savedDoctorIds, savedClinicIds: current.savedClinicIds };
    return current;
  },
  toggleFavoriteDoctor(id: string) { return favorite('doctors', id); },
  toggleFavoriteClinic(id: string) { return favorite('clinics', id); },
};
