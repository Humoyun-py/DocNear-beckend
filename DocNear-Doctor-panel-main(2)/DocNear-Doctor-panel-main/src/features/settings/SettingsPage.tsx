import React from 'react';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  Bell,
  Lock,
  Clock,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useToastStore } from '../../store/useToastStore';
import { VerificationStatus } from '../../types';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { profile, setVerificationStatus } = useAuthStore();
  const { settings, updateSettings } = useScheduleStore();
  const { addToast } = useToastStore();

  const handleStatusChange = (status: VerificationStatus) => {
    setVerificationStatus(status);
    addToast({
      type: 'info',
      title: 'Verification Status Updated',
      message: `Account state is now "${status.replace('_', ' ')}".`,
    });
  };

  const handleSavePreferences = () => {
    addToast({
      type: 'success',
      title: 'Preferences Saved',
      message: 'Practice workspace settings successfully updated.',
    });
  };

  return (
    <div id="settings-page-container" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Practice & Workspace Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Appearance, notifications, scheduling policies, and account state simulation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Settings Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Appearance */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-blue-600" />
              <span>Appearance & Theme</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select your preferred visual mode for clinical screen comfort.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { key: 'light', label: 'Light Clean', icon: Sun },
                { key: 'dark', label: 'Dark Mode', icon: Moon },
                { key: 'system', label: 'System Default', icon: Laptop },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = theme === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTheme(item.key as any)}
                    className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consultation Defaults */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Consultation Timing Defaults</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Consultation Length
                </label>
                <select
                  value={settings.defaultDurationMinutes}
                  onChange={(e) => updateSettings({ defaultDurationMinutes: Number(e.target.value) as any })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes (Standard)</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sanitization & Note Buffer
                </label>
                <select
                  value={settings.bufferMinutes}
                  onChange={(e) => updateSettings({ bufferMinutes: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                >
                  <option value={0}>0 minutes</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Real-Time Alert Preferences</span>
            </h3>

            <div className="space-y-3 text-xs">
              {[
                { title: 'New Booking Requests', desc: 'Instant banner when a patient requests a slot' },
                { title: 'Appointment Cancellations', desc: 'Alert when a patient or clinic reception cancels' },
                { title: 'Schedule Overlap Warnings', desc: 'Flag conflicts when blocking surgery times' },
                { title: 'Consultation In-Progress Timer', desc: 'Show persistent active consultation bar' },
              ].map((item, idx) => (
                <label key={idx} className="flex items-start gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {item.title}
                    </span>
                    <span className="text-slate-400 block">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 p-6">
          <h3 className="font-semibold">Verification status</h3>
          <p>{profile?.verificationStatus}</p>
          <p className="text-sm text-slate-500">Credentials are reviewed by your administrator.</p>
        </div>
      </div>
    </div>
  );
};
