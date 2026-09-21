import React, { useState } from 'react';
import { Clinic, ClinicPhoto } from '../../types';
import { getClinicPhotos } from '../../utils/clinicPhotos';
import { ClinicLightboxModal } from './ClinicLightboxModal';
import { useLanguage } from '../../context/LanguageContext';
import {
  Images,
  Maximize2,
  Sparkles,
  Camera,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface ClinicPhotoGalleryProps {
  clinic: Clinic;
  className?: string;
}

export const ClinicPhotoGallery: React.FC<ClinicPhotoGalleryProps> = ({
  clinic,
  className = '',
}) => {
  const { language, t } = useLanguage();
  const photos = getClinicPhotos(clinic);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const categories = [
    { id: 'all', label: language === 'uz' ? 'Barcha rasmlar' : language === 'ru' ? 'Все фото' : 'All Photos' },
    { id: 'facility', label: language === 'uz' ? 'Klinika binosi' : language === 'ru' ? 'Клиника' : 'Facility' },
    { id: 'equipment', label: language === 'uz' ? 'Uskunalar & MRT' : language === 'ru' ? 'Оборудование' : 'Equipment' },
    { id: 'rooms', label: language === 'uz' ? 'Palatalar' : language === 'ru' ? 'Палаты' : 'Patient Rooms' },
    { id: 'exterior', label: language === 'uz' ? 'Tashqi ko‘rinish' : language === 'ru' ? 'Фасад' : 'Exterior' },
  ];

  const filteredPhotos = activeCategory === 'all'
    ? photos
    : photos.filter((p) => p.category === activeCategory);

  const handleOpenLightbox = (index: number) => {
    // Find index in main photos list
    const targetPhoto = filteredPhotos[index] || photos[0];
    const originalIndex = photos.findIndex((p) => p.id === targetPhoto.id);
    setSelectedPhotoIndex(originalIndex >= 0 ? originalIndex : index);
    setLightboxOpen(true);
  };

  const previewPhotos = filteredPhotos.slice(0, 5);
  const remainingCount = Math.max(0, filteredPhotos.length - 5);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 transition-colors duration-200 ${className}`}>
      {/* Header with Title and View All Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
            <Camera size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>
                {language === 'uz'
                  ? 'Klinika fotogalereyasi va sharoitlar'
                  : language === 'ru'
                  ? 'Фотогалерея клиники и условия'
                  : 'Facility Photo Gallery & Suites'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800">
                {photos.length} {language === 'uz' ? 'rasm' : language === 'ru' ? 'фото' : 'photos'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'uz'
                ? 'Zamonaviy Germaniya MRT skanerlari, jarrohlik zallari va shinam palatalar'
                : language === 'ru'
                ? 'Высокоточные МРТ аппараты, стерильные операционные и комфортные палаты'
                : 'High-resolution preview of sterile operating theaters, MRI suites, and private rooms'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenLightbox(0)}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Maximize2 size={14} />
          <span>
            {language === 'uz'
              ? 'To‘liq ekranda ko‘rish'
              : language === 'ru'
              ? 'Во весь экран'
              : 'Full Screen Gallery'}
          </span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Mosaic Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Large Featured Photo */}
        {previewPhotos.length > 0 && (
          <div
            onClick={() => handleOpenLightbox(0)}
            className="sm:col-span-2 sm:row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-xs aspect-[4/3] sm:aspect-auto min-h-[220px]"
          >
            <img
              src={previewPhotos[0].url}
              alt={previewPhotos[0].title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <span className="px-2 py-0.5 rounded-md bg-blue-600/90 text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">
                {previewPhotos[0].category || 'Facility'}
              </span>
              <p className="text-xs sm:text-sm font-bold truncate">{previewPhotos[0].title}</p>
            </div>
            <div className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={16} />
            </div>
          </div>
        )}

        {/* Small Companion Photos */}
        {previewPhotos.slice(1, 5).map((photo, idx) => {
          const actualIndex = idx + 1;
          const isLast = idx === 3 && remainingCount > 0;

          return (
            <div
              key={photo.id || idx}
              onClick={() => handleOpenLightbox(actualIndex)}
              className="relative rounded-2xl overflow-hidden group cursor-pointer border border-slate-200/80 dark:border-slate-800 aspect-[4/3] shadow-xs"
            >
              <img
                src={photo.url}
                alt={photo.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute bottom-2 left-2 right-2 text-white">
                <p className="text-[11px] font-semibold truncate drop-shadow-sm">{photo.title}</p>
              </div>

              {/* +More Photos Overlay Badge */}
              {isLast && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white text-center p-2">
                  <span className="text-lg font-extrabold">+{remainingCount + 1}</span>
                  <span className="text-[10px] font-medium text-slate-200">
                    {language === 'uz' ? 'Barcha rasmlar' : language === 'ru' ? 'Ещё фото' : 'More photos'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <ClinicLightboxModal
        isOpen={lightboxOpen}
        photos={photos}
        initialIndex={selectedPhotoIndex}
        clinicName={clinic.name}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};
