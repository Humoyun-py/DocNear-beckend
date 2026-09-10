import { doctorScheduleService } from '../../services/doctorScheduleService';
import { today, upcomingDays } from '../../utils/calendar';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Calendar,
  Phone,
  CheckCircle2,
  Share2,
  Heart,
  CreditCard,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useToastStore } from '../../store/useToastStore';
import { useClinic } from '../../hooks/useClinic';

export const PublicProfilePreviewPage: React.FC = () => {
  const clinic = useClinic();
  const { profile } = useAuthStore();
  const { workingHours, settings } = useScheduleStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [selectedSlot, setSelectedSlot] = useState<string>('14:30');
  const [selectedDate, setSelectedDate] = useState<string>(today());

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  useEffect(() => {
    setAvailableSlots([]); setSelectedSlot('');
    doctorScheduleService.getAvailableSlots(selectedDate).then(setAvailableSlots).catch(() => setAvailableSlots([]));
  }, [selectedDate]);
  if (!profile) return null;

  

  const handlePreviewTime = () => {
    addToast({
      type: 'success',
      title: 'Patient Booking Flow Preview',
      message: `Selected slot: ${selectedDate} at ${selectedSlot}. Patients submit their request through DocNear App.`,
    });
  };

  return (
    <div id="public-profile-preview" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner indicating preview mode */}
      <div className="flex items-center justify-between p-3.5 bg-blue-600 text-white rounded-xl shadow-sm text-xs">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span>Patient Portal Preview Mode • This is how patients see your DocNear profile.</span>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Panel</span>
        </button>
      </div>

      {/* Realistic Patient View Container */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cover Header */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() =>
                addToast({
                  type: 'info',
                  title: 'Profile Link Copied',
                  message: 'Public URL copied to clipboard for patient sharing.',
                })
              }
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors"
              title="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doctor Identity Header */}
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4">
            <div className="flex items-end gap-4">
              <img
                src={profile.avatarUrl}
                alt="Doctor Headshot"
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl"
                referrerPolicy="no-referrer"
              />
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {profile.title} {profile.firstName} {profile.lastName}
                  </h1>
                  {profile.verificationStatus === 'verified' && (
                    <ShieldCheck className="w-5 h-5 text-blue-600 fill-blue-50 dark:fill-blue-950" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {profile.specialty}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <div className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{profile.rating}</span>
                  </div>
                  <span className="text-slate-400">({profile.reviewCount} verified reviews)</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{profile.yearsOfExperience} yrs experience</span>
                </div>
              </div>
            </div>

            <div className="sm:text-right mb-2">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Consultation Fee
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {profile.consultationFee.toLocaleString()} UZS
              </div>
            </div>
          </div>

          {/* Subspecialties Badges */}
          <div className="flex flex-wrap gap-2 mt-6">
            {profile.subSpecialties?.map((sub) => (
              <span
                key={sub}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                {sub}
              </span>
            ))}
          </div>

          {/* Two Columns: Bio & Interactive Booking */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            {/* Left: About & Credentials */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  About Dr. Karimov
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {profile.bio}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Practice Location
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{clinic.name}</span>
                  </div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>14 Amir Temur Avenue, Tashkent, Uzbekistan</span>
                  </div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mon - Sat • 09:00 - 18:00</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Spoken Languages
                </h3>
                <div className="flex gap-2">
                  {profile.languages.map((l) => (
                    <span
                      key={l}
                      className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Booking Box Simulation */}
            <div className="lg:col-span-5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-6 border border-blue-100 dark:border-blue-900/40 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Book Clinical Appointment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose an available date & consultation slot
                </p>
              </div>

              {/* Date selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Consultation Date
                </label>
                <input
                  type="date"
                  min={today()}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>

              {/* Slots selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Available Slots
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 text-xs font-mono font-medium rounded-xl border transition-all ${
                        selectedSlot === slot
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="book-consultation-preview-btn"
                  onClick={handlePreviewTime}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Preview selected time</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Booking requests are submitted through the patient app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
