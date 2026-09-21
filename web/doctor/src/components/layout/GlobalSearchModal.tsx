import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Calendar, Clock, Building2, X, ArrowRight } from 'lucide-react';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useClinic } from '../../hooks/useClinic';
import { patientService } from '../../services/patientService';
import { Patient } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const clinic = useClinic();
  const [patients,setPatients]=useState<Patient[]>([]);
  useEffect(()=>{if(isOpen) patientService.getPatients().then(setPatients).catch(console.error)},[isOpen]);
  const [query, setQuery] = useState('');
  const { appointments, setSelectedAppointmentId } = useAppointmentStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle modal
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingPatients = q
    ? patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.bloodGroup.toLowerCase().includes(q)
      )
    : [];

  const matchingAppointments = q
    ? appointments.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.bookingCode.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          a.date.includes(q)
      )
    : [];

  const clinicMatches =
    q &&
    (clinic.name.toLowerCase().includes(q) ||
      clinic.services.some((s) => s.toLowerCase().includes(q)) ||
      clinic.facilities.some((f) => f.toLowerCase().includes(q)))
      ? [clinic]
      : [];

  const totalResults = matchingPatients.length + matchingAppointments.length + clinicMatches.length;

  return (
    <div
      id="global-search-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="global-search-container"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients by name, phone, booking ID, or clinical service..."
            className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="p-4 overflow-y-auto space-y-6">
          {!q ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Type keywords to search across Patients, Appointments, and MedLife Clinic services.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No clinical records matching "{query}".
            </div>
          ) : (
            <>
              {/* Category: Patients */}
              {matchingPatients.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Patients ({matchingPatients.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {matchingPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          navigate(`/patients/${p.id}`);
                          onClose();
                        }}
                        className="py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {p.fullName}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                            <span>{p.phone}</span>
                            <span>•</span>
                            <span>Blood: {p.bloodGroup}</span>
                            <span>•</span>
                            <span>{p.totalAppointments} visits</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Appointments */}
              {matchingAppointments.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Appointments ({matchingAppointments.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {matchingAppointments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          setSelectedAppointmentId(a.id);
                          onClose();
                        }}
                        className="py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{a.patientName}</span>
                            <span className="text-xs font-mono text-slate-400">({a.bookingCode})</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {a.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {a.time}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{a.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          View details
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Clinic Services */}
              {clinicMatches.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Clinic Directory</span>
                  </div>
                  <div
                    onClick={() => {
                      navigate('/clinic');
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {clinic.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{clinic.address}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
