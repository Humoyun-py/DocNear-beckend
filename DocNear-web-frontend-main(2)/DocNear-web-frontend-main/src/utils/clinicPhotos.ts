import { Clinic, ClinicPhoto } from '../types';

export const DEFAULT_FACILITY_PHOTOS: ClinicPhoto[] = [
  {
    id: 'p-1',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=85',
    title: 'Main Reception & Patient Check-in Lobby',
    category: 'facility',
    description: 'Spacious, air-conditioned reception area with multi-lingual triage coordinators and electronic queue management.',
  },
  {
    id: 'p-2',
    url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1600&q=85',
    title: 'Modern High-Field MRI & CT Diagnostic Suite',
    category: 'equipment',
    description: 'Siemens 3.0T MRI and 128-slice CT scanner for ultra-precise non-invasive imaging.',
  },
  {
    id: 'p-3',
    url: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=1600&q=85',
    title: 'Sterile Minimally Invasive Surgical Suite',
    category: 'equipment',
    description: 'HEPA-filtered laminar airflow operating theater equipped with HD laparoscopic towers.',
  },
  {
    id: 'p-4',
    url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1600&q=85',
    title: 'Private Patient Inpatient Recovery Suite',
    category: 'rooms',
    description: 'En-suite private patient room with orthopedic adjustable bed, guest seating, and nurse call system.',
  },
  {
    id: 'p-5',
    url: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=1600&q=85',
    title: 'Doctor Consultation & Diagnostic Office',
    category: 'facility',
    description: 'Sound-insulated consultation room designed for patient comfort and confidential physician reviews.',
  },
  {
    id: 'p-6',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1600&q=85',
    title: 'Automated Biochemical & Hematology Laboratory',
    category: 'equipment',
    description: 'Full robotic laboratory delivering emergency blood panel results within 20 minutes.',
  },
  {
    id: 'p-7',
    url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1600&q=85',
    title: 'Facility Main Entrance & Ambulance Access',
    category: 'exterior',
    description: 'Dedicated barrier-free emergency ambulance ramp with direct ICU entrance.',
  },
  {
    id: 'p-8',
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1600&q=85',
    title: 'Patient Lounge & Organic Coffee Bar',
    category: 'facility',
    description: 'Relaxing lounge with high-speed Wi-Fi, comfortable seating, and refreshments.',
  },
];

/**
 * Returns a high-res photo gallery tailored for any clinic
 */
export function getClinicPhotos(clinic: Clinic): ClinicPhoto[] {
  if (clinic.gallery && clinic.gallery.length > 0) {
    return clinic.gallery;
  }

  // Generate a tailored gallery starting with clinic's cover & image
  const primaryCover: ClinicPhoto = {
    id: `${clinic.id}-cover`,
    url: clinic.coverImage || clinic.image,
    title: `${clinic.name} — Facility Overview`,
    category: 'exterior',
    description: clinic.tagline || clinic.description,
  };

  const primaryImage: ClinicPhoto = {
    id: `${clinic.id}-main`,
    url: clinic.image,
    title: `${clinic.name} — Main Entrance & Clinical Center`,
    category: 'facility',
    description: `${clinic.address} • Verified Partner Clinic`,
  };

  // Specific photos for dental clinics
  if (clinic.specialties.includes('Dentistry')) {
    return [
      primaryCover,
      primaryImage,
      {
        id: `${clinic.id}-dental-1`,
        url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=85',
        title: '3D Digital Dental CBCT & Panoramic Imaging Room',
        category: 'equipment',
        description: 'Advanced dental CT for precision implant planning and orthodontic alignment.',
      },
      {
        id: `${clinic.id}-dental-2`,
        url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1600&q=85',
        title: 'Ergonomic Dental Operatory Suite',
        category: 'facility',
        description: 'Painless ultrasonic treatment chair with intraoral 4K camera displays.',
      },
      {
        id: `${clinic.id}-dental-3`,
        url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1600&q=85',
        title: 'Sterilization & Autoclave Protocol Unit',
        category: 'equipment',
        description: 'European Class-B autoclave sterilization exceeding international hygiene standards.',
      },
      ...DEFAULT_FACILITY_PHOTOS.slice(3, 7),
    ];
  }

  // Specific photos for pediatric clinics
  if (clinic.specialties.includes('Pediatrics')) {
    return [
      primaryCover,
      primaryImage,
      {
        id: `${clinic.id}-pediatric-1`,
        url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1600&q=85',
        title: 'Children Sensory Waiting & Play Area',
        category: 'facility',
        description: 'Safe, sanitized indoor playground with interactive toys to keep children calm and happy.',
      },
      {
        id: `${clinic.id}-pediatric-2`,
        url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=85',
        title: 'Pediatric Specialist Examination Room',
        category: 'rooms',
        description: 'Child-friendly examination suite with gentle pediatric measurement equipment.',
      },
      ...DEFAULT_FACILITY_PHOTOS.slice(1, 6),
    ];
  }

  return [
    primaryCover,
    primaryImage,
    ...DEFAULT_FACILITY_PHOTOS.slice(1),
  ];
}
