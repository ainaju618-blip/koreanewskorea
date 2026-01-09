'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RegionInfo } from '@/types/region';

interface HeroBannerProps {
  region: RegionInfo;
}

// 배경 이미지 배열 (3개 이미지 순환)
const HERO_IMAGES = [
  '/images/hero/main-hero.png',
  '/images/hero/main-hero-2.png',
  '/images/hero/main-hero-3.png',
];

// 슬라이드 전환 간격 (밀리초) - 7초
const SLIDE_INTERVAL = 7000;

// 애니메이션 변형 (더 부드럽고 느린 전환)
const slideVariants = {
  enter: {
    opacity: 0,
    scale: 1.03,
  },
  center: {
    opacity: 1,
    scale: 1,
    transition: {
      opacity: { duration: 2.0, ease: [0.4, 0, 0.2, 1] as const },
      scale: { duration: 2.5, ease: [0.4, 0, 0.2, 1] as const },
    },
  },
  exit: {
    opacity: 0,
    scale: 1.01,
    transition: {
      opacity: { duration: 2.0, ease: [0.4, 0, 1, 1] as const },
      scale: { duration: 2.0, ease: [0.4, 0, 1, 1] as const },
    },
  },
};

/**
 * 지역 페이지 히어로 배너
 * Framer Motion을 사용한 자동 슬라이더
 * 3개 이미지를 5초마다 부드럽게 전환
 */
export default function HeroBanner({ region }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 자동 슬라이드 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  // Theme color mapping
  const themeColors: Record<string, { gradient: string; badge: string; accent: string }> = {
    emerald: {
      gradient: 'from-emerald-600/50 to-teal-500/50',
      badge: 'bg-emerald-500/30',
      accent: 'text-emerald-100',
    },
    cyan: {
      gradient: 'from-cyan-600/85 to-blue-500/70',
      badge: 'bg-cyan-500/30',
      accent: 'text-cyan-100',
    },
    purple: {
      gradient: 'from-purple-600/85 to-indigo-500/70',
      badge: 'bg-purple-500/30',
      accent: 'text-purple-100',
    },
    blue: {
      gradient: 'from-blue-600/85 to-indigo-500/70',
      badge: 'bg-blue-500/30',
      accent: 'text-blue-100',
    },
    orange: {
      gradient: 'from-orange-600/85 to-red-500/70',
      badge: 'bg-orange-500/30',
      accent: 'text-orange-100',
    },
  };

  const theme = themeColors[region.themeColor] || themeColors.cyan;

  return (
    <section className="relative text-white py-16 overflow-hidden">
      {/* Background Images with Animation */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <Image
            src={HERO_IMAGES[currentIndex]}
            alt={`${region.name} 대표 풍경 ${currentIndex + 1}`}
            fill
            className="object-cover object-[center_40%]"
            priority={currentIndex === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} z-[1]`} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-6 h-6" />
          <span className={`${theme.accent} text-sm font-medium`}>{region.nameEn.toUpperCase()}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{region.name}</h1>
        <p className={`${theme.accent} max-w-2xl mb-4`}>
          {region.description}
        </p>
        {/* 슬로건 배지 */}
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
            <Quote className="w-3.5 h-3.5" />
            <span className="font-medium">{region.slogan}</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 ${theme.badge} backdrop-blur-sm px-3 py-1.5 rounded-full text-xs ${theme.accent}`}>
            <span>{region.sido} | {region.sidoSlogan}</span>
          </div>
        </div>

        {/* 슬라이드 인디케이터 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`슬라이드 ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
