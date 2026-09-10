import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  LogOut,
  User,
  Sun,
  Moon,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useToastStore } from '../../store/useToastStore';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu, onOpenSearch }) => {
  const { profile, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead } = useNotificationStore();
  const { settings, toggleAvailability } = useScheduleStore();
  const { theme, setTheme } = useThemeStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute clean page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/appointments')) return 'Appointment Management';
    if (path.startsWith('/schedule')) return 'Clinical Schedule & Hours';
    if (path.startsWith('/patients')) return 'Patient Directory';
    if (path.startsWith('/analytics')) return 'Practice Analytics';
    if (path.startsWith('/notifications')) return 'Notifications & Alerts';
    if (path.startsWith('/clinic')) return 'MedLife Clinic Information';
    if (path.startsWith('/profile/preview')) return 'Public Profile Preview';
    if (path.startsWith('/profile')) return 'Doctor Profile & Credentials';
    if (path.startsWith('/settings')) return 'Practice Settings';
    return 'DocNear Doctor';
  };

  const handleToggleAvailability = async () => {
    await toggleAvailability();
    const newState = !settings.isAcceptingNewBookings;
    addToast({
      type: newState ? 'success' : 'warning',
      title: newState ? 'Availability Activated' : 'Appointments Paused',
      message: newState
        ? 'New patient appointments can now be booked.'
        : 'No new appointments can be booked during this period.',
    });
  };

  const handleLogout = async () => {
    await logout();
    addToast({
      type: 'info',
      title: 'Logged Out',
      message: 'Signed out securely.',
    });
    navigate('/login');
  };

  const topNotifications = notifications.slice(0, 5);

  return (
    <header
      id="top-navbar"
      className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8"
    >
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center/Right controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Availability Toggle */}
        <div className="hidden md:flex items-center">
          <button
            id="quick-availability-toggle"
            onClick={handleToggleAvailability}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              settings.isAcceptingNewBookings
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100'
            }`}
            title="Toggle patient booking acceptance"
          >
            {settings.isAcceptingNewBookings ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Available for Bookings</span>
                <ToggleRight className="w-4 h-4 text-emerald-600" />
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Bookings Paused</span>
                <ToggleLeft className="w-4 h-4 text-amber-600" />
              </>
            )}
          </button>
        </div>

        {/* Global Search Trigger */}
        <button
          id="navbar-search-button"
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-300 text-xs transition-colors border border-transparent dark:border-slate-700/60"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Search patients or bookings...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded-md text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Ctrl K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Dropdown Container */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-dropdown-button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {isNotifOpen && (
            <div
              id="notifications-dropdown-menu"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Notifications ({unreadCount} unread)
                </span>
                <Link
                  to="/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {topNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No new notifications</div>
                ) : (
                  topNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        setIsNotifOpen(false);
                        navigate('/notifications');
                      }}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-dropdown-button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1 sm:pl-2 sm:pr-3 rounded-full sm:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={profile?.avatarUrl}
              alt="Doctor Avatar"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                {profile?.title} {profile?.firstName} {profile?.lastName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                {profile?.specialty}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileMenuOpen && (
            <div
              id="profile-dropdown-menu"
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {profile?.title} {profile?.firstName} {profile?.lastName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {profile?.email}
                </p>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Clinical Profile</span>
                </Link>
                <Link
                  to="/profile/preview"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <span>View Public Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
