import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Phone,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
  Droplet,
  ExternalLink,
  History,
  FileText,
  UserCheck,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { Patient } from '../../types';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { EmptyState } from '../../components/common/EmptyState';

export const PatientsPage: React.FC = () => {
  const [patients,setPatients] = useState<Patient[]>([]);
  useEffect(()=>{patientService.getPatients().then(setPatients).catch(console.error)},[]);
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent'}).format(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const navigate = useNavigate();

  const { appointments } = useAppointmentStore();
  const { user, profile } = useAuthStore();

  const currentDoctorId = user?.doctorId || profile?.id || 'doctor_001';

  // Compute live metrics per patient for this specific doctor
  const patientsWithDoctorMetrics = useMemo(() => {
    return patients.map((patient) => {
      // Find all appointments with this doctor
      const doctorApts = appointments.filter(
        (a) =>
          (a.patientId === patient.id || a.patientName.toLowerCase() === patient.fullName.toLowerCase()) &&
          (a.doctorId === currentDoctorId || a.doctorProfileId === currentDoctorId)
      );

      // Sort by date/time
      const sorted = [...doctorApts].sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        return d !== 0 ? d : a.time.localeCompare(b.time);
      });

      const completedOrPast = sorted.filter(
        (a) => a.status === 'completed' || a.status === 'COMPLETED' || a.date < today
      );
      const upcoming = sorted.filter(
        (a) =>
          (a.status === 'confirmed' || a.status === 'CONFIRMED' || a.status === 'waiting' || a.status === 'pending') &&
          a.date >= today
      );

      const lastVisit = completedOrPast.length > 0 ? completedOrPast[completedOrPast.length - 1].date : patient.lastAppointmentDate || 'First Visit';
      const nextVisit = upcoming.length > 0 ? `${upcoming[0].date} at ${upcoming[0].time}` : patient.nextAppointmentDate || 'None booked';
      const totalVisits = doctorApts.length > 0 ? doctorApts.length : patient.totalAppointments;

      return {
        ...patient,
        totalDoctorVisits: totalVisits,
        lastVisitDate: lastVisit,
        nextVisitDate: nextVisit,
        hasAppointmentsWithDoctor: doctorApts.length > 0,
      };
    });
  }, [appointments, currentDoctorId, patients, today]);

  const filteredPatients = useMemo(() => {
    return patientsWithDoctorMetrics.filter((p) => {
      if (selectedBloodGroup !== 'all' && p.bloodGroup !== selectedBloodGroup) return false;
      if (selectedGender !== 'all' && p.gender.toLowerCase() !== selectedGender.toLowerCase())
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesPhone = p.phone.includes(q);
        const matchesEmail = p.email.toLowerCase().includes(q);
        const matchesBlood = p.bloodGroup.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesBlood) return false;
      }
      return true;
    });
  }, [patientsWithDoctorMetrics, searchQuery, selectedBloodGroup, selectedGender]);

  return (
    <div id="patients-page-container" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Patient Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registered patients, contact details, total visits, and consultation histories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
            {filteredPatients.length} Active Patients
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients by name, phone, email, or blood group..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedBloodGroup}
            onChange={(e) => setSelectedBloodGroup(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Patient Table (Desktop) & Cards (Mobile) */}
      {filteredPatients.length === 0 ? (
        <EmptyState
          title="No patients found"
          description="No patients match your search criteria. Try a different query or reset filters."
          actionLabel="Reset Search"
          onAction={() => {
            setSearchQuery('');
            setSelectedBloodGroup('all');
            setSelectedGender('all');
          }}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Patient Name</th>
                  <th className="py-3.5 px-4">Contact Info (Phone & Email)</th>
                  <th className="py-3.5 px-4 text-center">Total Visits</th>
                  <th className="py-3.5 px-4">Last Visit</th>
                  <th className="py-3.5 px-4">Next Appointment</th>
                  <th className="py-3.5 px-5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    {/* Patient Name */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                          {patient.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {patient.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span>DOB: {patient.dateOfBirth}</span>
                            <span>•</span>
                            <span className="capitalize">{patient.gender}</span>
                            <span>•</span>
                            <span className="font-semibold text-rose-600">{patient.bloodGroup}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info (Phone & Email) */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{patient.phone}</span>
                        </div>
                        <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{patient.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Total visits with this doctor */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {patient.totalDoctorVisits}
                      </span>
                    </td>

                    {/* Last visit date */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {patient.lastVisitDate}
                    </td>

                    {/* Next appointment date (if any) */}
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      {patient.nextVisitDate !== 'None booked' ? (
                        <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                          {patient.nextVisitDate}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">None booked</span>
                      )}
                    </td>

                    {/* Quick action: view appointment history */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>View History</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="p-4 space-y-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {patient.fullName}
                  </div>
                  <span className="font-mono text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                    {patient.bloodGroup}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Visits: <strong className="font-mono">{patient.totalDoctorVisits}</strong>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/patients/${patient.id}`);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                  >
                    <span>View History</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
