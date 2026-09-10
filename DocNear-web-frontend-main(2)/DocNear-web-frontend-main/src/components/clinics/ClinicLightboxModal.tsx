import React, { useState, useEffect, useCallback } from 'react';
import { ClinicPhoto } from '../../types';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface ClinicLightboxModalProps {
  isOpen: boolean;
  photos: ClinicPhoto[];
  initialIndex?: number;
  clinicName: string;
  onClose: () => void;
}

export const ClinicLightboxModal: React.FC<ClinicLightboxModalProps> = ({
  isOpen,
  photos,
  initialIndex = 0,
  clinicName,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clinic photo gallery lightbox"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between text-white animate-in fade-in duration-200 select-none"
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-white backdrop-blur-sm">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md">
              {clinicName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-medium">
                Photo {currentIndex + 1} of {photos.length}
              </span>
              {currentPhoto.category && (
                <>
                  <span>•</span>
                  <span className="capitalize px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-blue-200">
                    {currentPhoto.category}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
              showInfo ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
            title="Toggle caption info"
          >
            <Info size={18} />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors cursor-pointer hidden sm:block"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/15 hover:bg-rose-600 text-white transition-colors cursor-pointer ml-2"
            title="Close Lightbox (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-3 sm:left-6 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition-all active:scale-95 cursor-pointer shadow-xl"
          aria-label="Previous photo"
        >
          <ChevronLeft size={26} />
        </button>

        {/* Active High-Res Photo */}
        <div className="relative max-w-5xl max-h-[70vh] flex items-center justify-center">
          <img
            key={currentPhoto.id || currentIndex}
            src={currentPhoto.url}
            alt={currentPhoto.title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[68vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
          />

          {/* Photo Caption Overlay at Bottom of Image */}
          {showInfo && (currentPhoto.title || currentPhoto.description) && (
            <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 p-3 sm:p-4 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-left transition-all">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400 shrink-0" />
                <span>{currentPhoto.title}</span>
              </h4>
              {currentPhoto.description && (
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {currentPhoto.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-3 sm:right-6 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition-all active:scale-95 cursor-pointer shadow-xl"
          aria-label="Next photo"
        >
          <ChevronRight size={26} />
        </button>
      </div>

      {/* Bottom Thumbnail Strip Carousel */}
      <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
          {photos.map((photo, idx) => (
            <button
              key={photo.id || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative rounded-xl overflow-hidden shrink-0 w-16 h-12 sm:w-20 sm:h-14 border-2 transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'border-blue-500 scale-105 ring-2 ring-blue-400/50 shadow-md'
                  : 'border-white/20 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={photo.url}
                alt={photo.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {currentIndex === idx && (
                <span className="absolute inset-0 bg-blue-500/20" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
