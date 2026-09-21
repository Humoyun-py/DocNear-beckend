import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Appointment } from '../../types';
import { MapPin, Navigation, Copy, Check, ExternalLink, Compass } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

interface ClinicLocationModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicLocationModal: React.FC<ClinicLocationModalProps> = ({
  appointment,
  isOpen,
  onClose,
}) => {
  const { addToast } = useToastStore();
  const [copied, setCopied] = useState(false);

  if (!appointment) return null;

  const address = appointment.clinicAddress || '14 Amir Temur Avenue, Yunusabad District, Tashkent';
  const clinicName = appointment.clinicName || 'MedLife Central Clinic';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    addToast({
      type: 'info',
      title: 'Address Copied',
      message: 'Clinic location copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const openGoogleMaps = () => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clinic Location & Navigation"
      subtitle={`${clinicName} • Booking ID: ${appointment.bookingCode}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleCopyAddress}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Address'}</span>
          </button>
          <button
            type="button"
            onClick={openGoogleMaps}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <Navigation className="w-4 h-4" />
            <span>Open in Maps</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Interactive Map Visual */}
        <div className="relative h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <div className="absolute inset-0 bg-radial from-transparent to-slate-900/20 pointer-events-none" />
          <div className="text-center space-y-2 p-6 z-10">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">{clinicName}</div>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">{address}</p>
          </div>
        </div>

        {/* Transit & Directions Details */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Transit & Arrival Instructions</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Located 300 meters north of Minor Metro Station, opposite the International Business Center.
            Dedicated patient drop-off bay and parking available on Amir Temur Avenue.
          </p>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/40 flex items-center justify-between text-[11px] text-slate-500">
            <span>Coordinates: 41.3275° N, 69.2817° E</span>
            <span>Hotline: {appointment.clinicPhone || '+998 71 200 80 00'}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
