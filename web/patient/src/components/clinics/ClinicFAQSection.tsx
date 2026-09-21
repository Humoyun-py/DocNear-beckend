import React, { useState, useMemo } from 'react';
import { Clinic } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Car,
  Stethoscope,
  CreditCard,
  Search,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Info,
} from 'lucide-react';

interface ClinicFAQSectionProps {
  clinic: Clinic;
}

interface FAQItem {
  id: string;
  category: 'services' | 'insurance' | 'parking' | 'booking';
  question: {
    uz: string;
    ru: string;
    en: string;
  };
  answer: {
    uz: string;
    ru: string;
    en: string;
  };
}

export const ClinicFAQSection: React.FC<ClinicFAQSectionProps> = ({ clinic }) => {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openItemIds, setOpenItemIds] = useState<Set<string>>(new Set(['faq_1', 'faq_3']));
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'yes' | 'no'>>({});

  const faqData: FAQItem[] = useMemo(
    () => [
      {
        id: 'faq_1',
        category: 'services',
        question: {
          uz: `${clinic.name} klinikasida qanday diagnostika va tahlil xizmatlari mavjud?`,
          ru: `Какие диагностические услуги и анализы доступны в клинике ${clinic.name}?`,
          en: `What diagnostic services and laboratory tests are available at ${clinic.name}?`,
        },
        answer: {
          uz: `${clinic.name} zamonaviy laboratoriya, UZI (Ultratovush tekshiruvi), EKG, raqamli rentgen va ixtisoslashtirilgan mutaxassislar konsultatsiyasini taqdim etadi. Barcha tahlil natijalari 2–24 soat ichida elektron shaklda taqdim etiladi.`,
          ru: `Клиника ${clinic.name} предоставляет широкий спектр услуг: УЗИ, ЭКГ, лабораторные анализы крови и мочи, цифровой рентген и консультации профильных специалистов. Результаты выдаются в течение 2–24 часов.`,
          en: `${clinic.name} offers comprehensive diagnostics including Ultrasound, ECG, digital X-rays, blood/urine lab panels, and consultations across multiple medical specialties. Test results are provided electronically within 2–24 hours.`,
        },
      },
      {
        id: 'faq_2',
        category: 'services',
        question: {
          uz: 'Qabulga kelishdan oldin yo‘llanma (referral) kerakmi?',
          ru: 'Нужно ли направление от терапевта для первичного приема?',
          en: 'Is a doctor referral required before booking a specialist appointment?',
        },
        answer: {
          uz: 'Yo‘q, shifokor yo‘llanmasi talab etilmaydi. Siz DocNear orqali to‘g‘ridan-to‘g‘ri istalgan tor soha mutaxassisi (kardiolog, nevropatolog, stomatolog, pediatr va boshqalar) qabuliga onlayn yozilishingiz mumkin.',
          ru: 'Нет, направление не требуется. Вы можете напрямую записаться к любому узкому специалисту (кардиологу, неврологу, педиатру и др.) через сервис DocNear.',
          en: 'No referral is needed. You can book an appointment directly with any specialist (cardiologist, neurologist, pediatrician, dentist, etc.) online through DocNear.',
        },
      },
      {
        id: 'faq_3',
        category: 'insurance',
        question: {
          uz: 'Klinika qaysi tibbiy sug‘urta kompaniyalari (Gross, Apex, Alfa Invest va b.) bilan ishlaydi?',
          ru: 'С какими страховыми компаниями (Gross, Apex, Alfa Invest и др.) сотрудничает клиника?',
          en: 'Which health insurance providers (Gross, Apex, Alfa Invest, etc.) are accepted?',
        },
        answer: {
          uz: `${clinic.name} O‘zbekistonning yetakchi tibbiy sug‘urta tashkilotlari (Gross Insurance, Apex Insurance, Alfa Invest, Kafolat, Euroasia) bilan to‘g‘ridan-to‘g‘ri shartnomaga ega. Qabulga kelganda sug‘urta polisi va shaxsni tasdiqlovchi hujjatni ko‘rsatish yetarli.`,
          ru: `Клиника ${clinic.name} сотрудничает с ведущими страховыми компаниями Узбекистана (Gross, Apex Insurance, Alfa Invest, Kafolat и др.). Оплата может производиться по прямому безналичному расчету по вашему страховому полису.`,
          en: `${clinic.name} maintains official partner agreements with major health insurers (Gross Insurance, Apex, Alfa Invest, Kafolat, and more). Present your valid insurance policy card and ID at reception for direct cashless settlement.`,
        },
      },
      {
        id: 'faq_4',
        category: 'parking',
        question: {
          uz: 'Klinika hududida bepul avtoturargoh va aravachalar uchun panduslar bormi?',
          ru: 'Есть ли бесплатная парковка для пациентов и условия для маломобильных граждан?',
          en: 'Is there free visitor parking and wheelchair accessibility at the clinic?',
        },
        answer: {
          uz: `Ha, ${clinic.name} binosi oldida bemorlar uchun 30+ o‘rinli bepul qo‘riqlanadigan avtoturargoh mavjud. Shuningdek, barcha kirish eshiklarida nogironlar aravachalari uchun qulay panduslar va tibbiy liftlar o‘rnatilgan.`,
          ru: `Да, перед клиникой ${clinic.name} расположена бесплатная охраняемая парковка для пациентов на 30+ мест. Главный вход оборудован удобными пандусами, а внутри здания работают просторные пассажирские лифты.`,
          en: `Yes, ${clinic.name} features a dedicated free parking lot with 30+ visitor spaces. The clinic is fully accessible with ADA-compliant wheelchair ramps at entrances and wide elevators on all floors.`,
        },
      },
      {
        id: 'faq_5',
        category: 'booking',
        question: {
          uz: 'Qanday to‘lov usullari qabul qilinadi va narxlar belgilanganmi?',
          ru: 'Какие способы оплаты принимаются и фиксированы ли цены на прием?',
          en: 'What payment methods are accepted and are consultation fees fixed?',
        },
        answer: {
          uz: `To‘lovlarni Uzcard, Humo, Visa, Mastercard, Payme, Click yoki naqd pul orqali amalga oshirish mumkin. Shifokorlar konsultatsiya narxi DocNear platformasida ko‘rsatilganidek qat’iy belgilangan va yashirin qo‘shimcha to‘lovlar yo‘q.`,
          ru: `Принимаются карты Uzcard, Humo, Visa, Mastercard, платежные системы Payme, Click, а также наличные. Стоимость консультации строго соответствует указанной в DocNear без скрытых комиссий.`,
          en: `All standard payment methods are accepted: Uzcard, Humo, Visa, Mastercard, Payme, Click, and cash. Consultation fees shown on DocNear are fully transparent with zero hidden charges.`,
        },
      },
      {
        id: 'faq_6',
        category: 'booking',
        question: {
          uz: 'Qabul vaqtidan oldin bekor qilish yoki boshqa kunga ko‘chirish qoidalari qanday?',
          ru: 'Как отменить или перенести запись на прием к врачу?',
          en: 'What is the cancellation and rescheduling policy for appointments?',
        },
        answer: {
          uz: 'Siz o‘z qabulingizni "Mening qabullarim" bo‘limi orqali rejalashtirilgan vaqtdan kamida 2 soat oldin bepul bekor qilishingiz yoki boshqa bo‘sh vaqtga ko‘chirishingiz mumkin.',
          ru: 'Вы можете бесплатно перенести или отменить запись в разделе "Мои записи" минимум за 2 часа до назначенного времени.',
          en: 'You can cancel or reschedule your appointment free of charge in the "My Appointments" tab up to 2 hours prior to the scheduled consultation time.',
        },
      },
    ],
    [clinic.name]
  );

  const toggleItem = (id: string) => {
    setOpenItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setOpenItemIds(new Set(faqData.map((f) => f.id)));
  };

  const handleCollapseAll = () => {
    setOpenItemIds(new Set());
  };

  const handleFeedback = (faqId: string, type: 'yes' | 'no') => {
    setFeedbackGiven((prev) => ({ ...prev, [faqId]: type }));
  };

  const filteredFaqs = faqData.filter((item) => {
    const langKey = (language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'uz') as 'uz' | 'ru' | 'en';
    const qText = item.question[langKey].toLowerCase();
    const aText = item.answer[langKey].toLowerCase();
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      qText.includes(searchQuery.toLowerCase()) ||
      aText.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      id="clinic-faq-section"
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 transition-colors duration-200"
    >
      {/* Section Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HelpCircle size={22} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {t('clinicFAQ')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('clinicFAQSubtitle')}
            </p>
          </div>
        </div>

        {/* Expand / Collapse All Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            {t('expandAll')}
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            {t('collapseAll')}
          </button>
        </div>
      </div>

      {/* Category Pills and Search Bar */}
      <div className="space-y-3">
        {/* Search inside FAQ */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('faqSearchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: t('faqCategoryAll'), icon: Sparkles },
            { id: 'services', label: t('faqCategoryServices'), icon: Stethoscope },
            { id: 'insurance', label: t('faqCategoryInsurance'), icon: ShieldCheck },
            { id: 'parking', label: t('faqCategoryParking'), icon: Car },
            { id: 'booking', label: t('faqCategoryBooking'), icon: CreditCard },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            Savollar topilmadi. Qidiruv so‘zini o‘zgartirib ko‘ring.
          </div>
        ) : (
          filteredFaqs.map((item) => {
            const langKey = (language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'uz') as 'uz' | 'ru' | 'en';
            const isOpen = openItemIds.has(item.id);
            const feedback = feedbackGiven[item.id];

            return (
              <div
                key={item.id}
                className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-blue-300 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/30 shadow-2xs'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Accordion Header Button */}
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-extrabold ${
                        isOpen
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.category === 'insurance' ? (
                        <ShieldCheck size={14} />
                      ) : item.category === 'parking' ? (
                        <Car size={14} />
                      ) : item.category === 'services' ? (
                        <Stethoscope size={14} />
                      ) : (
                        <HelpCircle size={14} />
                      )}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                      {item.question[langKey]}
                    </span>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'rotate-180 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <ChevronDown size={16} />
                  </div>
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 space-y-3 border-t border-blue-100/60 dark:border-blue-900/40 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p className="pl-10 text-slate-700 dark:text-slate-200">
                      {item.answer[langKey]}
                    </p>

                    {/* Was this helpful feedback bar */}
                    <div className="pl-10 pt-2 flex items-center justify-between gap-3 text-xs border-t border-slate-100/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {t('wasThisHelpful')}
                      </span>

                      {feedback ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle size={12} />
                          <span>{t('thankYouForFeedback')}</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleFeedback(item.id, 'yes')}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <ThumbsUp size={11} />
                            <span>{t('yes')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(item.id, 'no')}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <ThumbsDown size={11} />
                            <span>{t('no')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
