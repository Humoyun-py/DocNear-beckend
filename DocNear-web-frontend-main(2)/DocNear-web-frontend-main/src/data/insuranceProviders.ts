export interface InsuranceProviderOption {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  logoColor: string;
  badgeBg: string;
}

export const INSURANCE_PROVIDERS: InsuranceProviderOption[] = [
  {
    id: 'all',
    name: 'All Insurances / Self-pay',
    shortName: 'All',
    tagline: 'Standard pricing & universal insurance coverage',
    logoColor: 'text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'APEX Insurance',
    name: 'APEX Insurance',
    shortName: 'APEX',
    tagline: 'Comprehensive voluntary health insurance (VHI)',
    logoColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'Gross Insurance',
    name: 'Gross Insurance',
    shortName: 'Gross',
    tagline: 'Direct billing & priority inpatient coverage',
    logoColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: "Kafolat Sug'urta",
    name: "Kafolat Sug'urta",
    shortName: 'Kafolat',
    tagline: 'National accredited medical insurance program',
    logoColor: 'text-amber-600',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'Uzbekinvest',
    name: 'Uzbekinvest',
    shortName: 'Uzbekinvest',
    tagline: 'Leading state export-import & health coverage',
    logoColor: 'text-cyan-600',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    id: 'Euroasia Insurance',
    name: 'Euroasia Insurance',
    shortName: 'Euroasia',
    tagline: 'International & local clinical network partnership',
    logoColor: 'text-purple-600',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: "Alfa Life Sug'urta",
    name: "Alfa Life Sug'urta",
    shortName: 'Alfa Life',
    tagline: 'Specialized family & individual health policies',
    logoColor: 'text-rose-600',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'Ingo-Uzbekistan',
    name: 'Ingo-Uzbekistan',
    shortName: 'Ingo',
    tagline: 'Corporate corporate health plans with zero deductibles',
    logoColor: 'text-teal-600',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
  },
];
