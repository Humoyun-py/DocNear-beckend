import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import { AUTH_EXPIRED } from '../services/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register', onAuthSuccess?: () => void) => void;
  closeAuthModal: () => void;
  requestOtp: (data: { phone: string; purpose: 'login' | 'register'; channel: 'sms' | 'telegram'; firstName?: string; lastName?: string }) => Promise<void>;
  verifyOtp: (data: { phone: string; code: string; purpose: 'login' | 'register' }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleFavoriteDoctor: (doctorId: string) => void;
  toggleFavoriteClinic: (clinicId: string) => void;
  isDoctorSaved: (doctorId: string) => boolean;
  isClinicSaved: (clinicId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authSuccessCallback, setAuthSuccessCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    const expired = () => { authService.forgetSession(); setUser(null); };
    window.addEventListener(AUTH_EXPIRED, expired);
    authService.restoreSession().then(value => { if (active) setUser(value); }).catch(() => { if (active) setUser(null); });
    return () => { active = false; window.removeEventListener(AUTH_EXPIRED, expired); };
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login', onAuthSuccess?: () => void) => {
    setAuthModalMode(mode);
    if (onAuthSuccess) {
      setAuthSuccessCallback(() => onAuthSuccess);
    } else {
      setAuthSuccessCallback(null);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthSuccessCallback(null);
  };

  const requestOtp = (data: { phone: string; purpose: 'login' | 'register'; channel: 'sms' | 'telegram'; firstName?: string; lastName?: string }) => authService.requestOtp(data);

  const verifyOtp = async (data: { phone: string; code: string; purpose: 'login' | 'register' }): Promise<void> => {
    const newUser = await authService.verifyOtp(data);
    setUser({ ...newUser });
    if (authSuccessCallback) {
      authSuccessCallback();
    }
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    const updated = await authService.updateProfile(updates);
    setUser({ ...updated });
  };

  const toggleFavoriteDoctor = async (doctorId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    let newSaved: string[];
    try { newSaved = await authService.toggleFavoriteDoctor(doctorId); }
    catch (error) { window.alert(error instanceof Error ? error.message : 'Saqlanmadi'); return; }
    setUser((prev) => (prev ? { ...prev, savedDoctorIds: newSaved } : null));
  };

  const toggleFavoriteClinic = async (clinicId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    let newSaved: string[];
    try { newSaved = await authService.toggleFavoriteClinic(clinicId); }
    catch (error) { window.alert(error instanceof Error ? error.message : 'Saqlanmadi'); return; }
    setUser((prev) => (prev ? { ...prev, savedClinicIds: newSaved } : null));
  };

  const isDoctorSaved = (doctorId: string): boolean => {
    return !!user?.savedDoctorIds.includes(doctorId);
  };

  const isClinicSaved = (clinicId: string): boolean => {
    return !!user?.savedClinicIds.includes(clinicId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        requestOtp,
        verifyOtp,
        logout,
        updateProfile,
        toggleFavoriteDoctor,
        toggleFavoriteClinic,
        isDoctorSaved,
        isClinicSaved,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
