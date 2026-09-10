import React, { useRef, useState, useEffect } from 'react';
import { Review } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle2,
  ThumbsUp,
  MessageSquarePlus,
  Sparkles,
  Heart,
} from 'lucide-react';

interface ReviewCarouselProps {
  reviews: Review[];
  clinicName: string;
  rating?: number;
  reviewCount?: number;
  onWriteReview?: () => void;
  className?: string;
}

export const ReviewCarousel: React.FC<ReviewCarouselProps> = ({
  reviews,
  clinicName,
  rating = 4.9,
  reviewCount = 48,
  onWriteReview,
  className = '',
}) => {
  const { t, language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [reviews]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleToggleLike = (reviewId: string) => {
    const isLiked = likedReviews[reviewId];
    setLikedReviews((prev) => ({ ...prev, [reviewId]: !isLiked }));
    setLikes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + (isLiked ? -1 : 1),
    }));
  };

  // Fallback avatar helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const avatarColors = [
    'bg-blue-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-purple-500 text-white',
    'bg-rose-500 text-white',
    'bg-teal-500 text-white',
  ];

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-700/60 ${className}`}>
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span>{t('patientTestimonials') || 'Bemorlarning fikrlari'}</span>
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-extrabold backdrop-blur-md">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>{rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({reviewCount} {t('reviews') || 'taqriz'})</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {language === 'uz'
              ? `${clinicName} haqida bemorlar taqrizi`
              : language === 'ru'
              ? `Отзывы и впечатления пациентов о ${clinicName}`
              : `Patient Testimonials for ${clinicName}`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            {language === 'uz'
              ? 'Tasdiqlangan tashrif buyuruvchilarning shaxsiy tajribalari va shifokorlar haqidagi xulosalari.'
              : language === 'ru'
              ? 'Реальные впечатления и отзывы пациентов после визита и лечения.'
              : 'Authentic testimonials and verified feedback from patients who received medical care here.'}
          </p>
        </div>

        {/* Action Controls & Navigation Arrows */}
        <div className="flex items-center gap-2.5 self-start md:self-end">
          {onWriteReview && (
            <button
              onClick={onWriteReview}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <MessageSquarePlus size={14} />
              <span>{t('writeReview') || 'Taqriz qoldirish'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll testimonials left"
              className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll testimonials right"
              className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 space-y-3">
          <Quote size={32} className="text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            {t('noReviewsYet') || 'Hozircha taqrizlar mavjud emas.'}
          </p>
          {onWriteReview && (
            <button
              onClick={onWriteReview}
              className="text-xs text-blue-400 font-bold hover:underline cursor-pointer"
            >
              {t('beFirstToReview') || 'Birinchi bo‘lib fikr bildiring'}
            </button>
          )}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 scroll-smooth snap-x snap-mandatory relative z-10"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reviews.map((rev, idx) => {
            const isLiked = likedReviews[rev.id];
            const likeCount = (likes[rev.id] || 0) + (rev.rating === 5 ? 3 : 1);
            const colorClass = avatarColors[idx % avatarColors.length];

            return (
              <div
                key={rev.id}
                className="w-[300px] sm:w-[340px] shrink-0 snap-start bg-white/10 hover:bg-white/[0.14] backdrop-blur-md rounded-2xl p-5 border border-white/10 transition-all flex flex-col justify-between space-y-4 hover:border-blue-400/40 hover:shadow-lg"
              >
                {/* Top User Info & Rating */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rev.userAvatar ? (
                        <img
                          src={rev.userAvatar}
                          alt={rev.userName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover border-2 border-white/40 shadow-xs shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-11 h-11 rounded-full ${colorClass} font-bold text-xs flex items-center justify-center border-2 border-white/40 shadow-xs shrink-0`}
                        >
                          {getInitials(rev.userName)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white leading-tight">
                            {rev.userName}
                          </h4>
                          {rev.isVerifiedPatient && (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-400 shrink-0"
                              title={t('verifiedPatient') || 'Verified Patient'}
                            />
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">{rev.date}</span>
                      </div>
                    </div>

                    <Quote size={22} className="text-blue-400/40 shrink-0" />
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= Math.round(rev.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-300 ml-1.5">
                      {rev.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Testimonial Comment */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-4 italic">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Bottom Tags & Like Button */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {rev.tags && rev.tags.slice(0, 2).map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 text-[10px] font-semibold border border-blue-400/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleLike(rev.id)}
                    aria-label="Mark review as helpful"
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isLiked
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    <ThumbsUp size={12} className={isLiked ? 'fill-rose-400 text-rose-400' : ''} />
                    <span className="text-[11px] font-bold">{likeCount}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
