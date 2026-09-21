import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { healthTipService, DailyHealthTipResponse } from '../../services/healthTipService';
import {
  getFocusAreaLabel,
  getActivityLevelLabel,
  FOCUS_AREA_OPTIONS,
} from '../../utils/specialtyTranslations';
import {
  Sparkles,
  Heart,
  CheckCircle2,
  Circle,
  RefreshCw,
  SlidersHorizontal,
  Apple,
  Activity,
  Lightbulb,
  X,
  Check,
  Quote,
  Flame,
  ShieldCheck,
} from 'lucide-react';

export const DailyHealthTipSection: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { language, t } = useLanguage();

  const [tipData, setTipData] = useState<DailyHealthTipResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [completedHabits, setCompletedHabits] = useState<{ [idx: number]: boolean }>({});
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(
    user?.healthPreferences?.focusAreas || [
      'Cardiology & Blood Pressure',
      'Sleep & Stress Management',
      'Healthy Nutrition & Hydration',
    ]
  );
  const [activityLevel, setActivityLevel] = useState<string>(
    user?.healthPreferences?.activityLevel || 'Moderate'
  );
  const [dietaryPref, setDietaryPref] = useState<string>(
    user?.healthPreferences?.dietaryPreference || 'Balanced Mediterranean'
  );

  const fetchTip = async (customPreferences?: any) => {
    setIsLoading(true);
    try {
      const prefs = customPreferences || user?.healthPreferences || {
        focusAreas: selectedFocusAreas,
        activityLevel,
        dietaryPreference: dietaryPref,
      };
      const data = await healthTipService.getPersonalizedDailyTip(
        prefs,
        user?.name || 'Aziza',
        language
      );
      setTipData(data);
    } catch (err) {
      console.error('Error fetching health tip:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTip();
  }, [language, user?.healthPreferences]);

  // Load completed habits from localStorage for today's date key
  useEffect(() => {
    try {
      const todayKey = `docnear_habits_${new Date().toISOString().slice(0, 10)}`;
      const saved = localStorage.getItem(todayKey);
      if (saved) {
        setCompletedHabits(JSON.parse(saved));
      } else {
        setCompletedHabits({});
      }
    } catch {
      setCompletedHabits({});
    }
  }, [tipData?.headline]);

  const toggleHabit = (idx: number) => {
    const nextState = { ...completedHabits, [idx]: !completedHabits[idx] };
    setCompletedHabits(nextState);
    try {
      const todayKey = `docnear_habits_${new Date().toISOString().slice(0, 10)}`;
      localStorage.setItem(todayKey, JSON.stringify(nextState));
    } catch (err) {
      console.error('Failed to save habit state:', err);
    }
  };

  const handleSavePreferences = () => {
    const updated = {
      ...(user?.healthPreferences || {}),
      focusAreas: selectedFocusAreas,
      activityLevel: activityLevel as any,
      dietaryPreference: dietaryPref,
    };
    updateProfile({ healthPreferences: updated });
    setShowPreferencesModal(false);
    fetchTip(updated);
  };

  const toggleFocusArea = (area: string) => {
    if (selectedFocusAreas.includes(area)) {
      if (selectedFocusAreas.length > 1) {
        setSelectedFocusAreas(selectedFocusAreas.filter((a) => a !== area));
      }
    } else {
      setSelectedFocusAreas([...selectedFocusAreas, area]);
    }
  };

  const completedCount = Object.values(completedHabits).filter(Boolean).length;

  return (
    <section id="daily-health-tip-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-extrabold border border-blue-400/30">
                <Sparkles size={13} className="text-blue-300 animate-pulse" />
                <span>{t('aiPersonalizedBadge')}</span>
              </span>
              {tipData?.focusCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                  <Heart size={12} className="text-emerald-400" />
                  <span>{getFocusAreaLabel(tipData.focusCategory, language)}</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {t('dailyHealthTip')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {t('dailyHealthTipDesc')}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPreferencesModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title={t('editHealthPreferences')}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">{t('editHealthPreferences')}</span>
            </button>
            <button
              onClick={() => fetchTip()}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              title={t('refreshTip')}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>{t('refreshTip')}</span>
            </button>
          </div>
        </div>

        {/* User Active Preferences Tags */}
        <div className="py-3 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs text-slate-300 relative z-10">
          <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1">
            <Activity size={13} className="text-blue-400" />
            <span>{t('healthFocusAreas')}:</span>
          </span>
          {(user?.healthPreferences?.focusAreas || selectedFocusAreas).map((area) => (
            <span
              key={area}
              className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700/60 font-medium shrink-0"
            >
              {getFocusAreaLabel(area, language)}
            </span>
          ))}
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center animate-spin">
              <RefreshCw size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-300">{t('generatingAdvice')}</p>
          </div>
        ) : tipData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 relative z-10">
            {/* Left Col: Main Advice & Micro Habits */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/70 rounded-2xl p-5 space-y-3">
                <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                  {tipData.headline}
                </h3>
                <div className="text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2.5 whitespace-pre-line font-normal">
                  {tipData.advice}
                </div>
                {tipData.motivationalQuote && (
                  <div className="pt-3 border-t border-slate-700/50 flex items-start gap-2 text-xs italic text-blue-200">
                    <Quote size={14} className="shrink-0 text-blue-400 mt-0.5" />
                    <span>"{tipData.motivationalQuote}"</span>
                  </div>
                )}
              </div>

              {/* Interactive Daily 3 Micro Habits */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-amber-400" />
                    <h4 className="text-sm font-extrabold text-white">
                      {t('dailyMicroActions')}
                    </h4>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200">
                    {completedCount} / {tipData.dailyActionItems?.length || 3}{' '}
                    {t('habitCompleted')}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {tipData.dailyActionItems?.map((habit, idx) => {
                    const isDone = !!completedHabits[idx];
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleHabit(idx)}
                        className={`w-full p-3 rounded-xl text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 border cursor-pointer ${
                          isDone
                            ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200 line-through opacity-80'
                            : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-blue-500/50'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2
                            size={18}
                            className="text-emerald-400 shrink-0 mt-0.5"
                          />
                        ) : (
                          <Circle
                            size={18}
                            className="text-slate-400 shrink-0 mt-0.5"
                          />
                        )}
                        <span className="flex-1">{habit}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col: Nutrition Highlight, Vital Metric & Did You Know */}
            <div className="lg:col-span-5 space-y-4">
              {/* Nutrition Card */}
              {tipData.nutritionTip && (
                <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-2xl p-4.5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                    <Apple size={15} />
                    <span>{t('nutritionHighlight')}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                    {tipData.nutritionTip}
                  </p>
                </div>
              )}

              {/* Vital Metric To Track */}
              {tipData.vitalMetricToTrack && (
                <div className="bg-blue-950/40 border border-blue-700/40 rounded-2xl p-4.5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-extrabold uppercase tracking-wider">
                    <Activity size={15} />
                    <span>{t('metricToTrack')}</span>
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-white">
                    {tipData.vitalMetricToTrack}
                  </div>
                </div>
              )}

              {/* Did You Know Clinical Fact */}
              {tipData.didYouKnowFact && (
                <div className="bg-amber-950/20 border border-amber-700/30 rounded-2xl p-4.5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                    <Lightbulb size={15} />
                    <span>{t('didYouKnow')}</span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    {tipData.didYouKnowFact}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Edit Health Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-white space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-blue-400" />
                <h3 className="font-extrabold text-lg text-white">
                  {t('editHealthPreferences')}
                </h3>
              </div>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Focus area multi-select tags */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {t('healthFocusAreas')}{' '}
                <span className="text-slate-400 normal-case font-normal">
                  {language === 'uz'
                    ? '(1 tadan 5 tagacha tanlang)'
                    : language === 'ru'
                    ? '(Выберите от 1 до 5)'
                    : '(Select 1 to 5)'}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREA_OPTIONS.map((option) => {
                  const isSelected = selectedFocusAreas.includes(option.id);
                  const label = getFocusAreaLabel(option.id, language);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleFocusArea(option.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activity Level selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {language === 'uz'
                  ? 'Jismoniy faollik darajasi'
                  : language === 'ru'
                  ? 'Уровень физической активности'
                  : 'Activity Level'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Sedentary', 'Moderate', 'Active'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setActivityLevel(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      activityLevel === lvl
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    {getActivityLevelLabel(lvl, language)}
                  </button>
                ))}
              </div>
            </div>

            {/* Save & Cancel Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>{t('savePreferences')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
