import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { VerificationBanner } from './VerificationBanner';
import { GlobalSearchModal } from './GlobalSearchModal';
import { ActiveTimerBanner } from '../common/ActiveTimerBanner';
import { ToastContainer } from '../common/ToastContainer';
import { AppointmentDetailsDrawer } from '../appointments/AppointmentDetailsDrawer';
import { CancelAppointmentModal } from '../appointments/CancelAppointmentModal';
import { RescheduleAppointmentModal } from '../appointments/RescheduleAppointmentModal';
import { CompleteAppointmentModal } from '../appointments/CompleteAppointmentModal';
import { NoShowConfirmationModal } from '../appointments/NoShowConfirmationModal';
import { ScheduleConflictModal } from '../schedule/ScheduleConflictModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppointmentStore } from '../../store/useAppointmentStore';

export const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { fetchAppointments } = useAppointmentStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAppointments();
    const timer = setInterval(fetchAppointments, 30000);
    return () => clearInterval(timer);
  }, [fetchAppointments, isAuthenticated]);

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isLoading) return <div role="status">Yuklanmoqda…</div>;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-[#1E293B] dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Sidebar for desktop & mobile drawer */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <TopNavbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* In-progress Active Consultation Banner */}
        <ActiveTimerBanner />

        {/* Verification Status Warning if not verified */}
        <VerificationBanner />

        {/* Page View Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <AppointmentDetailsDrawer />
      <CancelAppointmentModal />
      <RescheduleAppointmentModal />
      <CompleteAppointmentModal />
      <NoShowConfirmationModal />
      <ScheduleConflictModal />
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
