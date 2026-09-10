import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Users,
  BarChart3,
  Bell,
  Building2,
  User,
  Settings,
  LogOut,
  Activity,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const { unreadCount } = useNotificationStore();
  const { profile, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    addToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been safely signed out of DocNear Doctor.',
    });
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', to: '/appointments', icon: CalendarDays },
    { label: 'Schedule', to: '/schedule', icon: Clock },
    { label: 'Patients', to: '/patients', icon: Users },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    {
      label: 'Notifications',
      to: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: 'Clinic', to: '/clinic', icon: Building2 },
    { label: 'Profile', to: '/profile', icon: User },
    { label: 'User Portal (Patient)', to: '/user-portal', icon: Activity },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0F172A] text-white border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top brand header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-white">
                  DocNear
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/20">
                  Doctor
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Clinical Workspace
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Verification Status Mini Pill */}
        {profile && (
          <div className="px-3 py-1">
            <div className="px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`w-4 h-4 ${
                    profile.verificationStatus === 'verified'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                />
                <span className="text-xs font-medium text-slate-300 capitalize">
                  {profile.verificationStatus.replace('_', ' ')}
                </span>
              </div>
              <NavLink to="/profile" className="text-slate-400 hover:text-white">
                <ChevronRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </div>
        )}

        {/* Bottom doctor user info & actions */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          {/* Doctor Info Box */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/40 text-slate-300">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Doctor Avatar"
                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 font-mono">
                {profile?.firstName?.[0] || 'A'}{profile?.lastName?.[0] || 'K'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">
                {profile?.title || 'Dr.'} {profile?.firstName} {profile?.lastName ? `${profile.lastName[0]}.` : 'K.'}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 truncate">
                {profile?.specialty || 'Cardiologist'}
              </span>
            </div>
          </div>

          <NavLink
            to="/settings"
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`
            }
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </NavLink>

          <button
            id="sidebar-logout-button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
