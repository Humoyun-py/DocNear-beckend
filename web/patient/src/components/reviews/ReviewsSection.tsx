import React, { useState, useEffect } from 'react';
import { Review } from '../../types';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppointments } from '../../context/AppointmentContext';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  ThumbsUp,
  Plus,
  Filter,
  X,
  Sparkles,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReviewsSectionProps {
  targetId: string;
  targetType: 'clinic' | 'doctor';
  targetName: string;
  baseRating?: number;
  baseReviewCount?: number;
  onRatingUpdated?: (newAvg: number, newCount: number) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  targetId,
  targetType,
  targetName,
  baseRating = 4.8,
  baseReviewCount = 45,
  onRatingUpdated,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useAppointments();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState(
    reviewService.calculateRatingStats(targetId, targetType, baseRating, baseReviewCount)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [helpfulLikes, setHelpfulLikes] = useState<Record<string, number>>({});

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userName, setUserName] = useState<string>(user?.name || '');
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const availableTags =
    targetType === 'doctor'
      ? ['Punctual', 'Detailed Explanation', 'Attentive & Caring', 'Gentle Treatment', 'Great Diagnosis', 'Highly Recommended']
      : ['Clean Clinic', 'Modern Equipment', 'Fast Reception', 'Friendly Staff', '24/7 Service', 'Easy Parking'];

  const reloadReviews = async () => {
    const list = await reviewService.getReviewsForTarget(targetId, targetType);
    setReviews(list);
    const newStats = reviewService.calculateRatingStats(
      targetId,
      targetType,
      baseRating,
      baseReviewCount
    );
    setStats(newStats);
    if (onRatingUpdated) {
      onRatingUpdated(newStats.averageRating, newStats.totalReviews);
    }
  };

  useEffect(() => {
    reloadReviews().catch(error => showToast(error.message, 'error'));
  }, [targetId, targetType]);

  useEffect(() => {
    if (user?.name && !userName) {
      setUserName(user.name);
    }
  }, [user]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast(t('pleaseEnterReview') || 'Please enter your feedback comment', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReview = await reviewService.addReview({
        targetId,
        targetType,
        targetName,
        userName: userName.trim() || user?.name || 'Verified Patient',
        userAvatar: user?.avatar,
        userEmail: user?.email,
        rating,
        comment,
        tags: selectedTags.length > 0 ? selectedTags : ['Verified Patient'],
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#2563eb', '#10b981', '#f59e0b'],
        });
      } catch {
        // ignore
      }

      showToast(t('reviewSubmittedSuccess') || 'Thank you! Your review has been published.', 'success');
      setComment('');
      setSelectedTags([]);
      setIsModalOpen(false);
      await reloadReviews();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to post review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = (reviewId: string) => {
    setHelpfulLikes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
  };

  const filteredReviews = selectedStarFilter
    ? reviews.filter((r) => Math.round(r.rating) === selectedStarFilter)
    : reviews;

  const starLabels: Record<number, string> = {
    5: t('starExcellent') || 'Excellent (5/5)',
    4: t('starGood') || 'Very Good (4/5)',
    3: t('starAverage') || 'Average (3/5)',
    2: t('starPoor') || 'Below Average (2/5)',
    1: t('starTerrible') || 'Poor (1/5)',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 md:p-8 space-y-8 transition-colors duration-200">
      {/* Header with Title and "Leave a Review" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-blue-600 dark:text-blue-400" size={24} />
            <span>{t('patientReviews') || 'Patient Reviews & Ratings'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('verifiedReviewsSubtitle') || 'Authentic feedback and ratings from verified patients'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>{t('writeAReview') || 'Write a Review'}</span>
        </button>
      </div>

      {/* Ratings Overview Bar & Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
        {/* Left Big Score Box */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-2xs">
          <div className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 text-amber-400 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={
                  star <= Math.round(stats.averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200 dark:text-slate-700 fill-slate-100 dark:fill-slate-800'
                }
              />
            ))}
          </div>
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {t('basedOn') || 'Based on'} {stats.totalReviews} {t('verifiedReviewsCount') || 'verified reviews'}
          </div>
          <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={12} />
            <span>100% {t('verifiedPatients') || 'Verified Patients'}</span>
          </div>
        </div>

        {/* Right Star Breakdown Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star as 1 | 2 | 3 | 4 | 5];
            const pct = stats.percentages[star as 1 | 2 | 3 | 4 | 5];
            const isSelected = selectedStarFilter === star;

            return (
              <button
                key={star}
                onClick={() =>
                  setSelectedStarFilter(isSelected ? null : star)
                }
                className={`w-full flex items-center gap-3 text-xs p-1.5 rounded-lg transition-colors text-left cursor-pointer ${
                  isSelected ? 'bg-blue-100/70 dark:bg-blue-950/60' : 'hover:bg-white/80 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="w-12 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>{star}</span>
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
                <div className="w-14 text-right text-slate-500 dark:text-slate-400 font-medium font-mono text-[11px]">
                  {pct}% ({count})
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter / Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('filterByRating') || 'Filter:'}</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedStarFilter(null)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedStarFilter === null
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t('allReviews') || 'All'} ({reviews.length})
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStarFilter(selectedStarFilter === s ? null : s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  selectedStarFilter === s
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{s}</span>
                <Star size={11} className={selectedStarFilter === s ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'} />
              </button>
            ))}
          </div>
        </div>

        {selectedStarFilter && (
          <button
            onClick={() => setSelectedStarFilter(null)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <X size={12} />
            {t('clearFilter') || 'Clear filter'}
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
            <MessageSquare className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
            <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              {t('noReviewsYet') || 'No reviews match the selected filter.'}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
            >
              {t('beFirstToReview') || 'Be the first to leave a review'}
            </button>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-shadow shadow-xs space-y-3"
            >
              {/* User Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                    alt={rev.userName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{rev.userName}</span>
                      {rev.isVerifiedPatient && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 size={10} />
                          <span>{t('verifiedPatient') || 'Verified'}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">{rev.date}</div>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200/80 dark:border-amber-800/80">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={
                          s <= rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 dark:text-slate-700 fill-slate-100 dark:fill-slate-800'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 ml-1">
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              {/* Tags */}
              {rev.tags && rev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rev.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comment */}
              <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {rev.comment}
              </p>

              {/* Helpful footer */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                  {t('reviewFor') || 'Review for'} <span className="font-semibold text-slate-600 dark:text-slate-400">{targetName}</span>
                </span>
                <button
                  onClick={() => handleToggleLike(rev.id)}
                  className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ThumbsUp size={13} />
                  <span className="text-[11px] font-semibold">
                    {t('helpful') || 'Helpful'} {(helpfulLikes[rev.id] || 0) > 0 && `(${helpfulLikes[rev.id]})`}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Submission Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Title */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  <span>{t('leaveFeedback') || 'Rate & Review'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {targetName}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* Star Selector */}
              <div className="space-y-2 text-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('yourOverallRating') || 'Your Overall Rating'}
                </label>
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 dark:text-slate-600 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star
                        size={32}
                        className={
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {starLabels[hoverRating || rating]}
                </div>
              </div>

              {/* Patient Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('yourName') || 'Your Name / Display Name'}
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Aziza R."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Tag Badges Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('selectHighlights') || 'What went well? (Select Highlights)'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Comment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('detailedFeedback') || 'Detailed Patient Feedback'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    targetType === 'doctor'
                      ? 'Describe your consultation experience, the doctor\'s diagnostic clarity, punctuality, and treatment plan...'
                      : 'Describe the clinic facilities, reception speed, hygiene standards, and diagnostic equipment...'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-900 dark:text-white resize-none"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (t('publishing') || 'Publishing...') : (t('submitReview') || 'Submit Review')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
