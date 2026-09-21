import React from 'react';
import { HeartPulse, ShieldCheck, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-20 pb-20 md:pb-0 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-3.5 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <HeartPulse size={18} />
              </div>
              <span className="font-bold text-lg text-blue-900 dark:text-blue-400 tracking-tight">DocNear</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('footerDesc')}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('strictVerification')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              {t('footerFindCare')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li>
                <Link to="/search" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('findDoctors')}
                </Link>
              </li>
              <li>
                <Link to="/search?searchType=clinics" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('clinics')}
                </Link>
              </li>
              <li>
                <Link to="/specialties" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('specialties')}
                </Link>
              </li>
              <li>
                <Link to="/emergency" className="text-red-600 dark:text-red-400 hover:underline font-semibold">
                  {t('emergency')} 24/7
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Specialties */}
          <div>
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              {t('footerPopularSpecialties')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li>
                <Link to="/search?specialty=Cardiology" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Cardiologist
                </Link>
              </li>
              <li>
                <Link to="/search?specialty=Dentistry" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dentist
                </Link>
              </li>
              <li>
                <Link to="/search?specialty=Pediatrics" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Pediatrician
                </Link>
              </li>
              <li>
                <Link to="/search?specialty=Dermatology" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dermatologist
                </Link>
              </li>
            </ul>
          </div>

          {/* Partner & Support */}
          <div>
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              {t('footerPartnerSupport')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              {t('footerPartnerDesc')}
            </p>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <Phone size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>+998 71 200 44 88</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>partner-support@docnear.med</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek bottom copyright bar */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        <div>© 2026 DocNear Healthcare Technology. {t('allRightsReserved')}</div>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('privacyPolicy')}</Link>
          <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('termsOfService')}</Link>
          <Link to="/support" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('partnerSupport')}</Link>
        </div>
      </div>
    </footer>
  );
};
