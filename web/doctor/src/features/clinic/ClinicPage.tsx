import React from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { useClinic } from '../../hooks/useClinic';

export const ClinicPage: React.FC = () => {
  const clinic = useClinic();
  return (
    <div id="clinic-page-container" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Partner Clinic Information
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Institutional overview, diagnostic facilities, and affiliated clinical departments
          </p>
        </div>
      </div>

      {/* Institutional Authorization Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
        <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-slate-900 dark:text-white">
            Administrative Access Restriction
          </span>
          Clinic details, operating license, and institutional equipment records are centrally
          managed by MedLife Health Administration. Individual physicians cannot modify facility
          data without verified administrator credentials.
        </div>
      </div>

      {/* Clinic Hero Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="relative h-48 sm:h-64 bg-slate-800">
          <img
            src={clinic.coverImageUrl}
            alt="MedLife Central Clinic Facility"
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <img
                src={clinic.logoUrl}
                alt="Clinic Emblem"
                className="w-16 h-16 rounded-xl bg-white p-1 object-contain shadow-lg border border-white/20"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">{clinic.name}</h3>
                <p className="text-xs text-blue-200 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{clinic.address}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-white/20 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20">
                {clinic.doctorCount} Affiliated Physicians
              </span>
            </div>
          </div>
        </div>

        {/* Contact, Hours & Physician Assigned Office Row */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
              Reception & Appointments
            </span>
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{clinic.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
              <Mail className="w-3.5 h-3.5" />
              <span>{clinic.email}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
              Clinical Operational Hours
            </span>
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{clinic.workingHours}</span>
            </div>
            <p className="text-slate-500 text-xs">Emergency Department: Open 24/7</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
              Your Assigned Office
            </span>
            <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">
              {clinic.officeNumber || 'Room 304 (3rd Floor)'}
            </div>
            <p className="text-slate-500 text-xs">Cardiology Department Wing B</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
              Accreditation & Registry
            </span>
            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Ministry of Health License #9482-A
            </div>
            <p className="text-slate-500 text-xs">ISO 9001:2015 Healthcare Certified</p>
          </div>
        </div>

        {/* Services & Facilities Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Services */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Clinical Specializations & Services
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {clinic.services.map((srv) => (
                <div
                  key={srv}
                  className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{srv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Diagnostic & Patient Amenities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {clinic.facilities.map((fac) => (
                <div
                  key={fac}
                  className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Location & Directions Map Preview */}
        <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Location & Parking Guidance
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Conveniently located near Amir Temur Square Metro with multi-tier visitor parking.
              </p>
            </div>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Get Directions</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
