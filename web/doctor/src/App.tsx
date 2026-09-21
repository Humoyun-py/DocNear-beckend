import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })));
const AppointmentsPage = lazy(() => import('./features/appointments/AppointmentsPage').then(module => ({ default: module.AppointmentsPage })));
const AppointmentDetailsPage = lazy(() => import('./features/appointments/AppointmentDetailsPage').then(module => ({ default: module.AppointmentDetailsPage })));
const SchedulePage = lazy(() => import('./features/schedule/SchedulePage').then(module => ({ default: module.SchedulePage })));
const PatientsPage = lazy(() => import('./features/patients/PatientsPage').then(module => ({ default: module.PatientsPage })));
const PatientProfilePage = lazy(() => import('./features/patients/PatientProfilePage').then(module => ({ default: module.PatientProfilePage })));
const AnalyticsPage = lazy(() => import('./features/analytics/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage').then(module => ({ default: module.NotificationsPage })));
const ClinicPage = lazy(() => import('./features/clinic/ClinicPage').then(module => ({ default: module.ClinicPage })));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage').then(module => ({ default: module.ProfilePage })));
const PublicProfilePreviewPage = lazy(() => import('./features/profile/PublicProfilePreviewPage').then(module => ({ default: module.PublicProfilePreviewPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then(module => ({ default: module.SettingsPage })));
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
  useEffect(() => { void useAuthStore.getState().restore(); }, []);
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading panel...</div>}>
        <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientProfilePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/clinic" element={<ClinicPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/preview" element={<PublicProfilePreviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
