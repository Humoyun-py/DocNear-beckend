import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useLanguage } from '../context/LanguageContext';
import { Doctor, Clinic } from '../types';
import { doctorService } from '../services/doctorService';
import { clinicService } from '../services/clinicService';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { ClinicCard } from '../components/clinics/ClinicCard';
import { EmptyState } from '../components/common/EmptyState';
import { BookingDashboard } from '../components/profile/BookingDashboard';
import {
  User,
  Phone,
  Mail,
  Heart,
  Calendar,
  Building2,
  ShieldCheck,
  Bell,
  LogOut,
  Sparkles,
  CheckCircle2,
  Edit3,
  Camera,
  Save,
  X,
  UserCheck,
  HeartPulse,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
];

export const ProfilePage: React.FC = () => {
  const { user, isLoggedIn, logout, updateProfile } = useAuth();
  const { appointments, showToast, showUpcomingReminderToast, trigger24HourReminder, trigger1HourReminder } = useAppointments();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'savedDoctors' | 'favoriteClinics'>('dashboard');
  const [savedDoctors, setSavedDoctors] = useState<Doctor[]>([]);
  const [favoriteClinics, setFavoriteClinics] = useState<Clinic[]>([]);
  const [appointmentReminders, setAppointmentReminders] = useState<boolean>(
    user?.notificationSettings?.appointmentReminders ?? true
  );
  const [smsNotifications, setSmsNotifications] = useState<boolean>(
    user?.notificationSettings?.smsReminders ?? true
  );
  const [emailReminders, setEmailReminders] = useState<boolean>(
    user?.notificationSettings?.emailUpdates ?? true
  );

  // Edit profile state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [avatar, setAvatar] = useState<string>(user?.avatar || AVATAR_OPTIONS[0]);
  const [emergencyName, setEmergencyName] = useState<string>(user?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState<string>(user?.emergencyContact?.phone || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState<string>(user?.emergencyContact?.relationship || 'Spouse');

  // Keep local fields in sync when user data changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || AVATAR_OPTIONS[0]);
      setEmergencyName(user.emergencyContact?.name || '');
      setEmergencyPhone(user.emergencyContact?.phone || '');
      setEmergencyRelationship(user.emergencyContact?.relationship || 'Spouse');
    }
  }, [user]);

  useEffect(() => {
    async function loadSaved() {
      const allDocs = await doctorService.getDoctors();
      const allClinics = await clinicService.getPartnerClinics();
      const doctorIds = user?.savedDoctorIds || [];
      const clinicIds = user?.savedClinicIds || [];
      setSavedDoctors(allDocs.filter((d) => doctorIds.includes(d.id)));
      setFavoriteClinics(allClinics.filter((c) => clinicIds.includes(c.id)));
    }
    loadSaved();
  }, [user?.savedDoctorIds, user?.savedClinicIds]);

  if (!isLoggedIn || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('signIn')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('loginSub')}
        </p>
        <Link
          to="/login"
          state={{ from: '/profile' }}
          className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-sm hover:bg-blue-700 transition-colors"
        >
          {t('signIn')} / {t('register')}
        </Link>
      </div>
    );
  }

  const handleToggleReminders = async (enabled: boolean) => {
    setAppointmentReminders(enabled);
    await updateProfile({
      notificationSettings: {
        ...user.notificationSettings,
        appointmentReminders: enabled,
      },
    });
    if (enabled) {
      showToast('Appointment reminders enabled! You will receive toast notifications for upcoming visits.', 'success', 'Reminders Enabled');
    } else {
      showToast('Appointment reminders disabled.', 'info', 'Reminders Disabled');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('Iltimos, ism va telefon raqamni to‘liq kiriting', 'error');
      return;
    }

    await updateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar: avatar.trim(),
      emergencyContact: emergencyName.trim()
        ? {
            name: emergencyName.trim(),
            phone: emergencyPhone.trim(),
            relationship: emergencyRelationship,
          }
        : undefined,
    });
    setIsEditing(false);
    showToast(t('profileUpdated') || 'Profile updated successfully!', 'success', 'Profile');
  };

  const handleCancelEdit = () => {
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setAvatar(user.avatar || AVATAR_OPTIONS[0]);
    setEmergencyName(user.emergencyContact?.name || '');
    setEmergencyPhone(user.emergencyContact?.phone || '');
    setEmergencyRelationship(user.emergencyContact?.relationship || 'Spouse');
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative group">
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-white dark:border-slate-800 shadow-md ring-2 ring-blue-100 dark:ring-blue-900/50"
            />
            <button
              onClick={() => {
                setIsEditing(true);
                setActiveTab('profile');
              }}
              className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-transform transform active:scale-95 cursor-pointer"
              title={t('editProfile') || 'Edit Profile'}
            >
              <Camera size={14} />
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">{user.name}</h1>
              <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-blue-600 dark:text-blue-400" />
                {t('verifiedPatient') || 'Tasdiqlangan'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <Mail size={12} className="text-slate-400 dark:text-slate-500" />
              <span>{user.email}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <Phone size={12} className="text-slate-400 dark:text-slate-500" />
              <span>{user.phone}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsEditing((prev) => !prev);
              setActiveTab('profile');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isEditing
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/80'
            }`}
          >
            <Edit3 size={14} />
            <span>{isEditing ? t('cancel') : t('editProfile')}</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'dashboard' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp size={14} className={activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'} />
          <span>{t('bookingDashboardTab') || 'Qabullar statistikasi'}</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('personalInfo')}
        </button>
        <button
          onClick={() => setActiveTab('savedDoctors')}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'savedDoctors' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>{t('savedDoctorsTab')}</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full text-slate-700 dark:text-slate-300">
            {savedDoctors.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('favoriteClinics')}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'favoriteClinics' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>{t('savedClinicsTab')}</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full text-slate-700 dark:text-slate-300">
            {favoriteClinics.length}
          </span>
        </button>
      </div>

      {/* Tab 0: Booking Dashboard */}
      {activeTab === 'dashboard' && (
        <BookingDashboard appointments={appointments} />
      )}

      {/* Tab 1: Account Details */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isEditing ? t('editProfile') : t('personalInfo')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                {isEditing ? (
                  <>
                    <X size={13} />
                    <span>{t('cancel')}</span>
                  </>
                ) : (
                  <>
                    <Edit3 size={13} />
                    <span>{t('editProfile')}</span>
                  </>
                )}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {t('chooseAvatar') || 'Avatar tanlash'}
                  </label>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {AVATAR_OPTIONS.map((av, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAvatar(av)}
                        className={`relative rounded-2xl overflow-hidden p-0.5 border-2 transition-all cursor-pointer ${
                          avatar === av ? 'border-blue-600 ring-2 ring-blue-300 dark:ring-blue-800 scale-105' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={av}
                          alt={`Avatar ${index + 1}`}
                          className="w-12 h-12 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {avatar === av && (
                          <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                            <CheckCircle2 size={16} className="text-blue-600 bg-white dark:bg-slate-900 rounded-full" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('fullName')}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aziza Rakhimova"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('patientPhone')}</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('emailAddress')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.uz"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <HeartPulse size={14} className="text-rose-500" />
                    <span>{t('emergencyContact') || 'Favqulodda bog‘lanish (Yaqin insoningiz)'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {t('contactName') || 'Ism va familiyasi'}
                      </label>
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Sardor Rakhimov"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {t('relationship') || 'Qarindoshligi'}
                      </label>
                      <select
                        value={emergencyRelationship}
                        onChange={(e) => setEmergencyRelationship(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Spouse">{t('spouse') || 'Turmush o‘rtog‘i'}</option>
                        <option value="Parent">{t('parent') || 'Ota-onasi'}</option>
                        <option value="Sibling">{t('sibling') || 'Aka-uka / Opa-singil'}</option>
                        <option value="Friend">{t('friend') || 'Do‘sti'}</option>
                        <option value="Other">{t('other') || 'Boshqa'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {t('phoneNumber') || 'Telefon raqam'}
                      </label>
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="+998 90 987 65 43"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Save size={14} />
                    <span>{t('save')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block font-medium mb-0.5">{t('fullName')}</span>
                    <strong className="text-slate-900 dark:text-white text-sm font-bold">{user.name}</strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block font-medium mb-0.5">{t('emailAddress')}</span>
                    <strong className="text-slate-900 dark:text-white text-sm font-bold">{user.email}</strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block font-medium mb-0.5">{t('patientPhone')}</span>
                    <strong className="text-slate-900 dark:text-white text-sm font-bold">{user.phone}</strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block font-medium mb-0.5">Status</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Active Verified
                    </span>
                  </div>
                </div>

                {/* Emergency Contact Display */}
                {user.emergencyContact && (
                  <div className="p-4 bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                        <HeartPulse size={14} className="text-rose-600 dark:text-rose-400" />
                        {t('emergencyContact') || 'Favqulodda bog‘lanish'}
                      </span>
                      <span className="text-[10px] font-semibold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md">
                        {user.emergencyContact.relationship}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{user.emergencyContact.name}</span>
                      <a
                        href={`tel:${user.emergencyContact.phone}`}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Phone size={12} />
                        {user.emergencyContact.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Preferences & Notifications */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-blue-600 dark:text-blue-400" />
                <span>{t('notificationSettings')}</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('smsConfirmationNotice')}
            </p>

            <div className="space-y-3 pt-2">
              {/* Main Appointment Reminders Toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 cursor-pointer transition-all hover:bg-blue-50 dark:hover:bg-blue-950/60">
                <div>
                  <strong className="text-xs text-blue-900 dark:text-blue-200 block font-bold">
                    {t('appointmentReminders')}
                  </strong>
                  <span className="text-[11px] text-blue-700/80 dark:text-blue-400/80">
                    {t('appointmentRemindersDesc')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={appointmentReminders}
                  onChange={(e) => handleToggleReminders(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              {/* SMS Reminders */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 cursor-pointer">
                <div>
                  <strong className="text-xs text-slate-800 dark:text-slate-200 block">SMS Notifications</strong>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">1 hour prior to doctor visit</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={(e) => setSmsNotifications(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </label>

              {/* Email Receipts */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 cursor-pointer">
                <div>
                  <strong className="text-xs text-slate-800 dark:text-slate-200 block">Email Receipts</strong>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Booking summary & e-ticket</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailReminders}
                  onChange={(e) => setEmailReminders(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Test Reminder Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => showUpcomingReminderToast()}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700 hover:border-blue-200 dark:hover:border-slate-600"
              >
                <Bell size={14} className="text-blue-600 dark:text-blue-400" />
                <span>{t('testReminderToast')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Saved Doctors */}
      {activeTab === 'savedDoctors' && (
        <div className="space-y-4">
          {savedDoctors.length === 0 ? (
            <EmptyState
              title={t('noDoctorsFound')}
              description={t('noDoctorsFoundDesc')}
              actionText={t('findDoctorsBtn')}
              linkTo="/search"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedDoctors.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Favorite Clinics */}
      {activeTab === 'favoriteClinics' && (
        <div className="space-y-4">
          {favoriteClinics.length === 0 ? (
            <EmptyState
              title={t('noResults')}
              description={t('noResultsDesc')}
              actionText={t('viewAllClinics')}
              linkTo="/search?searchType=clinics"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteClinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
