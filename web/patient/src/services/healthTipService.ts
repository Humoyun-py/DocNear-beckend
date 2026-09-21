import { HealthPreferences } from '../types';

export interface DailyHealthTipResponse {
  headline: string;
  focusCategory: string;
  advice: string;
  dailyActionItems: string[];
  nutritionTip: string;
  vitalMetricToTrack: string;
  didYouKnowFact: string;
  motivationalQuote?: string;
  generatedAt: string;
  source: string;
}

export const healthTipService = {
  async getPersonalizedDailyTip(
    preferences?: HealthPreferences,
    userName: string = 'Aziza',
    language: string = 'en'
  ): Promise<DailyHealthTipResponse> {
    try {
      const res = await fetch('/api/gemini/daily-health-tip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionStorage.getItem('docnear_access_token') ? { Authorization: 'Bearer ' + sessionStorage.getItem('docnear_access_token') } : {}),
        },
        body: JSON.stringify({
          preferences: preferences || {
            focusAreas: [
              'Cardiology & Blood Pressure',
              'Sleep & Stress Management',
              'Healthy Nutrition & Hydration',
            ],
            activityLevel: 'Moderate',
            dietaryPreference: 'Balanced Mediterranean',
          },
          userName,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('Could not fetch from server API, using fallback:', err);
      return getLocalFallback(language);
    }
  },
};

function getLocalFallback(language: string): DailyHealthTipResponse {
  if (language === 'uz') {
    return {
      headline: 'Yurak salomatligi va optimal gidratatsiya balansi',
      focusCategory: 'Kardiologiya & Sog‘lom turmush tarzi',
      advice:
        'Bugun tanangizning suv muvozanatiga va qon aylanishiga alohida e’tibor qarating. Yetarli miqdorda toza suv ichish qon quyuqlashishining oldini oladi va yurak mushaklariga tushadigan yuklamani kamaytiradi. Kun davomida 25-30 daqiqalik yengil piyoda yurish qon bosimini tabiiy ravishda me’yorlashtiradi.',
      dailyActionItems: [
        'Ertalab och qoringa 1 stakan iliq suv iching',
        'Har 45 daqiqalik o‘tirib ishlashdan so‘ng 3 daqiqa yengil cho‘zilish mashqini bajaring',
        'Kechki soat 22:30 dan kechikmay ekranlardan uzoqlashib, dam oling',
      ],
      nutritionTip:
        'Kaliy va magniyga boy mahsulotlarni tanlang: bir hovuch yong‘oq yoki mayiz yurak qon-tomir tizimini quvvatlaydi.',
      vitalMetricToTrack: 'Kunlik 2.2 litr toza suv va 7,500 qadam',
      didYouKnowFact:
        'Muntazam 30 daqiqa piyoda yurish yurak-qon tomir kasalliklari xavfini 35% ga kamaytiradi.',
      motivationalQuote: 'Sog‘liq — har kungi kichik, ammo qat’iy odatlarning natijasidir.',
      generatedAt: new Date().toISOString(),
      source: 'offline-curated',
    };
  }

  if (language === 'ru') {
    return {
      headline: 'Баланс гидратации и поддержка сердечно-сосудистой системы',
      focusCategory: 'Кардиология и Здоровое питание',
      advice:
        'Сегодня обратите особое внимание на водный баланс и мягкую физическую активность. Регулярное питье чистой воды комнатной температуры снижает вязкость крови и разгружает сердечную мышцу. Короткая 20–30 минутная прогулка на свежем воздухе улучшает снабжение тканей кислородом.',
      dailyActionItems: [
        'Начните утро со стакана теплой воды для мягкой активации метаболизма',
        'Делайте 3-минутную разминку для шеи и спины каждые 50 минут работы за столом',
        'Исключите экраны гаджетов за 45 минут до сна для глубокого отдыха',
      ],
      nutritionTip:
        'Добавьте в рацион продукты, богатые калием и омега-3: грецкие орехи, шпинат или запеченную рыбу.',
      vitalMetricToTrack: '2.2 литра чистой воды и не менее 7 500 шагов за день',
      didYouKnowFact:
        'Регулярная аэробная нагрузка умеренной интенсивности снижает уровень гормона стресса кортизола более чем на 25%.',
      motivationalQuote: 'Забота о себе сегодня — это ваша энергия и ясность ума завтра.',
      generatedAt: new Date().toISOString(),
      source: 'offline-curated',
    };
  }

  return {
    headline: 'Optimal Hydration & Cardiovascular Vitality',
    focusCategory: 'Cardiology & Daily Wellness',
    advice:
      'Focus on steady hydration and active recovery today. Adequate fluid intake optimizes blood viscosity and eases cardiovascular workload throughout your daily schedule. Incorporating a brisk 25-minute afternoon walk helps stabilize blood pressure and boosts energy levels.',
    dailyActionItems: [
      'Begin the morning with 300ml of room-temperature water before caffeine',
      'Take a 3-minute posture break and stretch your spine every 45 minutes of desk work',
      'Wind down screens 45 minutes prior to sleep to optimize melatonin release',
    ],
    nutritionTip:
      'Incorporate potassium and antioxidant-rich foods: a handful of raw almonds or fresh berries strengthens vascular elasticity.',
    vitalMetricToTrack: '2.2L water intake and 7,500 daily active steps',
    didYouKnowFact:
      'Clinical studies show that 30 minutes of consistent daily brisk walking reduces cardiovascular risk factors by up to 35%.',
    motivationalQuote: 'Small, consistent daily habits create lifelong vibrant health.',
    generatedAt: new Date().toISOString(),
    source: 'offline-curated',
  };
}
