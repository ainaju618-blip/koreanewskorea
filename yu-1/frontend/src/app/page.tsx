'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';

export default function Home() {
  const router = useRouter();

  const handleQuickFortune = () => {
    const randomCategory = Math.floor(Math.random() * 9) + 1;
    router.push(`/divination?category=${randomCategory}&quick=true`);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* 별 파티클 배경 */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="stars-bg" />
      </div>

      <Header />

      <main className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* 히어로 섹션 - 영상 배경 + 오늘의 운세 */}
        <HeroSection onQuickFortune={handleQuickFortune} />
      </main>

      {/* CSS for cosmic background */}
      <style jsx>{`
        .stars-bg {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #000;
        }

        .stars-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(3px 3px at 5% 8%, #fff, transparent),
            radial-gradient(3px 3px at 28% 12%, #fff, transparent),
            radial-gradient(3px 3px at 58% 18%, #fff, transparent),
            radial-gradient(3px 3px at 88% 22%, #fff, transparent),
            radial-gradient(3px 3px at 35% 52%, #fff, transparent),
            radial-gradient(3px 3px at 92% 55%, #fff, transparent),
            radial-gradient(3px 3px at 48% 82%, #fff, transparent),
            radial-gradient(3px 3px at 25% 92%, #fff, transparent),
            radial-gradient(3px 3px at 85% 88%, #fff, transparent);
          background-size: 100% 100%;
          animation: twinkle-bright 4s ease-in-out infinite;
        }

        .stars-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(2px 2px at 3% 5%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 18% 8%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 33% 18%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 48% 28%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 62% 25%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 78% 18%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 92% 12%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 5% 35%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 20% 55%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 38% 62%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 52% 58%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 68% 55%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 82% 52%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 95% 62%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 15% 78%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 32% 85%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 50% 88%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 65% 92%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 80% 95%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 95% 85%, rgba(255,255,255,0.8), transparent);
          background-size: 100% 100%;
          animation: twinkle-medium 6s ease-in-out infinite;
        }

        @keyframes twinkle-bright {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes twinkle-medium {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
