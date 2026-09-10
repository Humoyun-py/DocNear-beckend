import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Star,
  Award,
  BookOpen,
  Globe,
  MapPin,
  Mail,
  Phone,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Clock,
  Briefcase,
  AlertTriangle,
  Building2,
  DoorOpen,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { Modal } from '../../components/common/Modal';
import { VerificationStatus } from '../../types';
import { doctorProfileService } from '../../services/doctorProfileService';
import { useClinic } from '../../hooks/useClinic';

export const ProfilePage: React.FC = () => {
  const clinic = useClinic();
  const { profile, updateProfile, setVerificationStatus } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Doctor profile fields
  const [title, setTitle] = useState(profile?.title || 'Dr.');
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [specialty, setSpecialty] = useState(profile?.specialty || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(profile?.yearsOfExperience || 0);
  const [consultationFee, setConsultationFee] = useState(profile?.consultationFee || 0);
  const [bio, setBio] = useState(profile?.bio || '');
  const [languages, setLanguages] = useState(profile?.languages.join(', ') || '');

  // Clinic information fields
  const [clinicName, setClinicName] = useState(clinic.name || '');
  const [clinicAddress, setClinicAddress] = useState(clinic.address || '');
  const [clinicPhone, setClinicPhone] = useState(clinic.phone || '');
  const [officeNumber, setOfficeNumber] = useState(profile?.officeNumber || '');

  if (!profile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    const saved = await doctorProfileService.updateProfile({
      title,
      firstName,
      lastName,
      specialty,
      yearsOfExperience: Number(yearsOfExperience),
      consultationFee: Number(consultationFee),
      bio,
      languages: languages.split(',').map((l) => l.trim()),
      officeNumber,
    });

    updateProfile(saved);

    addToast({
      type: 'success',
      title: 'Profile saved',
      message: 'Bio and languages saved. Experience changes await administrator review.',
    });
    setIsEditModalOpen(false);
    } catch(error) { addToast({type:'error',title:'Saqlanmadi',message:error instanceof Error ? error.message : 'API xatosi'}); }
  };

  const handleStatusChange = (status: VerificationStatus) => {
    setVerificationStatus(status);
    addToast({
      type: 'info',
      title: 'Verification Status Changed',
      message: `Switched account state to "${status.replace('_', ' ')}" for demonstration.`,
    });
  };

  return (
    <div id="profile-page-container" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Doctor Profile & Clinic Information
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Verified physician portfolio, subspecialties, consultation pricing, and assigned office
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/profile/preview"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Public Patient Preview</span>
          </Link>
          <button
            id="edit-profile-btn"
            onClick={() => {
              setTitle(profile.title);
              setFirstName(profile.firstName);
              setLastName(profile.lastName);
              setSpecialty(profile.specialty);
              setYearsOfExperience(profile.yearsOfExperience);
              setConsultationFee(profile.consultationFee);
              setBio(profile.bio);
              setLanguages(profile.languages.join(', '));
              setOfficeNumber(profile.officeNumber || '');
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile & Clinic</span>
          </button>
        </div>
      </div>


      {/* Main Grid: Left Doctor Info, Right Assigned Clinic & Certifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Doctor Profile Overview */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Identity Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <img
                src={profile.avatarUrl}
                alt={`${profile.title} ${profile.firstName} ${profile.lastName}`}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-600 shadow-sm"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {profile.title} {profile.firstName} {profile.lastName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Specialist</span>
                  </span>
                </div>

                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {profile.specialty}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">{profile.yearsOfExperience} years</strong> clinical experience
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <strong className="text-slate-800 dark:text-slate-200">{profile.rating}</strong> ({profile.reviewCount} reviews)
                  </span>
                  <span>•</span>
                  <span className="font-mono">License: {profile.medicalLicenseNumber}</span>
                </div>
              </div>
            </div>

            {/* Key Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Consultation Fee</span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {new Intl.NumberFormat('uz-UZ').format(profile.consultationFee)} UZS
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Consultation Duration</span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  30 minutes
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Assigned Room</span>
                <span className="font-bold text-base text-blue-600 dark:text-blue-400">
                  {profile.officeNumber || ''}
                </span>
              </div>
            </div>

            {/* Bio / About Doctor */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                About the Physician / Biography
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {profile.bio}
              </p>
            </div>

            {/* Sub-Specialties */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Sub-Specialties & Clinical Focus
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.subSpecialties.map((sub) => (
                  <span
                    key={sub}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Assigned Clinic Information & Certifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Assigned Clinic Information Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Assigned Clinic</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Primary Practice
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">Clinic Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {clinic.name}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">Clinic Address</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{clinic.address}</span>
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">Clinic Phone</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{clinic.phone}</span>
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">Working Room / Office</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-0.5">
                  <DoorOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{profile.officeNumber || ''}</span>
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px] font-semibold">Working Hours</span>
                <span className="text-slate-600 dark:text-slate-400 mt-0.5 block">
                  {clinic.workingHours}
                </span>
              </div>
            </div>
          </div>

          {/* Languages Spoken */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Languages Spoken</span>
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {profile.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Board Certifications */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Board Certifications</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {profile.certifications.map((cert, idx) => (
                <li key={`${cert.title}-${idx}`} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{cert.title}</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">
                      {cert.issuingOrganization} • {cert.year}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Edit Profile & Clinic Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Doctor Profile & Clinic"
        subtitle="Update physician credentials, experience, consultation fee, and assigned office"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-profile-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Save Profile & Clinic
            </button>
          </>
        }
      >
        <p className="text-xs text-slate-500">Name, affiliation and pricing are managed by your administrator. Credential changes require review.</p>
        <form id="edit-profile-form" onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {/* Full Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Title
              </label>
              <input
                type="text"
                disabled
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dr. / Prof."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                disabled
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                disabled
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Specialization & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specialization
              </label>
              <input
                type="text"
                required
                disabled
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Consultation Fee & Spoken Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Consultation Fee (UZS)
              </label>
              <input
                type="number"
                step={10000}
                disabled
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Languages (comma separated)
              </label>
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Assigned Clinic Information Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Assigned Clinic Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinic Name
                </label>
                <input
                  type="text"
                  required
                  disabled
                value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Working Room / Office Number
                </label>
                <input
                  type="text"
                  required
                  disabled
                value={officeNumber}
                  onChange={(e) => setOfficeNumber(e.target.value)}
                  placeholder="e.g. Room 304 (3rd Floor)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinic Address
                </label>
                <input
                  type="text"
                  required
                  disabled
                value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  required
                  disabled
                value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="pt-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bio / About Doctor
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
