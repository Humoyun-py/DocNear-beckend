import { Language } from '../i18n/translations';

export interface SpecialtyTranslation {
  id: string;
  name: {
    uz: string;
    ru: string;
    en: string;
  };
  description: {
    uz: string;
    ru: string;
    en: string;
  };
}

export const SPECIALTY_TRANSLATIONS: Record<string, SpecialtyTranslation> = {
  cardiology: {
    id: 'cardiology',
    name: {
      uz: 'Kardiologiya',
      ru: 'Кардиология',
      en: 'Cardiology',
    },
    description: {
      uz: 'Yurak-qon tomir salomatligi, EKG, exo-kardiografiya, qon bosimi va gipertoniyani davolash.',
      ru: 'Здоровье сердца, лечение сосудистых заболеваний, ЭКГ, ЭхоКГ и контроль артериального давления.',
      en: 'Heart health, vascular disease treatment, ECG, echocardiograms & hypertension management.',
    },
  },
  dentistry: {
    id: 'dentistry',
    name: {
      uz: 'Stomatologiya',
      ru: 'Стоматология',
      en: 'Dentistry',
    },
    description: {
      uz: 'Kompleks tish davolash, implantatsiya, tish oqartirish, vinirlar, ortodontiya va bolalar stomatologiyasi.',
      ru: 'Комплексное лечение зубов, имплантация, отбеливание, виниры, ортодонтия и детская стоматология.',
      en: 'Comprehensive dental care, implants, whitening, veneers, orthodontics & pediatric dentistry.',
    },
  },
  pediatrics: {
    id: 'pediatrics',
    name: {
      uz: 'Pediatriya',
      ru: 'Педиатрия',
      en: 'Pediatrics',
    },
    description: {
      uz: 'Chaqaloqlar, bolalar va o‘smirlar uchun malakali tibbiy yordam, profilaktik ko‘rik va vaksinalar.',
      ru: 'Квалифицированная медицинская помощь детям, профилактические осмотры и вакцинация.',
      en: 'Expert medical care for infants, children, and adolescents with preventive screening & vaccinations.',
    },
  },
  dermatology: {
    id: 'dermatology',
    name: {
      uz: 'Dermatologiya',
      ru: 'Дерматология',
      en: 'Dermatology',
    },
    description: {
      uz: 'Teri, soch va tirnoq kasalliklarini ilg‘or tashxislash, davolash hamda estetik muolajalar.',
      ru: 'Диагностика и лечение заболеваний кожи, волос и ногтей, эстетические процедуры.',
      en: 'Advanced diagnosis and therapies for skin, hair, and nail conditions, plus aesthetic procedures.',
    },
  },
  neurology: {
    id: 'neurology',
    name: {
      uz: 'Nevrologiya',
      ru: 'Неврология',
      en: 'Neurology',
    },
    description: {
      uz: 'Bosh miya, orqa miya, asab tizimi kasalliklari, bosh og‘rig‘i, migren va uyqu buzilishlarini davolash.',
      ru: 'Лечение заболеваний головного мозга, позвоночника, нервной системы, мигрени и нарушений сна.',
      en: 'Specialized care for disorders of the brain, spinal cord, nerves, migraines & sleep disorders.',
    },
  },
  ophthalmology: {
    id: 'ophthalmology',
    name: {
      uz: 'Oftalmologiya',
      ru: 'Офтальмология',
      en: 'Ophthalmology',
    },
    description: {
      uz: 'Ko‘rish qobiliyatini tekshirish, lazer korreksiyasi, katarakta, glaukoma va ko‘z salomatligini davolash.',
      ru: 'Проверка зрения, лазерная коррекция, лечение катаракты, глаукомы и заболеваний сетчатки.',
      en: 'Vision examination, laser correction, cataract surgery, glaucoma and retinal care.',
    },
  },
  orthopedics: {
    id: 'orthopedics',
    name: {
      uz: 'Ortopediya va travmatologiya',
      ru: 'Ортопедия и травматология',
      en: 'Orthopedics',
    },
    description: {
      uz: 'Suyak sinishi, bo‘g‘im og‘riqlari, umurtqa davolash, sport jarohatlari va artroskopiya.',
      ru: 'Лечение переломов, болей в суставах, заболеваний позвоночника и спортивных травм.',
      en: 'Treatment for bone fractures, joint pain, spine therapy, sports injuries & arthroscopy.',
    },
  },
  gynecology: {
    id: 'gynecology',
    name: {
      uz: 'Ginekologiya',
      ru: 'Гинекология',
      en: 'Gynecology',
    },
    description: {
      uz: 'Ayollar salomatligi, homiladorlik nazorati, UTT (UZI) skrininglari va gormonal terapiya.',
      ru: 'Женское здоровье, ведение беременности, УЗИ-скрининги и гормональная терапия.',
      en: 'Women’s reproductive health, prenatal consultations, ultrasound screenings & hormonal therapy.',
    },
  },
  ent: {
    id: 'ent',
    name: {
      uz: 'LOR (Otorinolaringologiya)',
      ru: 'Отоларингология (ЛОР)',
      en: 'ENT (Otolaryngology)',
    },
    description: {
      uz: 'Quloq, burun, tomoq kasalliklari, gaymorit, eshitish pasayishi va tonzillitni davolash.',
      ru: 'Лечение заболеваний уха, горла, носа, синуситов, снижения слуха и тонзиллита.',
      en: 'Comprehensive treatment for ear, nose, throat, sinusitis, hearing loss, and tonsillitis.',
    },
  },
  'general-medicine': {
    id: 'general-medicine',
    name: {
      uz: 'Umumiy tibbiyot (Terapiya)',
      ru: 'Общая терапия',
      en: 'General Medicine',
    },
    description: {
      uz: 'Birlamchi tibbiy ko‘rik, to‘liq tibbiy ko‘rik, laboratoriya tahlillari xulosasi va yo‘naltiruvchi konsultatsiya.',
      ru: 'Первичные консультации, полный медосмотр, диагностика и комплексное ведение пациентов.',
      en: 'Primary health consultations, complete physicals, diagnostic referrals & chronic care management.',
    },
  },
  gastroenterology: {
    id: 'gastroenterology',
    name: {
      uz: 'Gastroenterologiya',
      ru: 'Гастроэнтерология',
      en: 'Gastroenterology',
    },
    description: {
      uz: 'Oshqozon-ichak trakti, jigar, o‘t qopi va oshqozon osti bezi kasalliklarini tashxislash va davolash.',
      ru: 'Диагностика и лечение желудочно-кишечного тракта, печени и желчного пузыря.',
      en: 'Diagnosis and therapy for digestive tract, liver, pancreas, and gastrointestinal disorders.',
    },
  },
  endocrinology: {
    id: 'endocrinology',
    name: {
      uz: 'Endokrinologiya',
      ru: 'Эндокринология',
      en: 'Endocrinology',
    },
    description: {
      uz: 'Qalqonsimon bez, qandli diabet, gormonlar balansi va moddalar almashinuvi kasalliklarini davolash.',
      ru: 'Лечение заболеваний щитовидной железы, сахарного диабета и гормональных нарушений.',
      en: 'Comprehensive management for thyroid, diabetes, hormonal balance, and metabolic health.',
    },
  },
};

/**
 * Normalizes specialty key from ID, title, or name across languages (Uzbek, Russian, English)
 */
export function normalizeSpecialtyKey(keyOrName: string): string {
  if (!keyOrName) return '';
  const k = keyOrName.toLowerCase().trim();
  if (k === 'all') return 'all';
  if (k.includes('cardio') || k.includes('yurak') || k.includes('кардио') || k.includes('сердц')) return 'cardiology';
  if (k.includes('dent') || k.includes('stomatolog') || k.includes('tish') || k.includes('зуб') || k.includes('стоматолог')) return 'dentistry';
  if (k.includes('pediatr') || k.includes('bola') || k.includes('педиатр') || k.includes('детск')) return 'pediatrics';
  if (k.includes('derma') || k.includes('teri') || k.includes('дерматолог') || k.includes('кож')) return 'dermatology';
  if (k.includes('neuro') || k.includes('nevro') || k.includes('asab') || k.includes('невролог') || k.includes('нерв')) return 'neurology';
  if (k.includes('ophthalm') || k.includes('oftalm') || k.includes('ko\'z') || k.includes('koz') || k.includes('glaz') || k.includes('офтальмолог') || k.includes('глаз') || k.includes('окулист') || k.includes('eye')) return 'ophthalmology';
  if (k.includes('ortho') || k.includes('ortoped') || k.includes('travmat') || k.includes('ортопед') || k.includes('травматолог') || k.includes('suyak')) return 'orthopedics';
  if (k.includes('gyneco') || k.includes('ginekolog') || k.includes('ayol') || k.includes('гинеколог') || k.includes('женск') || k.includes('ob/gyn')) return 'gynecology';
  if (k.includes('ent') || k.includes('lor') || k.includes('otolaryng') || k.includes('quloq') || k.includes('tomoq') || k.includes('лор') || k.includes('отоларинголог') || k.includes('ухо') || k.includes('горло') || k.includes('нос')) return 'ent';
  if (
    k.includes('general') ||
    k.includes('practice') ||
    k.includes('practitioner') ||
    k.includes('terap') ||
    k.includes('терап') ||
    k.includes('umumiy') ||
    k.includes('medicine') ||
    k.includes('meditsina') ||
    k.includes('family') ||
    k.includes('семейн') ||
    k.includes('oila') ||
    k.includes('vrach') ||
    k.includes('врач') ||
    k.includes('shifokor') ||
    k.includes('gp')
  ) {
    return 'general-medicine';
  }
  if (k.includes('gastro') || k.includes('oshqozon') || k.includes('гастроэнтеролог') || k.includes('желудок')) return 'gastroenterology';
  if (k.includes('endo') || k.includes('diabet') || k.includes('qalqonsimon') || k.includes('эндокринолог') || k.includes('диабет')) return 'endocrinology';
  return k;
}

/**
 * Checks whether two specialty representations match (handling IDs, full names, and aliases)
 */
export function isMatchingSpecialty(specialtyA?: string, specialtyB?: string): boolean {
  if (!specialtyA || !specialtyB) return false;
  if (specialtyA === 'all' || specialtyB === 'all') return true;

  const keyA = normalizeSpecialtyKey(specialtyA);
  const keyB = normalizeSpecialtyKey(specialtyB);

  if (keyA && keyB && keyA === keyB) return true;

  const lowerA = specialtyA.toLowerCase().trim();
  const lowerB = specialtyB.toLowerCase().trim();
  if (lowerA === lowerB) return true;

  return lowerA.includes(lowerB) || lowerB.includes(lowerA);
}

/**
 * Get localized Specialty Name
 */
export function getSpecialtyName(specialtyIdOrName: string, lang: Language): string {
  const key = normalizeSpecialtyKey(specialtyIdOrName);
  const found = SPECIALTY_TRANSLATIONS[key];
  if (found) {
    return found.name[lang] || found.name.en;
  }
  return specialtyIdOrName;
}

/**
 * Get localized Specialty Description
 */
export function getSpecialtyDescription(specialtyIdOrName: string, lang: Language): string {
  const key = normalizeSpecialtyKey(specialtyIdOrName);
  const found = SPECIALTY_TRANSLATIONS[key];
  if (found) {
    return found.description[lang] || found.description.en;
  }
  return '';
}

/**
 * Doctor Role/Specialty translations (e.g. Cardiologist -> Kardiolog)
 */
export const DOCTOR_SPECIALTY_LABELS: Record<string, { uz: string; ru: string; en: string }> = {
  Cardiologist: { uz: 'Kardiolog', ru: 'Кардиолог', en: 'Cardiologist' },
  Dentist: { uz: 'Stomatolog', ru: 'Стоматолог', en: 'Dentist' },
  'Dental Specialist': { uz: 'Stomatolog-ortoped', ru: 'Врач-стоматолог', en: 'Dental Specialist' },
  Pediatrician: { uz: 'Pediatr', ru: 'Педиатр', en: 'Pediatrician' },
  Dermatologist: { uz: 'Dermatolog', ru: 'Дерматолог', en: 'Dermatologist' },
  Neurologist: { uz: 'Nevrolog', ru: 'Невролог', en: 'Neurologist' },
  Ophthalmologist: { uz: 'Oftalmolog', ru: 'Офтальмолог', en: 'Ophthalmologist' },
  'Orthopedic Surgeon': { uz: 'Ortoped-travmatolog', ru: 'Ортопед-травматолог', en: 'Orthopedic Surgeon' },
  Orthopedist: { uz: 'Ortoped', ru: 'Ортопед', en: 'Orthopedist' },
  Gynecologist: { uz: 'Ginekolog', ru: 'Гинеколог', en: 'Gynecologist' },
  'ENT Specialist': { uz: 'LOR shifokori', ru: 'ЛОР-врач', en: 'ENT Specialist' },
  Otolaryngologist: { uz: 'Otorinolaringolog (LOR)', ru: 'Отоларинголог', en: 'Otolaryngologist' },
  'General Practitioner': { uz: 'Umumiy amaliyot shifokori (Terapevt)', ru: 'Врач общей практики (Терапевт)', en: 'General Practitioner' },
  Therapist: { uz: 'Terapevt', ru: 'Терапевт', en: 'Therapist' },
  Gastroenterologist: { uz: 'Gastroenterolog', ru: 'Гастроэнтеролог', en: 'Gastroenterologist' },
  Endocrinologist: { uz: 'Endokrinolog', ru: 'Эндокринолог', en: 'Endocrinologist' },
  Surgeon: { uz: 'Jarroh', ru: 'Хирург', en: 'Surgeon' },
  Allergist: { uz: 'Allergolog', ru: 'Аллерголог', en: 'Allergist' },
  Urologist: { uz: 'Urolog', ru: 'Уролог', en: 'Urologist' },
};

export function getDoctorSpecialtyLabel(title: string, lang: Language): string {
  if (!title) return '';
  // Check direct lookup
  if (DOCTOR_SPECIALTY_LABELS[title]) {
    return DOCTOR_SPECIALTY_LABELS[title][lang] || DOCTOR_SPECIALTY_LABELS[title].en;
  }
  // Check case-insensitive match
  for (const [key, mapping] of Object.entries(DOCTOR_SPECIALTY_LABELS)) {
    if (key.toLowerCase() === title.toLowerCase()) {
      return mapping[lang] || mapping.en;
    }
  }
  // Fall back to specialty name translation
  return getSpecialtyName(title, lang);
}

/**
 * Focus Areas for AI Health Tip with multilingual display
 */
export interface FocusAreaOption {
  id: string;
  labels: {
    uz: string;
    ru: string;
    en: string;
  };
}

export const FOCUS_AREA_OPTIONS: FocusAreaOption[] = [
  {
    id: 'Cardiology & Blood Pressure',
    labels: {
      uz: 'Kardiologiya va qon bosimi',
      ru: 'Кардиология и давление',
      en: 'Cardiology & Blood Pressure',
    },
  },
  {
    id: 'Sleep & Stress Management',
    labels: {
      uz: 'Sokin uyqu va stress nazorati',
      ru: 'Сон и снятие стресса',
      en: 'Sleep & Stress Management',
    },
  },
  {
    id: 'Healthy Nutrition & Hydration',
    labels: {
      uz: 'Sog‘lom ovqatlanish va suv balansi',
      ru: 'Здоровое питание и гидратация',
      en: 'Healthy Nutrition & Hydration',
    },
  },
  {
    id: 'Preventive Health Screenings',
    labels: {
      uz: 'Profilaktik tibbiy ko‘riklar',
      ru: 'Профилактические чекапы',
      en: 'Preventive Health Screenings',
    },
  },
  {
    id: 'Dental & Oral Care',
    labels: {
      uz: 'Stomatologiya va og‘iz gigiyenasi',
      ru: 'Уход за зубами и полостью рта',
      en: 'Dental & Oral Care',
    },
  },
  {
    id: 'Skin & Dermatological Health',
    labels: {
      uz: 'Teri va dermatologik salomatlik',
      ru: 'Здоровье кожи и дерматология',
      en: 'Skin & Dermatological Health',
    },
  },
  {
    id: 'Active Fitness & Spine Posture',
    labels: {
      uz: 'Jismoniy faollik va qomat salomatligi',
      ru: 'Фитнес и здоровье позвоночника',
      en: 'Active Fitness & Spine Posture',
    },
  },
  {
    id: 'Pediatrics & Family Wellness',
    labels: {
      uz: 'Pediatriya va oilaviy salomatlik',
      ru: 'Педиатрия и здоровье семьи',
      en: 'Pediatrics & Family Wellness',
    },
  },
  {
    id: 'Eye Care & Vision Protection',
    labels: {
      uz: 'Ko‘rish qobiliyatini asrash va oftalmologiya',
      ru: 'Забота о зрении и офтальмология',
      en: 'Eye Care & Vision Protection',
    },
  },
];

export function getFocusAreaLabel(area: string, lang: Language): string {
  const found = FOCUS_AREA_OPTIONS.find(
    (item) =>
      item.id.toLowerCase() === area.toLowerCase() ||
      item.labels.uz.toLowerCase() === area.toLowerCase() ||
      item.labels.ru.toLowerCase() === area.toLowerCase() ||
      item.labels.en.toLowerCase() === area.toLowerCase()
  );
  if (found) {
    return found.labels[lang] || found.labels.en;
  }
  return area;
}

export function getActivityLevelLabel(level: string, lang: Language): string {
  const l = level.toLowerCase();
  if (l.includes('sedentary') || l.includes('kam')) {
    if (lang === 'uz') return 'Kam harakat';
    if (lang === 'ru') return 'Малоподвижный';
    return 'Sedentary';
  }
  if (l.includes('active') || l.includes('yuqori') || l.includes('высок')) {
    if (lang === 'uz') return 'Yuqori faol';
    if (lang === 'ru') return 'Высокая активность';
    return 'Active';
  }
  // Default moderate
  if (lang === 'uz') return 'O‘rtacha faol';
  if (lang === 'ru') return 'Умеренный';
  return 'Moderate';
}
