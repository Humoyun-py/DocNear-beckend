import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '1mb' }));

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Gemini Daily Health Tip Generator
app.post('/api/gemini/daily-health-tip', async (req, res) => {
  try {
    const {
      preferences = {},
      userName = 'Aziza',
      language = 'en',
    } = req.body;

    const focusAreas = preferences.focusAreas && preferences.focusAreas.length > 0
      ? preferences.focusAreas.join(', ')
      : 'Cardiology, Hydration, Sleep & Stress Management, Healthy Nutrition';

    const activityLevel = preferences.activityLevel || 'Moderate';
    const dietaryPreference = preferences.dietaryPreference || 'Balanced Mediterranean';
    const notes = preferences.notes || 'Prioritizing cardiovascular endurance, good sleep, and hydration.';

    const client = getGeminiClient();

    if (!client) {
      // Fallback curated advice if API key is not yet configured
      return res.json(getCuratedFallbackTip(language, focusAreas));
    }

    const languageInstruction =
      language === 'uz'
        ? "Respond in natural, professional, warm Uzbek (O'zbek tili, Lotin yozuvida)."
        : language === 'ru'
        ? 'Respond in clear, encouraging, professional Russian (Русский язык).'
        : 'Respond in encouraging, polished, professional English.';

    const systemPrompt = `You are an elite, empathetic, and evidence-based preventive medicine specialist and wellness coach for DocNear.
Your job is to generate a personalized daily health & wellness tip for a patient based on their stored health preferences.

Language requirement: ${languageInstruction}

Patient profile:
- Name: ${userName}
- Health Focus Areas: ${focusAreas}
- Activity Level: ${activityLevel}
- Dietary Preference: ${dietaryPreference}
- Health Notes / Goals: ${notes}

Ensure the output is clinically sound, practical, positive, and directly tailored to their selected focus areas. Avoid generic filler.`;

    const modelsToTry = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;
    let parsedData: any = null;
    let usedModel: string = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: 'Generate a personalized, motivating daily health tip and micro-action plan for today.',
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: {
                  type: Type.STRING,
                  description: 'Catchy, uplifting, high-impact headline for the day',
                },
                focusCategory: {
                  type: Type.STRING,
                  description: 'The primary category from user preferences addressed today',
                },
                advice: {
                  type: Type.STRING,
                  description: '2 to 3 concise, insightful paragraphs of actionable personalized health guidance',
                },
                dailyActionItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Exactly 3 concrete, realistic micro-habits the user can complete today',
                },
                nutritionTip: {
                  type: Type.STRING,
                  description: 'A specific food, snack, or hydration recommendation tailored to their preferences',
                },
                vitalMetricToTrack: {
                  type: Type.STRING,
                  description: 'One key metric to pay attention to today (e.g. 2.5L water, 30 min brisk walk, 7.5h sleep)',
                },
                didYouKnowFact: {
                  type: Type.STRING,
                  description: 'An intriguing, evidence-based clinical fact related to this health area',
                },
                motivationalQuote: {
                  type: Type.STRING,
                  description: 'A short, inspiring wellness reminder or mantra',
                },
              },
              required: [
                'headline',
                'focusCategory',
                'advice',
                'dailyActionItems',
                'nutritionTip',
                'vitalMetricToTrack',
                'didYouKnowFact',
              ],
            },
          },
        });

        const text = response.text;
        if (text) {
          parsedData = JSON.parse(text);
          usedModel = modelName;
          break; // Successfully generated!
        }
      } catch (err: any) {
        lastError = err;
        // Continue quietly to next model or fallback
      }
    }

    if (parsedData) {
      return res.json({
        ...parsedData,
        generatedAt: new Date().toISOString(),
        source: usedModel,
      });
    }

    // If all AI models were busy or unavailable, return tailored specialist advice
    return res.json(getCuratedFallbackTip(language, focusAreas, activityLevel, dietaryPreference));
  } catch (error: any) {
    console.warn('Gemini health tip generation fallback triggered:', error?.message || error);
    const lang = req.body?.language || 'en';
    const focus = req.body?.preferences?.focusAreas?.join(', ') || 'General Wellness';
    const act = req.body?.preferences?.activityLevel || 'Moderate';
    const diet = req.body?.preferences?.dietaryPreference || 'Balanced Mediterranean';
    return res.json(getCuratedFallbackTip(lang, focus, act, diet));
  }
});

// 3. Gemini AI Universal Medical & Health Assistant
app.post('/api/gemini/medical-chat', async (req, res) => {
  try {
    const {
      message = '',
      history = [],
      language = 'uz',
    } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const client = getGeminiClient();

    const languageInstruction =
      language === 'uz'
        ? "Respond in clear, empathetic, fluent and professional Uzbek (O'zbek tili, Lotin yozuvida)."
        : language === 'ru'
        ? 'Respond in empathetic, clear and professional Russian (Русский язык).'
        : 'Respond in empathetic, clear, structured and professional English.';

    const systemPrompt = `You are DocNear AI, an all-around, highly knowledgeable, empathetic AI Doctor, Medical Consultant and Healthcare Assistant.
You can answer ANY question the user asks, including but not limited to:
1. Symptoms, diseases, causes, home care, recovery, and preventive health.
2. Medications, active ingredients, indications, general dosage guidance, contraindications, drug interactions, vitamins, minerals, and supplements.
3. Diagnostic tests and medical procedures (e.g. MRI, CT scan, Endoscopy, Gastroscopy, Ultrasound, Blood tests, Hormone panels, ECG, X-Ray) — what they are, how they are done, and detailed preparation instructions.
4. Triaging and doctor specialty recommendations (e.g. Cardiology, Neurology, Gastroenterology, Dermatology, Pediatrics, Orthopedics, ENT, Ophthalmology, Endocrinology, Gynecology, Urology, Dentistry, Psychiatry, General Practice).
5. Nutrition, healthy diet, hydration, physical therapy, ergonomics, exercise, fitness, and weight management.
6. Pediatric health, infant care, vaccinations, fever reduction methods in children.
7. Mental health, anxiety reduction, stress relief techniques, insomnia and healthy sleep hygiene.
8. First aid protocols (burns, cuts, sprains, choking, fainting, poisoning).
9. General conversational or health-related inquiries, medical definitions, and health systems in Uzbekistan.

Guidelines:
- Answer directly, thoroughly, and helpfully with clear structure (use bullet points, bold key terms, and section titles).
- For severe life-threatening emergencies (e.g. acute crushing chest pain radiating to jaw/arm, sudden paralysis, severe respiratory distress, uncontrollable hemorrhage), flag "isEmergencyWarning": true and urge calling 103 (Ambulance in Uzbekistan).
- If the question is non-medical, answer politely and intelligently while providing any relevant wellness insight.

Language requirement: ${languageInstruction}

Format your response strictly as JSON with the following structure:
{
  "reply": "Comprehensive, structured explanation in markdown format (use bullet points and bold highlights for readability).",
  "recommendedSpecialties": ["Array of English specialty names from standard list if relevant, e.g., 'Cardiology', 'Neurology', 'Gastroenterology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'ENT', 'Ophthalmology', 'Endocrinology', 'Gynecology', 'Urology', 'Dentistry', 'General Practice' (or empty array if general query)"],
  "suggestedQuestions": ["2 or 3 relevant follow-up questions the patient can ask next"],
  "isEmergencyWarning": boolean (true if symptoms indicate potential acute emergency)
}`;

    if (!client) {
      return res.json(getCuratedChatFallback(message, language));
    }

    const formattedHistory = Array.isArray(history)
      ? history.slice(-6).map((h: any) => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: String(h.content || '') }],
        }))
      : [];

    const modelsToTry = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let parsedData: any = null;
    let usedModel = '';

    for (const modelName of modelsToTry) {
      try {
        const contents = [
          ...formattedHistory,
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ];

        const response = await client.models.generateContent({
          model: modelName,
          contents: contents as any,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: 'Detailed, helpful, formatted guidance for the user in the requested language',
                },
                recommendedSpecialties: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Array of medical specialties suitable for this query',
                },
                suggestedQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2-3 helpful follow-up questions',
                },
                isEmergencyWarning: {
                  type: Type.BOOLEAN,
                  description: 'True if acute emergency warning is warranted',
                },
              },
              required: ['reply', 'recommendedSpecialties', 'suggestedQuestions', 'isEmergencyWarning'],
            },
          },
        });

        const text = response.text;
        if (text) {
          parsedData = JSON.parse(text);
          usedModel = modelName;
          break;
        }
      } catch (err: any) {
        // Try next model or fallback
      }
    }

    if (parsedData) {
      return res.json({
        ...parsedData,
        source: usedModel,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json(getCuratedChatFallback(message, language));
  } catch (error: any) {
    console.warn('Gemini chat assistant fallback triggered:', error?.message || error);
    const lang = req.body?.language || 'uz';
    const msg = req.body?.message || '';
    return res.json(getCuratedChatFallback(msg, lang));
  }
});

// Curated comprehensive medical procedure, pharmacological, symptom and health guidance fallback
function getCuratedChatFallback(query: string, language: string) {
  const q = query.toLowerCase();

  const isEmergency =
    q.includes('yurak to‘xta') ||
    q.includes('nafas qis') ||
    q.includes('hushdan ket') ||
    q.includes('qon ketish') ||
    q.includes('infarkt') ||
    q.includes('insult') ||
    q.includes('инфаркт') ||
    q.includes('инсульт') ||
    q.includes('тяжело дышать') ||
    q.includes('severe chest pain') ||
    q.includes('unconscious') ||
    q.includes('zaharlan') ||
    q.includes('отравлен');

  // 1. Vitamins, Supplements & Nutrition
  if (q.includes('vitamin') || q.includes('витамин') || q.includes('d3') || q.includes('sink') || q.includes('magniy') || q.includes('kalsiy') || q.includes('omega') || q.includes('dori') || q.includes('preparat') || q.includes('лекарств')) {
    if (language === 'uz') {
      return {
        reply: `### Vitaminlar va Dori vositalari bo'yicha maslahat\n\n**Asosiy tavsiyalar:**\n* **Vitamin D3:** Kunlik quyosh nuri kam bo'lgan fasllarda suyaklar va immunitet uchun muhim. Qonda 25-OH Vitamin D darajasini tekshirib qabul qilish tavsiya etiladi.\n* **Magniy (B6 bilan):** Asab tizimini tinchlantirish, uyqu sifatini yaxshilash va mushaklar tortishishini oldini olish uchun foydali.\n* **Sink va Vitamin C:** Mavsumiy shamollash vaqtida immunitetni qo'llab-quvvatlaydi.\n* **Omega-3:** Yurak-qon tomir faoliyati va miya ishlashi uchun muhim yog' kislotasi.\n\n**Muhim:** Har qanday dori yoki biologik faol qo'shimchalarni shifokor ko'rigi va tahlillar natijasiga asosan qabul qilish eng xavfsiz yo'ldir.`,
        recommendedSpecialties: ['General Practice', 'Endocrinology'],
        suggestedQuestions: [
          "Vitamin D tanqisligini qanday aniqlash mumkin?",
          "Qon tahlili topshirish qoidalari",
          "Terapevt shifokor qabuliga yozilish"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    } else if (language === 'ru') {
      return {
        reply: `### Рекомендации по витаминам и лекарственным средствам\n\n**Основные сведения:**\n* **Витамин D3:** Поддерживает иммунитет и здоровье костей. Рекомендуется сдать анализ на 25(OH)D перед началом курсового приема.\n* **Магний B6:** Снижает уровень стресса, нормализует сон и мышечный тонус.\n* **Омега-3:** Улучшает эластичность сосудов и работу сердечно-сосудистой системы.\n* **Цинк и Витамин C:** Стимулируют защитные силы организма в период простуд.\n\n**Важно:** Прием любых медикаментов и высоких доз витаминов должен согласовываться с лечащим врачом.`,
        recommendedSpecialties: ['General Practice', 'Endocrinology'],
        suggestedQuestions: [
          "Как сдать анализ на уровень витаминов?",
          "Запись на прием к терапевту",
          "Какие витамины пить весной и осенью?"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    }
  }

  // 2. Cough, Flu, Cold, Fever (Shamollash, Isitma, Gripp, Yo'tal)
  if (q.includes('isitma') || q.includes('harorat') || q.includes('yo‘tal') || q.includes('yutal') || q.includes('gripp') || q.includes('shamollash') || q.includes('tomoq') || q.includes('кашель') || q.includes('температур') || q.includes('грипп') || q.includes('горло') || q.includes('простуд') || q.includes('fever') || q.includes('cough')) {
    if (language === 'uz') {
      return {
        reply: `### Shamollash, Tomoq og'rig'i va Isitma holatida yordam\n\n**Birlamchi choralar:**\n* **Mo'l suyuqlik ichish:** Iliq limonli choy, na'matak qaynatmasi yoki iliq mineral suv (kuniga 2-2.5 litr).\n* **Haroratni tushirish:** Tana harorati 38.5°C dan oshganda Paratsetamol yoki Ibuprofen qabul qilish mumkin (har 6 soatdan kam bo'lmagan oraliqda).\n* **Tomoqni chayish:** Iliq tuzli suv (1 stakan suvga 0.5 choy qoshiq tuz) yoki romashka damlamasi bilan kuniga 3-4 marta.\n* **Dam olish:** To'liq jismoniy orom va xonani muntazam shamollatish.\n\n**Qachon shifokorga borish kerak?**\nAgar isitma 3 kundan ortiq tushmasa, hansirash paydo bo'lsa yoki tomoqda yiringli oq nuqtalar ko'rinsa, zudlik bilan LOR yoki Terapevtga murojaat qiling.`,
        recommendedSpecialties: ['ENT', 'General Practice', 'Pediatrics'],
        suggestedQuestions: [
          "Yaqin atrofdagi LOR shifokorlari",
          "Isitma tushiruvchi xavfsiz vositalar",
          "Umumiy qon tahlili topshirish"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    }
  }

  // 3. Teeth / Dental (Tish og'rig'i, milk, stomatolog)
  if (q.includes('tish') || q.includes('milk') || q.includes('stomatolog') || q.includes('plomba') || q.includes('зуб') || q.includes('стоматолог') || q.includes('десна') || q.includes('dentist') || q.includes('tooth')) {
    if (language === 'uz') {
      return {
        reply: `### Tish og'rig'i va Stomatologik maslahat\n\n**Og'riqni vaqtincha yengillashtirish:**\n* **Iliq chayish:** Iliq suvga 1 choy qoshiq iste'mol sodasi yoki tuz solib og'izni chayqash.\n* **Og'riqsizlantirish:** Shifokor ko'rigigacha Ibuprofen yoki Nimesil kabi nosteroid yallig'lanishga qarshi vosita qabul qilish mumkin.\n* **Issiq qo'ymaslik:** Og'riyotgan tish ustiga issiq narsa (grelka) qo'yish qat'iyan taqiqlanadi — bu yallig'lanishni kuchaytiradi.\n\n**Tavsiya etiladigan mutaxassis:**\nTish kariyesi, pulpit yoki milk shamollashida tezda **Stomatolog** qabuliga yozilish zarur.`,
        recommendedSpecialties: ['Dentistry'],
        suggestedQuestions: [
          "24/7 navbatchi stomatologiya klinikalari",
          "Tish kariesini davolash narxlari",
          "Stomatolog ko'rigiga yozilish"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    }
  }

  // 4. Back / Spine / Joints (Bel, Bo'g'im, Umurtqa, Grija)
  if (q.includes('bel') || q.includes('umurtqa') || q.includes('grija') || q.includes('bo‘g‘im') || q.includes('bogim') || q.includes('tizza') || q.includes('спин') || q.includes('позвоночник') || q.includes('грыжа') || q.includes('сустав') || q.includes('back pain') || q.includes('spine')) {
    if (language === 'uz') {
      return {
        reply: `### Bel og'rig'i, Umurtqa va Bo'g'imlar salomatligi\n\n**Muhim ma'lumotlar:**\n* **O'tkir bosqich:** Bel qattiq og'riganda og'ir yuk ko'tarmaslik, to'satdan egilmaslik va qattiq tekis yuzada dam olish tavsiya etiladi.\n* **Tashxis:** Disk churrasi (grija) yoki osteoxondrozni aniqlash uchun **Umurtqa pog'onasi MRTsi** eng aniq tekshiruv hisoblanadi.\n* **Davolash:** Nevrolog, Vertebrolog yoki Ortoped-Travmatolog nazoratida dori terapiyasi, fizioterapiya va davolash badantarbiyasi (LFK) o'tkaziladi.\n\nAgar og'riq oyoqqa uzatsa yoki oyoqda uvishish paydo bo'lsa, zudlik bilan Nevrologga murojaat qiling.`,
        recommendedSpecialties: ['Neurology', 'Orthopedics'],
        suggestedQuestions: [
          "Umurtqa pog'onasi MRT tekshiruviga yozilish",
          "Tajribali nevrolog va ortopedlar",
          "Bel grijasida bajariladigan mashqlar"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    }
  }

  // 5. Diet, Weight, Lifestyle & Digestion
  if (q.includes('parhez') || q.includes('ozish') || q.includes('semirish') || q.includes('ovqatlanish') || q.includes('vazn') || q.includes('suv') || q.includes('диета') || q.includes('похудеть') || q.includes('питание') || q.includes('вес') || q.includes('diet') || q.includes('weight')) {
    if (language === 'uz') {
      return {
        reply: `### Sog'lom ovqatlanish va To'g'ri turmush tarzi\n\n**Oltin qoidalar:**\n* **Gidratatsiya:** Tana vaznining har bir kilogrammiga 30 ml toza ichimlik suvi (kuniga o'rtacha 1.5 - 2.5 litr).\n* **Likopcha qoidasi:** Har bir asosiy taomning 50% qismini yangi sabzavot va ko'katlar, 25% qismini oqsil (baliq, tovuq, tuxum, dukkaklilar), 25% qismini murakkab uglevodlar (grechka, jigar rang guruch, qora non) tashkil qilishi maqsadga muvofiq.\n* **Shakar va Fastfud:** Qayta ishlangan shakar va trans-yog'larni maksimal darajada cheklash metabolizmni yaxshilaydi.\n* **Harakat:** Kuniga kamida 8,000 - 10,000 qadam piyoda yurish yurak va bo'g'imlar uchun eng yaxshi tabiiy mashqdir.`,
        recommendedSpecialties: ['Endocrinology', 'Gastroenterology', 'General Practice'],
        suggestedQuestions: [
          "Endokrinolog yoki Diyetolog maslahati",
          "Qalqonsimon bez gormonlari tahlili",
          "Moddalar almashinuvini tekshirish"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    }
  }

  // 6. MRI / MRT
  if (q.includes('mrt') || q.includes('мрт') || q.includes('mri')) {
    if (language === 'uz') {
      return {
        reply: `### MRT (Magnit-Rezonans Tomografiyasi) haqida ma'lumot\n\n**MRT nima?**\nMRT — bu kuchli magnit maydoni va radioto'lqinlar yordamida ichki a'zolar, miya, umurtqa va bo'g'imlarning juda aniq 3D tasvirini oluvchi xavfsiz va nurlanishsiz tekshiruv usulidir.\n\n**Tekshiruvga qanday tayyorgarlik ko'rish kerak?**\n* **Metall buyumlar:** Tekshiruv xonasiga kirishdan oldin soat, taqinchoqlar, kamar va telefon kabi barcha metall buyumlarni yechish shart.\n* **Kiyim:** Tugmasiz va metall zanjirlarsiz qulay paxta kiyim kiyish tavsiya etiladi.\n* **Kontrastli MRT:** Agar kontrast modda kiritilishi rejalashtirilgan bo'lsa, tekshiruvdan 4-6 soat oldin ovqatlanmaslik tavsiya etiladi.\n* **Klaustrofobiya:** Agar yopiq maydondan qo'rquvingiz bo'lsa, shifokorga oldindan ayting — ochiq turdagi MRT yoki tinchlantiruvchi tavsiya qilinishi mumkin.`,
        recommendedSpecialties: ['Neurology', 'Orthopedics', 'Cardiology'],
        suggestedQuestions: [
          "Qaysi klinikalarda MRT apparati bor?",
          "Kontrastli va oddiy MRT farqi nima?",
          "MRT tekshiruvi qancha vaqt davom etadi?"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    } else if (language === 'ru') {
      return {
        reply: `### Информация о процедуре МРТ (Магнитно-резонансная томография)\n\n**Что такое МРТ?**\nМРТ — это высокоточный и безопасный метод диагностики без лучевой нагрузки, позволяющий получить детальные послойные снимки мягких тканей, головного мозга, позвоночника и суставов.\n\n**Как подготовиться к исследованию?**\n* **Металлические предметы:** Перед процедурой необходимо снять все украшения, часы, ремни с металлическими пряжками и оставить телефон.\n* **Одежда:** Наденьте удобную одежду из натуральных тканей без металлических пуговиц и молний.\n* **МРТ с контрастом:** Если назначено контрастирование, воздержитесь от приема пищи за 4–6 часов до процедуры.\n* **Импланты:** Обязательно предупредите врача о наличии кардиостимулятора или металлических протезов.`,
        recommendedSpecialties: ['Neurology', 'Orthopedics', 'Cardiology'],
        suggestedQuestions: [
          "В каких клиниках рядом есть МРТ?",
          "Сколько времени длится сканирование МРТ?",
          "Чем МРТ отличается от КТ?"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    }
  }

  // 7. Gastroscopy / Endoscopy / Oshqozon
  if (q.includes('gastro') || q.includes('gastroskop') || q.includes('oshqozon') || q.includes('endoskop') || q.includes('гастроскопия') || q.includes('желудок') || q.includes('фгдс')) {
    if (language === 'uz') {
      return {
        reply: `### Gastroskopiya (EGDFS / Zond yutish) tekshiruvi\n\n**Jarayon haqida:**\nGastroskopiya — qizilo'ngach, oshqozon va o'n ikki barmoqli ichak shilliq qavatini kamera yordamida bevosita ko'rish va baholash imkonini beruvchi eng aniq tekshiruvdir.\n\n**Tayyorgarlik qoidalari:**\n* **Och qoringa:** Tekshiruv mutlaqo och qoringa (kamida 8-10 soat ovqat yemagan holda) o'tkaziladi.\n* **Suyuqlik:** Tekshiruvdan 3 soat oldin suv ichishni to'xtatish kerak.\n* **Kechki ovqat:** Tekshiruvdan oldingi kechqurun yengil taom iste'mol qiling (yog'li va go'shtli mahsulotlardan saqlaning).\n* **Sedatsiya (Uyquda):** Hozirgi kunda ko'plab klinikalarda 10 daqiqalik yengil tibbiy uyquda og'riqsiz o'tkaziladi.`,
        recommendedSpecialties: ['Gastroenterology', 'General Practice'],
        suggestedQuestions: [
          "Gastroskopiyani uyquda o'tkazadigan klinikalar",
          "Gastrit belgilarida qanday parhez qilish kerak?",
          "Gastroenterolog qabuliga yozilish"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    }
  }

  // 8. Cardiology / Yurak / Chest pain
  if (q.includes('yurak') || q.includes('ko‘krak') || q.includes('bosim') || q.includes('сердц') || q.includes('давлен') || q.includes('heart') || q.includes('cardio') || q.includes('tashxis') || q.includes('ekg') || q.includes('экг')) {
    const isUrgent = isEmergency || q.includes('og‘riq') || q.includes('боль');
    if (language === 'uz') {
      return {
        reply: `${isUrgent ? '**MUHIM:** Agar ko‘krak qafasida qisuvchi, chap qo‘lga yoki jag‘ga tarqaluvchi kuchli og‘riq va nafas qisishi bo‘lsa, zudlik bilan **103 (Tez yordam)** ga qo‘ng‘iroq qiling!\n\n' : ''}### Kardiologiya va Yurak tekshiruvlari\n\n**Tavsiya etiladigan diagnostika:**\n* **EKG (Elektrokardiogramma):** Yurak ritmi va qon aylanishi o'zgarishlarini tez aniqlash.\n* **ExoKG (Yurak UZI):** Yurak klapanlari, mushaklari va qon haydash quvvatini baholaydi.\n* **Qon tahlillari:** Lipid profili (xolesterin), koagulogramma va elektrolitlar.\n\n**Qaysi mutaxassisga murojaat qilish kerak?**\nYurak urishi tezlashishi, hansirash yoki qon bosimi o'ynashi kuzatilganda **Kardiolog** ko'rigidan o'tish zarur.`,
        recommendedSpecialties: ['Cardiology'],
        suggestedQuestions: [
          "Yaqin atrofdagi tajribali kardiologlar",
          "EKG va ExoKG tekshiruviga qanday yozilish mumkin?",
          "Qon bosimi ko'tarilganda birinchi yordam qoidalari"
        ],
        isEmergencyWarning: isUrgent,
        source: 'curated-medical-base',
      };
    }
  }

  // 9. Headache / Bosh og'rig'i / Nevrologiya
  if (q.includes('bosh og') || q.includes('migren') || q.includes('bosh aylan') || q.includes('головн') || q.includes('мигрен') || q.includes('headache') || q.includes('dizzy')) {
    if (language === 'uz') {
      return {
        reply: `### Bosh og'rig'i va Nevrologik maslahat\n\n**Mumkin bo'lgan sabablar:**\n* Zo'riqish va charchoq tufayli mushaklar spazmi\n* Migren yoki qon-tomir tonusi o'zgarishi\n* Bo'yin umurtqalari osteoxondrozi\n* Qon bosimi o'zgarishi\n\n**Tavsiya etiladigan mutaxassis:**\nMuntazam bosh og'rig'i, bosh aylanishi yoki uyqu buzilishida **Nevropatolog (Nevrolog)** ko'rigi tavsiya qilinadi. Zarurat bo'lsa, shifokor bosh miya MRTsi yoki bo'yin tomirlari dopplerografiyasini tayinlashi mumkin.`,
        recommendedSpecialties: ['Neurology', 'General Practice'],
        suggestedQuestions: [
          "Nevropatolog qabuliga yozilish",
          "Migren xurujida nima qilish kerak?",
          "Bo'yin osteoxondrozi uchun mashqlar"
        ],
        isEmergencyWarning: false,
        source: 'curated-medical-base',
      };
    }
  }

  // General default guidance
  if (language === 'uz') {
    return {
      reply: `Assalomu alaykum! Men **DocNear AI** universal tibbiy maslahatchisiman.\n\nSiz menga **har qanday tibbiy, salomatlik, dori-darmon, tahlillar yoki klinikalar bo'yicha savollaringizni** berishingiz mumkin:\n\n* **Alomatlar & Tashxis:** Nima bezovta qilayotganini yozing, mos mutaxassisni aytaman.\n* **Dori va Vitaminlar:** Dori vositalari, vitaminlar va biologik qo'shimchalar ta'siri.\n* **Tibbiy tekshiruvlar:** MRT, UZI, Qon tahlillari, Gastroskopiyaga tayyorgarlik.\n* **Sog'lom turmush tarzi:** Parhez, uyqu va jismoniy mashqlar.\n\nSizni ayni paytda nima qiziqtirmoqda?`,
      recommendedSpecialties: ['General Practice', 'Cardiology', 'Pediatrics', 'Dentistry'],
      suggestedQuestions: [
        "Qon tahliliga qanday tayyorlanish kerak?",
        "MRT va KT o'rtasidagi farq nima?",
        "Yaqin atrofdagi 24/7 tez tibbiy klinikalar",
        "Vitamin D va Magniyni qanday ichish kerak?"
      ],
      isEmergencyWarning: false,
      source: 'curated-medical-base',
    };
  } else if (language === 'ru') {
    return {
      reply: `Здравствуйте! Я универсальный медицинский ассистент **DocNear AI**.\n\nВы можете задать мне **абсолютно любой вопрос по здоровью, симптомам, лекарствам и анализам**:\n\n* **Симптомы и врачи:** Опишите жалобы, и я подскажу к кому записаться.\n* **Лекарства и витамины:** Действие препаратов, дозировки и совместимость.\n* **Диагностика:** Подготовка к МРТ, УЗИ, анализам крови, ФГДС.\n* **Образ жизни:** Питание, нормализация сна, снятие стресса.\n\nКакой вопрос вас интересует?`,
      recommendedSpecialties: ['General Practice', 'Cardiology', 'Pediatrics', 'Dentistry'],
      suggestedQuestions: [
        "Как подготовиться к сдаче анализов крови?",
        "Чем отличается МРТ от КТ?",
        "Круглосуточные клиники и дежурные врачи рядом",
        "Как правильно принимать витамины D и Магний?"
      ],
      isEmergencyWarning: false,
      source: 'curated-medical-base',
    };
  }

  return {
    reply: `Hello! I am **DocNear AI**, your universal healthcare & medical assistant.\n\nYou can ask me **anything regarding symptoms, medications, lab tests, diet, or clinic recommendations**:\n\n* **Symptoms & Specialist matching**\n* **Drugs, Vitamins & Supplements**\n* **Diagnostic test preparations (MRI, CT, Blood tests, Endoscopy)**\n* **Wellness, Diet & Recovery**\n\nHow can I help you today?`,
    recommendedSpecialties: ['General Practice', 'Cardiology', 'Pediatrics'],
    suggestedQuestions: [
      "How to prepare for fasting blood tests?",
      "What is the difference between MRI and CT?",
      "Find top-rated clinics near me",
      "Best ways to manage daily stress and sleep"
    ],
    isEmergencyWarning: false,
    source: 'curated-medical-base',
  };
}

// Curated high quality fallback with focus-area customization
function getCuratedFallbackTip(language: string, focusAreas: string, activityLevel: string = 'Moderate', dietaryPreference: string = 'Balanced') {
  const isCardio = focusAreas.toLowerCase().includes('cardio') || focusAreas.toLowerCase().includes('blood');
  const isSleep = focusAreas.toLowerCase().includes('sleep') || focusAreas.toLowerCase().includes('stress');
  const isNutrition = focusAreas.toLowerCase().includes('nutrition') || focusAreas.toLowerCase().includes('digest');
  const isEndo = focusAreas.toLowerCase().includes('diabet') || focusAreas.toLowerCase().includes('thyroid');
  const isOrtho = focusAreas.toLowerCase().includes('joint') || focusAreas.toLowerCase().includes('posture');

  if (language === 'uz') {
    let headline = 'Yurak ritmi va optimal gidratatsiya balansi';
    let focusCategory = 'Kardiologiya & Sog‘lom turmush tarzi';
    let advice = 'Bugun tanangizning suv muvozanatiga va qon aylanishiga alohida e’tibor qarating. Yetarli miqdorda iliq suv ichish qon quyuqlashishining oldini oladi va yurak mushaklariga tushadigan yuklamani kamaytiradi. Kun davomida 25-30 daqiqalik yengil piyoda yurish qon bosimini tabiiy ravishda barqarorlashtirishga yordam beradi.';
    let habit1 = 'Ertalab och qoringa 1 stakan iliq suv bilan kunni boshlang';
    let habit2 = 'Har 45 daqiqalik o‘tirib ishlashdan so‘ng 3 daqiqa cho‘zilish mashqlarini bajaring';
    let habit3 = 'Kechki soat 22:30 dan kechikmay ekranlardan uzoqlashib, dam olishga tayyorlaning';
    let nutrition = 'Kaliy va magniyga boy mahsulotlarni tanlang: bir hovuch yong‘oq yoki mayiz yurak qon-tomir tizimini quvvatlaydi.';
    let metric = 'Kunlik 2.2 litr toza suv va 7,500 qadam';
    let fact = 'Tadqiqotlarga ko‘ra, har kuni muntazam 30 daqiqa piyoda yurish yurak-qon tomir kasalliklari xavfini 35% ga kamaytiradi.';

    if (isSleep) {
      headline = 'Sokin uyqu va stressni boshqarish usullari';
      focusCategory = 'Uyqu gigiyenasi & Asab tizimi';
      advice = 'Asab tizimini tinchlantirish va uyqu sifatini oshirish uchun kechki vaqtda sokin muhit yarating. Magniyga boy yengil taomlar va xonani shamollatish chuqur uyqu fazasiga tezroq o‘tishga ko‘maklashadi.';
      habit1 = 'Kechki payt 10 daqiqa chuqur nafas olish mashqini bajaring';
      habit2 = 'Yotishdan 1 soat oldin telefon va noutbukni chetga suring';
      habit3 = 'Yotoqxonani uxlashdan oldin 5 daqiqa shamollating';
      nutrition = 'Kechki payt moychechak (romashka) yoki yalpiz choyi asab tizimini tinchlantiradi.';
      metric = 'Kamida 7.5 - 8 soatlik uzluksiz uyqu';
      fact = 'Sifatli uyqu immunitet hujayralarining yangilanishini 40% ga tezlashtiradi.';
    } else if (isNutrition || isEndo) {
      headline = 'Metabolizm faolligi va to‘g‘ri ovqatlanish balansi';
      focusCategory = 'Endokrinologiya & To‘g‘ri ovqatlanish';
      advice = 'Qondagi glyukoza miqdorini bir maromda saqlash uchun kletchatkaga boy sabzavotlar va oqsilli mahsulotlarni ustun qo‘ying. Ovqatlanish oralig‘ida yetarli miqdorda toza suv ichish moddalar almashinuvini yaxshilaydi.';
      habit1 = 'Nonushtada to‘yimli oqsil va sabzavotlarni iste’mol qiling';
      habit2 = 'Shirin va gazlangan ichimliklar o‘rniga limonli suv iching';
      habit3 = 'Kechki ovqatni uxlashdan 3 soat oldin yakunlang';
      nutrition = 'Ko‘katlar, zaytun moyi va yangi sabzavotlar to‘yimlilik indeksini oshiradi.';
      metric = 'Kuniga 400g xilma-xil yangi sabzavot va mevalar';
      fact = 'Kletchatkaga boy taomlar qon shakarining keskin ko‘tarilishining oldini oladi.';
    } else if (isOrtho) {
      headline = 'Umurtqa pog‘onasi va bo‘g‘imlar erkinligi';
      focusCategory = 'Ortopediya & Qomat salomatligi';
      advice = 'Uzoq vaqt bir joyda o‘tirish umurtqa pog‘onasi va bo‘yin mushaklariga bosim yuklaydi. Kichik tanaffuslar va muntazam harakat bo‘g‘im suyuqligining aylanishini yaxshilaydi.';
      habit1 = 'Har soatda 2 daqiqa turing va yelkalarni orqaga aylantiring';
      habit2 = 'Ish stoli va stul balandligini to‘g‘ri qomatga moslang';
      habit3 = 'Kechki payt oyoq va orqa mushaklarini yengil cho‘zing';
      nutrition = 'Kalsiy va D vitaminiga boy sut mahsulotlari yoki kunjut suyaklarni mustahkamlaydi.';
      metric = 'Kunlik kamida 8,000 qadam va 3 ta cho‘zilish seansi';
      fact = 'To‘g‘ri qomat o‘pka sig‘imini va miyaga kislorod yetib borishini 20% ga oshiradi.';
    }

    return {
      headline,
      focusCategory,
      advice,
      dailyActionItems: [habit1, habit2, habit3],
      nutritionTip: nutrition,
      vitalMetricToTrack: metric,
      didYouKnowFact: fact,
      motivationalQuote: 'Sog‘liq — har kungi kichik, ammo qat’iy odatlarning natijasidir.',
      generatedAt: new Date().toISOString(),
      source: 'curated-specialist',
    };
  }

  if (language === 'ru') {
    let headline = 'Баланс гидратации и поддержка сердечно-сосудистой системы';
    let focusCategory = 'Кардиология и Здоровое питание';
    let advice = 'Сегодня обратите особое внимание на водный баланс и мягкую физическую активность. Регулярное питье чистой воды комнатной температуры снижает вязкость крови и разгружает сердечную мышцу. Короткая 20–30 минутная прогулка на свежем воздухе улучшает снабжение тканей кислородом.';
    let habit1 = 'Начните утро со стакана теплой воды для мягкой активации метаболизма';
    let habit2 = 'Делайте 3-минутную разминку для шеи и спины каждые 50 минут работы за столом';
    let habit3 = 'Исключите экраны гаджетов за 45 минут до сна для качественного глубокого отдыха';
    let nutrition = 'Добавьте в рацион продукты, богатые калием и омега-3: грецкие орехи, шпинат или запеченную рыбу.';
    let metric = '2.2 литра чистой воды и не менее 7 500 шагов за день';
    let fact = 'Регулярная аэробная нагрузка умеренной интенсивности снижает уровень гормона стресса кортизола более чем на 25%.';

    if (isSleep) {
      headline = 'Качественный сон и восстановление нервной системы';
      focusCategory = 'Неврология и Гигиена сна';
      advice = 'Для глубокого восстановления нервной системы подготовьте организм ко сну заранее. Проветривание комнаты и снижение яркости освещения стимулируют естественную выработку мелатонина.';
      habit1 = 'Выполните 10 минут вечерней дыхательной практики или медитации';
      habit2 = 'Отложите смартфоны за 1 час до отхода ко сну';
      habit3 = 'Проветрите спальню для поддержания свежего прохладного воздуха';
      nutrition = 'Ромашковый или мятный чай без сахара расслабляет гладкую мускулатуру.';
      metric = '7.5 – 8 часов непрерывного глубокого сна';
      fact = 'Глубокая фаза сна критически важна для очищения мозга от продуктов метаболизма.';
    } else if (isNutrition || isEndo) {
      headline = 'Стабильный метаболизм и баланс питательных веществ';
      focusCategory = 'Эндокринология и Рациональное питание';
      advice = 'Для поддержания ровного уровня энергии отдавайте предпочтение цельным злакам, сложным углеводам и качественному белку. Это предотвращает резкие скачки сахара в крови.';
      habit1 = 'Сбалансируйте завтрак белками и клетчаткой';
      habit2 = 'Замените сладкие перекусы горстью миндаля или свежими ягодами';
      habit3 = 'Завершите ужин за 3 часа до сна';
      nutrition = 'Свежая зелень, оливковое масло и овощные салаты нормализуют пищеварение.';
      metric = 'Не менее 400г разнообразных овощей и зелени в день';
      fact = 'Клетчатка замедляет усвоение сахаров и поддерживает здоровую микрофлору кишечника.';
    }

    return {
      headline,
      focusCategory,
      advice,
      dailyActionItems: [habit1, habit2, habit3],
      nutritionTip: nutrition,
      vitalMetricToTrack: metric,
      didYouKnowFact: fact,
      motivationalQuote: 'Забота о себе сегодня — это ваша энергия и ясность ума завтра.',
      generatedAt: new Date().toISOString(),
      source: 'curated-specialist',
    };
  }

  // English fallback
  let headline = 'Optimal Hydration & Cardiovascular Vitality';
  let focusCategory = 'Cardiology & Daily Wellness';
  let advice = 'Focus on steady hydration and active recovery today. Adequate fluid intake optimizes blood viscosity and eases cardiovascular workload throughout your daily schedule. Incorporating a brisk 25-minute afternoon walk helps stabilize blood pressure and boosts mitochondrial energy production.';
  let habit1 = 'Begin the morning with 300ml of room-temperature water before coffee or tea';
  let habit2 = 'Take a 3-minute posture break and stretch your spine every 45 minutes of desk work';
  let habit3 = 'Wind down screens 45 minutes prior to sleep to optimize melatonin release';
  let nutrition = 'Incorporate potassium and antioxidant-rich foods: a handful of raw almonds or fresh berries strengthens vascular elasticity.';
  let metric = '2.2L water intake and 7,500 daily active steps';
  let fact = 'Clinical studies show that 30 minutes of consistent daily brisk walking reduces cardiovascular risk factors by up to 35%.';

  if (isSleep) {
    headline = 'Restorative Sleep Architecture & Stress Relief';
    focusCategory = 'Neurology & Sleep Hygiene';
    advice = 'To recharge cognitive clarity and down-regulate stress hormones, establish an evening wind-down routine. Dim indoor lights 1 hour before bed and lower room temperature slightly to initiate the natural sleep cycle.';
    habit1 = 'Complete 5 to 10 minutes of box breathing or calm stretching';
    habit2 = 'Set digital devices to do-not-disturb mode 1 hour before sleeping';
    habit3 = 'Keep the bedroom cool and well-ventilated for optimal sleep stages';
    nutrition = 'A warm cup of chamomile or magnesium-rich herbal infusion eases muscle tension.';
    metric = '7.5 to 8 hours of uninterrupted rest';
    fact = 'Deep slow-wave sleep is the primary physiological window for cellular repair and memory consolidation.';
  } else if (isNutrition || isEndo) {
    headline = 'Steady Metabolic Energy & Nutrient Density';
    focusCategory = 'Endocrinology & Clinical Nutrition';
    advice = 'Maintain stable blood glucose and sustained energy by prioritizing clean protein, complex fiber, and healthy lipids in each meal. Avoid glucose spikes by pairing carbs with fibrous vegetables.';
    habit1 = 'Start your day with a high-protein, nutrient-dense breakfast';
    habit2 = 'Replace refined sugary snacks with walnuts, pumpkin seeds, or crisp vegetables';
    habit3 = 'Finish dinner at least 3 hours before resting';
    nutrition = 'Dark leafy greens, cold-pressed olive oil, and fiber-rich legumes nurture gut microbiome diversity.';
    metric = '400g+ of whole vegetables and 2.5L filtered water';
    fact = 'Dietary soluble fiber forms a protective gel in the digestive tract, stabilizing postprandial glucose curves.';
  }

  return {
    headline,
    focusCategory,
    advice,
    dailyActionItems: [habit1, habit2, habit3],
    nutritionTip: nutrition,
    vitalMetricToTrack: metric,
    didYouKnowFact: fact,
    motivationalQuote: 'Small, consistent daily habits create lifelong vibrant health.',
    generatedAt: new Date().toISOString(),
    source: 'curated-specialist',
  };
}

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DocNear Server is actively running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
