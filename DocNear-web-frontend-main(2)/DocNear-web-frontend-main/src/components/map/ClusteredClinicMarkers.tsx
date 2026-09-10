import React, { useMemo, useState, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clinic, Doctor } from '../../types';
import { PartnerBadge } from '../common/PartnerBadge';
import { RatingBadge } from '../common/RatingBadge';
import { DistanceBadge } from '../common/DistanceBadge';
import { Link } from 'react-router-dom';
import { useAppointments } from '../../context/AppointmentContext';
import { useLanguage } from '../../context/LanguageContext';
import { Building2, Stethoscope, User, ArrowRight, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { doctorService } from '../../services/doctorService';

interface ClusteredClinicMarkersProps {
  clinics: Clinic[];
  selectedClinicId?: string | null;
  activeClinic: Clinic | null;
  onSelectClinic?: (clinic: Clinic) => void;
  setActiveClinic: (clinic: Clinic | null) => void;
}

export const ClusteredClinicMarkers: React.FC<ClusteredClinicMarkersProps> = ({
  clinics,
  selectedClinicId,
  activeClinic,
  onSelectClinic,
  setActiveClinic,
}) => {
  const [doctors,setDoctors] = useState<Doctor[]>([]);
  useEffect(()=>{doctorService.getDoctors().then(setDoctors).catch(console.error)},[]);
  const map = useMap();
  const { openBookingModal } = useAppointments();
  const { t, language } = useLanguage();

  // Custom icon creator for Clinic / Doctor Room markers
  const createClinicIcon = (clinic: Clinic, isSelected: boolean) => {
    const isEmergency = clinic.isEmergency24x7;
    const bgColor = isEmergency ? '#dc2626' : isSelected ? '#1d4ed8' : '#0f172a';
    const borderColor = isSelected ? '#93c5fd' : '#ffffff';
    const scale = isSelected ? 'transform: scale(1.15);' : '';
    const doctorCount = clinic.doctorCount || 1;
    const label = clinic.name.length > 18 ? `${clinic.name.substring(0, 16)}…` : clinic.name;
    const shortName = label.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

    return L.divIcon({
      className: 'custom-clinic-marker',
      html: `
        <div class="marker-inner-enter" style="display: inline-flex; flex-direction: column; align-items: center; cursor: pointer; ${scale} transition: transform 0.2s ease;">
          <div style="background: ${bgColor}; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); border: 2px solid ${borderColor}; white-space: nowrap;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background: ${isEmergency ? '#ef4444' : '#2563eb'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg style="width: 10px; height: 10px; fill: white;" viewBox="0 0 24 24"><path d="M19 10.5V8.5h-5.5V3h-3v5.5H5v2h5.5V16h3v-5.5H19zM12 21.5c-4.97 0-9-4.03-9-9 0-2.12.74-4.07 1.97-5.61L3.5 5.42C1.98 7.24 1.05 9.61 1.05 12.2c0 6.07 4.93 11 11 11 2.59 0 4.96-.93 6.78-2.45l-1.47-1.47c-1.54 1.23-3.49 1.97-5.61 1.97z"/></svg>
            </div>
            <span style="max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${shortName}</span>
            <span style="background: rgba(255,255,255,0.22); padding: 1px 5px; border-radius: 6px; font-size: 9px; font-weight: 800;">${doctorCount} dr</span>
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${bgColor}; margin-top: -1px;"></div>
        </div>
      `,
      iconSize: [140, 38],
      iconAnchor: [70, 38],
      popupAnchor: [0, -38],
    });
  };

  return (
    <>
      {clinics.map((clinic) => {
        if (!clinic.coordinates || typeof clinic.coordinates.lat !== 'number' || typeof clinic.coordinates.lng !== 'number') {
          return null;
        }

        const isSelected = selectedClinicId === clinic.id || activeClinic?.id === clinic.id;
        // Associated doctors for this clinic to display in popup
        const clinicDoctors = doctors.filter((d) => d.clinicId === clinic.id).slice(0, 3);

        return (
          <Marker
            key={`clinic-${clinic.id}`}
            position={[clinic.coordinates.lat, clinic.coordinates.lng]}
            icon={createClinicIcon(clinic, isSelected)}
            eventHandlers={{
              click: () => {
                setActiveClinic(clinic);
                onSelectClinic?.(clinic);
              },
            }}
          >
            <Popup className="custom-clinic-popup" autoPan={true} maxWidth={320} minWidth={260}>
              <div className="p-3.5 space-y-2.5">
                {/* Clinic Image with Badges */}
                <Link
                  to={`/clinics/${clinic.id}`}
                  className="relative h-24 w-full rounded-2xl overflow-hidden block cursor-pointer group/mapimg shadow-xs"
                >
                  <img
                    src={clinic.image}
                    alt={clinic.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover/mapimg:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <PartnerBadge size="sm" />
                    {clinic.isEmergency24x7 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-extrabold shadow-sm">
                        24/7
                      </span>
                    )}
                  </div>
                </Link>

                {/* Clinic Name & Address */}
                <div>
                  <Link
                    to={`/clinics/${clinic.id}`}
                    className="font-bold text-sm text-slate-900 leading-snug hover:text-blue-600 hover:underline block truncate"
                  >
                    {clinic.name}
                  </Link>
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{clinic.address}</span>
                  </p>
                </div>

                {/* Rating and Distance */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <RatingBadge rating={clinic.rating} reviewCount={clinic.reviewCount} size="sm" />
                  <DistanceBadge distanceKm={clinic.distanceKm} size="sm" />
                </div>

                {/* Doctors Section in Popup */}
                {clinicDoctors.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Stethoscope size={12} className="text-blue-600" />
                        <span>{language === 'uz' ? 'Qabuldagi shifokorlar' : language === 'ru' ? 'Врачи клиники' : 'Available Doctors'}</span>
                      </span>
                      <span className="text-[10px] text-blue-600 font-semibold">{clinic.doctorCount} {t('doctors')}</span>
                    </div>

                    <div className="space-y-1.5">
                      {clinicDoctors.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img
                              src={doc.photo}
                              alt={doc.name}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <span className="font-semibold text-slate-800 truncate">{doc.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">{doc.specialty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-1 flex items-center gap-2">
                  <Link
                    to={`/clinics/${clinic.id}`}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-center rounded-xl text-xs font-semibold transition-colors"
                  >
                    {t('viewClinic')}
                  </Link>
                  <button
                    onClick={() => openBookingModal({ clinic })}
                    className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs hover:shadow-sm"
                  >
                    {t('bookNow')}
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
