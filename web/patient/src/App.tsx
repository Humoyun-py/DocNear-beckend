import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { AppointmentProvider } from './context/AppointmentContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
const AuthModal = lazy(() => import('./components/auth/AuthModal').then(module => ({ default: module.AuthModal })));
import { ToastContainer } from './components/common/ToastContainer';
const EmergencySOSButton = lazy(() => import('./components/emergency/EmergencySOSButton').then(module => ({ default: module.EmergencySOSButton })));
import { OfflineBanner } from './components/common/OfflineBanner';
const BookingModal = lazy(() => import('./components/booking/BookingModal').then(module => ({ default: module.BookingModal })));
const AIChatBubble = lazy(() => import('./components/common/AIChatBubble').then(module => ({ default: module.AIChatBubble })));

// Keep page bundles out of the initial route payload.
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(module => ({ default: module.SearchPage })));
const ClinicDetailsPage = lazy(() => import('./pages/ClinicDetailsPage').then(module => ({ default: module.ClinicDetailsPage })));
const DoctorDetailsPage = lazy(() => import('./pages/DoctorDetailsPage').then(module => ({ default: module.DoctorDetailsPage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(module => ({ default: module.AppointmentsPage })));
const SpecialtiesPage = lazy(() => import('./pages/SpecialtiesPage').then(module => ({ default: module.SpecialtiesPage })));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage').then(module => ({ default: module.EmergencyPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(module => ({ default: module.FavoritesPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })));
const LoginPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.ForgotPasswordPage })));

// Scroll to top on page transition
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <LocationProvider>
              <AppointmentProvider>
                <ScrollToTop />
                <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-200">
                  {/* Top Navigation */}
                  <Navbar />

                  {/* Offline Connection Status Banner */}
                  <OfflineBanner />

                  {/* Main App Content View */}
                  <main className="flex-1 pb-16 md:pb-0">
                    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Loading page...</div>}>
                      <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/clinics/:clinicId" element={<ClinicDetailsPage />} />
                      <Route path="/doctors/:doctorId" element={<DoctorDetailsPage />} />
                      <Route path="/appointments" element={<AppointmentsPage />} />
                      <Route path="/specialties" element={<SpecialtiesPage />} />
                      <Route path="/emergency" element={<EmergencyPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="*" element={<HomePage />} />
                      </Routes>
                    </Suspense>
                  </main>

                  {/* Global 6-Step Appointment Booking Modal */}
                  <Suspense fallback={null}><BookingModal /></Suspense>

                  {/* Global Authentication Modal with Telegram Verification */}
                  <Suspense fallback={null}><AuthModal /></Suspense>

                  {/* Global Toast Notifications */}
                  <ToastContainer />

                  {/* Floating Emergency SOS Button & Immediate Assistance Modal */}
                  <Suspense fallback={null}><EmergencySOSButton /></Suspense>

                  {/* AI-Powered Medical Assistant & Procedure Guide Chat Bubble */}
                  <Suspense fallback={null}><AIChatBubble /></Suspense>

                  {/* Footer */}
                  <Footer />

                  {/* Mobile Bottom Navigation Bar */}
                  <MobileBottomNav />
                </div>
              </AppointmentProvider>
            </LocationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
