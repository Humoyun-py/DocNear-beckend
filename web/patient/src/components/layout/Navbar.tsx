import React, { useState, useEffect } from 'react';
import { Link, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useAppointments } from '../../context/AppointmentContext';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../i18n/translations';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  HeartPulse,
  Heart,
  MapPin,
  Bell,
  User,
  Calendar,
  Search,
  Building2,
  ShieldAlert,
  Menu,
  X,
  ChevronDown,
  Navigation,
  CheckCheck,
  Globe,
} from 'lucide-react';
import { PartnerBadge } from '../common/PartnerBadge';

export const Navbar: React.FC = () => {
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const { userLocation, setUserLocation, presetLocations, detectCurrentLocation, isLocating } =
    useLocation();
  const { appointments } = useAppointments();
  const { language, setLanguage, t, languages, currentLanguageOption } = useLanguage();

  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState<boolean>(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!isLoggedIn) { setNotifications([]); return; }
      notificationService.getNotifications().then(items => { if (active) setNotifications(items); }).catch(() => {});
    };
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener('docnear:notifications-refresh', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('docnear:notifications-refresh', refresh); };
  }, [isLoggedIn, user?.id]);

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;
  const upcomingAppointmentsCount =
    isLoggedIn && user ? appointments.filter((a) => (a.status || '').toUpperCase() === 'CONFIRMED').length : 0;

  const markAllNotifsRead = async () => {
    try { setNotifications(await notificationService.markAllAsRead()); }
    catch (error) { window.alert(error instanceof Error ? error.message : 'So‘rov bajarilmadi'); }
  };

  const navLinks = [
    { id: 'doctors', label: t('findDoctors'), path: '/search', icon: Search },
    { id: 'clinics', label: t('clinics'), path: '/search?searchType=clinics', icon: Building2 },
    { id: 'specialties', label: t('specialties'), path: '/specialties', icon: HeartPulse },
    {
      id: 'appointments',
      label: t('appointments'),
      path: '/appointments',
      icon: Calendar,
      badge: upcomingAppointmentsCount > 0 ? upcomingAppointmentsCount : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs shrink-0 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
            <HeartPulse size={18} className="stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xl tracking-tight text-blue-900 dark:text-white">DocNear</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </Link>

        {/* Location Dropdown Selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setIsLocationMenuOpen(!isLocationMenuOpen);
              setIsLanguageMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-transparent dark:border-slate-700"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="max-w-[130px] truncate">
              {userLocation.address?.split(',')[0] || 'Tashkent, UZ'}
            </span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {isLocationMenuOpen && (
            <div className="absolute top-full mt-2 left-0 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('selectLocation')}
                </span>
                <button
                  onClick={() => {
                    detectCurrentLocation();
                    setIsLocationMenuOpen(false);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Navigation size={12} className={isLocating ? 'animate-spin' : ''} />
                  GPS
                </button>
              </div>

              <div className="space-y-1">
                {presetLocations.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setUserLocation(preset.coordinates);
                      setIsLocationMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{preset.name}</span>
                    {userLocation.lat === preset.coordinates.lat && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300 h-full">
          {navLinks.map((link) => {
            const isActive = routerLocation.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.id}
                to={link.path}
                className={`relative flex items-center gap-1.5 h-full transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons & Theme Toggle & Language Switcher & Emergency CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* Language Switcher Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLanguageMenuOpen(!isLanguageMenuOpen);
                setIsLocationMenuOpen(false);
                setIsNotifOpen(false);
                setIsProfileMenuOpen(false);
              }}
              title="Change Language / Tilni tanlash"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span className="text-sm">{currentLanguageOption.flag}</span>
              <span className="text-[11px] uppercase tracking-wide">
                {currentLanguageOption.shortLabel}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {isLanguageMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                  Til / Язык / Language
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLanguageMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      language === lang.code
                        ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    {language === lang.code && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Emergency 24/7 Fast CTA */}
          <Link
            to="/emergency"
            className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/50 flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-2xs"
          >
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            <span className="hidden sm:inline">{t('emergency')}</span>
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileMenuOpen(false);
                setIsLanguageMenuOpen(false);
              }}
              title="Notifications"
              className="relative w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <Bell size={18} />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h4>
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={markAllNotifsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pt-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.link) navigate(n.link);
                          setIsNotifOpen(false);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          n.isRead
                            ? 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/60 text-slate-900 dark:text-white font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth Button */}
          {isLoggedIn && user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsNotifOpen(false);
                  setIsLanguageMenuOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <span className="hidden md:block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown size={13} className="text-slate-400 hidden md:block" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User size={14} className="text-slate-500" />
                    <span>{t('profile')}</span>
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Heart size={14} className="text-slate-500" />
                    <span>{language === 'uz' ? 'Saqlanganlar' : language === 'ru' ? 'Избранное' : 'Favorites'}</span>
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Bell size={14} className="text-slate-500" />
                    <span>{language === 'uz' ? 'Bildirishnomalar' : language === 'ru' ? 'Уведомления' : 'Notifications'}</span>
                  </Link>
                  <Link
                    to="/appointments"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Calendar size={14} className="text-slate-500" />
                    <span>{t('appointments')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer mt-1 border-t border-slate-100 dark:border-slate-800"
                  >
                    <span>{t('logout')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              state={{ from: '/profile' }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-200 dark:shadow-none"
            >
              {t('signIn')}
            </Link>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          {/* Language Switcher in Mobile Drawer */}
          <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Globe size={14} className="text-blue-600 dark:text-blue-400" />
              Til / Язык
            </span>
            <div className="flex items-center gap-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    language === lang.code
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {lang.flag} {lang.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <link.icon size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            <Link
              to="/favorites"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Heart size={16} className="text-rose-500" />
                <span>{language === 'uz' ? 'Saqlanganlar' : language === 'ru' ? 'Избранное' : 'Favorites'}</span>
              </div>
            </Link>

            <Link
              to="/notifications"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-blue-600 dark:text-blue-400" />
                <span>{language === 'uz' ? 'Bildirishnomalar' : language === 'ru' ? 'Уведомления' : 'Notifications'}</span>
              </div>
              {unreadNotifCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                  {unreadNotifCount}
                </span>
              )}
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {isLoggedIn && user ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.phone || user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-1.5 text-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t('profile')}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold cursor-pointer border border-rose-100 dark:border-rose-900/50"
                  >
                    {t('logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  state={{ from: '/profile' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                >
                  {t('signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs border border-slate-200 dark:border-slate-700"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            <button
              onClick={() => {
                detectCurrentLocation();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              <Navigation size={14} className="text-blue-600 dark:text-blue-400" />
              <span>{t('currentGPS')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
