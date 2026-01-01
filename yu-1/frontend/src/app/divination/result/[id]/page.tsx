'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Header from '@/components/Header';
import ResultCard from '@/components/ResultCard';
import { castDivination, DivinationResponse } from '@/lib/api';

const MAJOR_CATEGORIES = [
  { id: 1, name: '재물', emoji: '💰' },
  { id: 2, name: '직업', emoji: '💼' },
  { id: 3, name: '학업', emoji: '📚' },
  { id: 4, name: '연애', emoji: '💕' },
  { id: 5, name: '대인', emoji: '👥' },
  { id: 6, name: '건강', emoji: '🏥' },
  { id: 7, name: '취미', emoji: '🎮' },
  { id: 8, name: '운명', emoji: '✨' },
  { id: 9, name: '기타', emoji: '🔮' },
];

// 팔괘 심볼 매핑
const TRIGRAM_SYMBOLS: Record<number, string> = {
  0: '☷', 1: '☳', 2: '☵', 3: '☱',
  4: '☶', 5: '☲', 6: '☴', 7: '☰',
};

// 64괘 상하괘 매핑 (간략화)
const getHexagramSymbol = (hexNum: number): string => {
  const symbols: Record<number, string> = {
    1: '☰☰', 2: '☷☷', 3: '☵☳', 4: '☶☵', 5: '☵☰', 6: '☰☵',
    7: '☷☵', 8: '☵☷', 9: '☴☰', 10: '☰☱', 11: '☷☰', 12: '☰☷',
    13: '☰☲', 14: '☲☰', 15: '☷☶', 16: '☳☷', 17: '☱☳', 18: '☶☴',
    19: '☷☱', 20: '☴☷', 21: '☲☳', 22: '☶☲', 23: '☶☷', 24: '☷☳',
    25: '☰☳', 26: '☶☰', 27: '☶☳', 28: '☱☴', 29: '☵☵', 30: '☲☲',
    31: '☱☶', 32: '☳☴', 33: '☰☶', 34: '☳☰', 35: '☲☷', 36: '☷☲',
    37: '☴☲', 38: '☲☱', 39: '☵☶', 40: '☳☵', 41: '☶☱', 42: '☴☳',
    43: '☱☰', 44: '☰☴', 45: '☱☷', 46: '☷☴', 47: '☱☵', 48: '☵☴',
    49: '☱☲', 50: '☲☴', 51: '☳☳', 52: '☶☶', 53: '☴☶', 54: '☳☱',
    55: '☳☲', 56: '☲☶', 57: '☴☴', 58: '☱☱', 59: '☴☵', 60: '☵☱',
    61: '☴☱', 62: '☳☶', 63: '☵☲', 64: '☲☵',
  };
  return symbols[hexNum] || '☰☷';
};

// 로딩 단계 타입
type LoadingStep = 'preparing' | 'dividing' | 'counting' | 'interpreting' | 'complete';

function ResultContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const resultId = params.id as string;

  // URL 파라미터 파싱
  const majorId = Number(searchParams.get('major')) || 1;
  const question = decodeURIComponent(searchParams.get('question') || '');

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('preparing');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    hexagram: {
      number: number;
      name_kr: string;
      name_hanja: string;
      name_full: string;
      symbol: string;
    };
    yao: {
      position: number;
      name: string;
      text_hanja: string;
      text_kr: string;
    } | null;
    interpretation: string;
    fortune_score: number;
    fortune_category: string;
    keywords: string[];
    matched_category: string;
    caution?: string;
    changing_lines?: number[];
    transformed_hexagram?: number;
    reading_description?: string;
  } | null>(null);

  // 딜레이 함수 (점치는 느낌)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 결과 로드 (실제 API 호출 + 딜레이 효과)
  useEffect(() => {
    const loadResult = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1단계: 시초 준비 (1초)
        setLoadingStep('preparing');
        setLoadingProgress(10);
        await delay(800);

        // 2단계: 시초 나누기 (1.5초) - 랜덤 진행
        setLoadingStep('dividing');
        for (let i = 20; i <= 50; i += 10) {
          setLoadingProgress(i);
          await delay(300 + Math.random() * 200);
        }

        // 3단계: 괘상 확인 (1초)
        setLoadingStep('counting');
        setLoadingProgress(60);

        // 실제 API 호출
        const majorInfo = MAJOR_CATEGORIES.find((m) => m.id === majorId);
        const apiResult = await castDivination({
          divination_type: 'iching',
          period: 'daily',
          main_category: majorId,
          question: question || '오늘의 운세가 궁금합니다',
        });

        setLoadingProgress(80);
        await delay(500);

        // 4단계: 해석 중 (1초)
        setLoadingStep('interpreting');
        setLoadingProgress(90);
        await delay(800);

        // 결과 설정
        setLoadingProgress(100);
        setLoadingStep('complete');
        await delay(300);

        setResult({
          hexagram: {
            number: apiResult.hexagram.number,
            name_kr: apiResult.hexagram.name_kr,
            name_hanja: apiResult.hexagram.name_hanja,
            name_full: apiResult.hexagram.name_full,
            symbol: getHexagramSymbol(apiResult.hexagram.number),
          },
          yao: apiResult.yao ? {
            position: apiResult.yao.position,
            name: apiResult.yao.name,
            text_hanja: apiResult.yao.text_hanja,
            text_kr: apiResult.yao.text_kr,
          } : null,
          interpretation: apiResult.interpretation,
          fortune_score: apiResult.fortune_score,
          fortune_category: apiResult.fortune_category,
          keywords: apiResult.keywords,
          matched_category: `${majorInfo?.emoji || '🔮'} ${apiResult.matched_category}`,
          caution: apiResult.caution || undefined,
          changing_lines: apiResult.changing_lines,
          transformed_hexagram: apiResult.transformed_hexagram || undefined,
          reading_description: apiResult.action_guide || undefined,
        });

      } catch (err) {
        console.error('점괘 API 오류:', err);
        setError('점괘를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [majorId, question]);

  // 공유
  const handleShare = () => {
    if (!result) return;

    const yaoName = result.yao?.name || '괘사';
    const shareText = `🔮 주역점 점괘 결과

${result.hexagram.name_full}(${result.hexagram.name_hanja}) · ${yaoName}

"${result.interpretation}"

${result.fortune_category} (${result.fortune_score}점)

#주역점 #점괘 #운세`;

    if (navigator.share) {
      navigator.share({
        title: '주역점 점괘 결과',
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('결과가 클립보드에 복사되었습니다!');
    }
  };

  // 저장
  const handleSave = () => {
    if (!result) return;

    const saved = JSON.parse(localStorage.getItem('divination_history') || '[]');
    saved.unshift({
      id: resultId,
      ...result,
      question,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem('divination_history', JSON.stringify(saved.slice(0, 50)));
    alert('저장되었습니다! 히스토리에서 확인하세요.');
  };

  // 다시 하기
  const handleReset = () => {
    router.push('/divination');
  };

  // 로딩 단계별 메시지
  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 'preparing': return { icon: '🎋', text: '시초 49개를 준비하는 중...', sub: '전통 시초점 알고리즘 적용' };
      case 'dividing': return { icon: '✂️', text: '시초를 나누는 중...', sub: '대연지수(大衍之數) 분책(分策)' };
      case 'counting': return { icon: '📐', text: '괘상을 확인하는 중...', sub: '6효를 산출하고 있습니다' };
      case 'interpreting': return { icon: '📖', text: '효사를 해석하는 중...', sub: '384효 중 해당 효사를 찾는 중' };
      case 'complete': return { icon: '✨', text: '점괘 완료!', sub: '결과를 표시합니다' };
      default: return { icon: '☯️', text: '점을 치는 중...', sub: '' };
    }
  };

  if (loading) {
    const msg = getLoadingMessage();
    return (
      <div className="min-h-screen bg-dark-stars">
        <Header />
        <main className="relative z-10 max-w-lg mx-auto px-4 py-6">
          <div className="text-center py-16">
            {/* 로딩 애니메이션 */}
            <div className="relative w-40 h-40 mx-auto mb-8">
              {/* 외부 원 - 진행률 */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="80" cy="80" r="72"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                />
                <circle
                  cx="80" cy="80" r="72"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 72}`}
                  strokeDashoffset={`${2 * Math.PI * 72 * (1 - loadingProgress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>

              {/* 내부 원 애니메이션 */}
              <div className="absolute inset-4 border-2 border-white/10 rounded-full animate-pulse" />
              <div className="absolute inset-8 border-2 border-amber-500/20 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />

              {/* 중앙 아이콘 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl animate-spin-slow">{msg.icon}</span>
              </div>

              {/* 진행률 표시 */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                {loadingProgress}%
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{msg.text}</h2>
            <p className="text-gray-500 text-sm">{msg.sub}</p>

            {/* 진행 단계 표시 */}
            <div className="mt-8 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className={loadingStep === 'preparing' ? 'text-amber-400 font-bold' : loadingProgress >= 20 ? 'text-green-400' : ''}>
                  {loadingProgress >= 20 ? '✓' : '○'} 준비
                </span>
                <span className={loadingStep === 'dividing' ? 'text-amber-400 font-bold' : loadingProgress >= 50 ? 'text-green-400' : ''}>
                  {loadingProgress >= 50 ? '✓' : '○'} 분책
                </span>
                <span className={loadingStep === 'counting' ? 'text-amber-400 font-bold' : loadingProgress >= 80 ? 'text-green-400' : ''}>
                  {loadingProgress >= 80 ? '✓' : '○'} 괘상
                </span>
                <span className={loadingStep === 'interpreting' ? 'text-amber-400 font-bold' : loadingProgress >= 100 ? 'text-green-400' : ''}>
                  {loadingProgress >= 100 ? '✓' : '○'} 해석
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>

            {/* 시초 시각화 */}
            <div className="mt-8 flex justify-center gap-1">
              {Array.from({ length: 49 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-6 rounded-full transition-all duration-200 ${
                    i < Math.floor(loadingProgress / 2)
                      ? 'bg-amber-500'
                      : 'bg-white/10'
                  }`}
                  style={{ animationDelay: `${i * 20}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">49개 시초</p>
          </div>
        </main>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-dark-stars">
        <Header />
        <main className="relative z-10 max-w-lg mx-auto px-4 py-6 text-center">
          <div className="py-20">
            <span className="text-6xl block mb-4">😢</span>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/divination')}
              className="px-6 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 transition"
            >
              다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-dark-stars">
        <Header />
        <main className="relative z-10 max-w-lg mx-auto px-4 py-6 text-center">
          <p className="text-gray-500">결과를 불러올 수 없습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 transition"
          >
            홈으로
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-stars">
      <Header />

      <main className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* 질문 표시 */}
        {question && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500">질문</p>
            <p className="text-white font-medium">&ldquo;{question}&rdquo;</p>
          </div>
        )}

        {/* 결과 카드 */}
        <ResultCard
          hexagram={result.hexagram}
          yao={result.yao}
          interpretation={result.interpretation}
          fortune_score={result.fortune_score}
          fortune_category={result.fortune_category}
          keywords={result.keywords}
          matched_category={result.matched_category}
          caution={result.caution}
          onShare={handleShare}
          onSave={handleSave}
          onReset={handleReset}
        />
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-stars flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-spin-slow inline-block">☯️</span>
          <p className="text-gray-400 mt-2">로딩 중...</p>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
