'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: {
    src: string;
    alt?: string;
    caption?: string;
  }[];
  initialIndex?: number;
}

export default function ImageLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsLoading(true);
    setIsZoomed(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsLoading(true);
    setIsZoomed(false);
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasMultipleImages) goToPrevious();
          break;
        case 'ArrowRight':
          if (hasMultipleImages) goToNext();
          break;
      }
    },
    [onClose, goToPrevious, goToNext, hasMultipleImages]
  );

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="text-white">
          {hasMultipleImages && (
            <span className="text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label={isZoomed ? '축소' : '확대'}
          >
            <span className="material-symbols-outlined">
              {isZoomed ? 'zoom_out' : 'zoom_in'}
            </span>
          </button>
          <button
            onClick={onClose}
            className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div
        className="flex-1 flex items-center justify-center p-4 pt-16 pb-20"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className={`relative w-full h-full flex items-center justify-center transition-transform duration-300 ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-4xl animate-spin">
                progress_activity
              </span>
            </div>
          )}
          <Image
            src={currentImage.src}
            alt={currentImage.alt || '이미지'}
            fill
            className={`object-contain transition-transform duration-300 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            onLoad={() => setIsLoading(false)}
            sizes="100vw"
            priority
          />
        </div>
      </div>

      {/* Caption */}
      {currentImage.caption && (
        <div className="absolute bottom-16 left-0 right-0 text-center px-4">
          <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-lg backdrop-blur-sm">
            {currentImage.caption}
          </p>
        </div>
      )}

      {/* Navigation Arrows */}
      {hasMultipleImages && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
            aria-label="이전 이미지"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
            aria-label="다음 이미지"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </>
      )}

      {/* Thumbnail Strip */}
      {hasMultipleImages && images.length <= 10 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-center gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsLoading(true);
                  setIsZoomed(false);
                }}
                className={`relative size-12 rounded-lg overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'ring-2 ring-white scale-110'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt || `썸네일 ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
