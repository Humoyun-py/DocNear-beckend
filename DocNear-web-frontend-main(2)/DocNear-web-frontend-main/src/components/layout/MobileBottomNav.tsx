import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Map, Calendar, User } from 'lucide-react';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const MobileBottomNav: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const { appointments } = useAppointments();
  const { t } = useLanguage();
  const upcomingCount = isLoggedIn && user ? appointments.filter((a) => (a.status || '').toUpperCase() === 'CONFIRMED').length : 0;

  const navItems = [
    { id: 'home', to: '/', label: t('appName'), icon: Home },
    { id: 'search', to: '/search', label: t('findDoctorsBtn'), icon: Search },
    { id: 'map', to: '/search?view=map', label: t('mapView'), icon: Map },
    {
      id: 'appointments',
      to: isLoggedIn && user ? '/appointments' : '/login',
      state: !isLoggedIn ? { from: '/appointments' } : undefined,
      label: t('appointments'),
      icon: Calendar,
      badge: upcomingCount > 0 ? upcomingCount : undefined,
    },
    {
      id: 'profile',
      to: isLoggedIn && user ? '/profile' : '/login',
      state: !isLoggedIn ? { from: '/profile' } : undefined,
      label: t('profile'),
      icon: User,
    },
  ];

  return (
    <div
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-1 shadow-lg transition-colors duration-200"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              state={(item as any).state}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
                  isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 max-w-[65px] truncate text-center">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
