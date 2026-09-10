import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Clock,
  Heart,
  AlertCircle,
  FileText,
  Shield,
  Droplet,
  Plus,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { Patient } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToastStore } from '../../store/useToastStore';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { Modal } from '../../components/common/Modal';

export const PatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { appointments, setSelectedAppointmentId, setRescheduleTarget } = useAppointmentStore();

  const [patient,setPatient]=useState<Patient>();
  useEffect(()=>{if(id) patientService.getPatientById(id).then(setPatient).catch(console.error)},[id]);
  const patientAppointments = appointments.filter(
    (a) => a.patientId === patient?.id
  );

  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState<string[]>([]);

  const upcomingApts = patientAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'waiting' || a.status === 'pending'
  );
  const pastApts = patientAppointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show'
  );

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addToast({type:'error',title:'Saqlanmadi',message:'Klinik qaydlarni saqlash bu API’da mavjud emas'});
  };

  if (!patient) return <div role="status">Bemor ma’lumotlari yuklanmoqda…</div>;
  return (
    <div id="patient-profile-page" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Directory</span>
        </button>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {patient.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {patient.fullName}
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1">
                  <Droplet className="w-3 h-3" />
                  {patient.bloodGroup}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-4">
                <span>DOB: {patient.dateOfBirth}</span>
                <span>•</span>
                <span>Gender: {patient.gender}</span>
                <span>•</span>
                <span>ID: {patient.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              disabled title="Clinical notes are not available for this account"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Clinical Note</span>
            </button>
            <button
              onClick={() => navigate('/appointments')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Schedule Visit</span>
            </button>
          </div>
        </div>

        {/* Quick Clinical Demographics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block text-[11px]">Primary Phone</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {patient.phone}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block text-[11px]">Emergency Contact</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {patient.emergencyContact ? `${patient.emergencyContact.name} (${patient.emergencyContact.phone})` : 'None'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block text-[11px]">Documented Allergies</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 mt-0.5 block truncate">
              {patient.allergies.join(', ') || 'No known drug allergies'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block text-[11px]">Chronic Conditions</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {patient.medicalHistory?.join(', ') || 'None declared'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Appointments History & Clinical Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Appointments */}
        <div className="lg:col-span-8 space-y-6">
          {/* Upcoming consultations */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Upcoming Appointments</span>
            </h3>

            {upcomingApts.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3">
                No future consultations booked for this patient.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingApts.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedAppointmentId(apt.id)}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                        <span>{apt.type}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({apt.bookingCode})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {apt.date}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {apt.time}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={apt.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past consultation history */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Consultation History & Records</span>
            </h3>

            {pastApts.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3">
                No past consultations recorded in this clinic.
              </p>
            ) : (
              <div className="space-y-3">
                {pastApts.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedAppointmentId(apt.id)}
                    className="p-4 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {apt.type}
                      </span>
                      <StatusBadge status={apt.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1 font-mono">
                      <span>{apt.date}</span>
                      <span>•</span>
                      <span>{apt.time}</span>
                      <span>•</span>
                      <span>{apt.clinicName}</span>
                    </div>
                    {apt.doctorNote && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-blue-500 pl-2.5">
                        "{apt.doctorNote}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Internal Physician Notes */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Internal Doctor Notes</span>
            </h3>
            <button
              onClick={() => setIsAddNoteOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              + Add
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {clinicalNotes.map((note, index) => (
              <div
                key={index}
                className="p-3.5 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                <div className="text-[10px] font-mono text-slate-400 mb-1">
                  Dr. Akmal Karimov • Internal Record
                </div>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Clinical Note Modal */}
      <Modal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        title="Add Patient Clinical Note"
        subtitle={`Patient: ${patient.fullName}`}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddNoteOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-note-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Save Note
            </button>
          </>
        }
      >
        <form id="add-note-form" onSubmit={handleSaveNote} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Physician Remarks & Observation
            </label>
            <textarea
              rows={4}
              required
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Record diagnostic impression, treatment response, or medication titration remarks..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
