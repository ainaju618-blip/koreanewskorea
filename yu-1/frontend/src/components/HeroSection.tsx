'use client';

import { useState, useEffect, useRef } from 'react';
import { getLayoutStyleById, LAYOUT_STYLE_STORAGE_KEY, type HeroLayoutStyle } from '@/types/layoutStyles';
import HexagramDisplay from './HexagramDisplay';

// API 기본 URL
const API_BASE = 'http://localhost:8000';

// 간단한 음력 변환 (실제 서비스에서는 API 또는 라이브러리 사용 권장)
const getLunarDate = (date: Date): string => {
  const lunarData: Record<string, string> = {
    '2026-1-1': '11월 12일',
    '2026-1-2': '11월 13일',
    '2026-1-3': '11월 14일',
  };
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return lunarData[key] || '11월 12일';
};

interface TodayFortuneProps {
  onQuickFortune?: () => void;
}

// 질문 기반 점괘 결과 타입
interface QuestionDivinationResult {
  matched_category: {
    major_id: number;
    major_name: string;
    sub_id: number;
    sub_name: string;
    confidence: number;
  };
  divination_result: {
    hexagram: {
      number: number;
      name_kr: string;
      name_hanja: string;
      name_full: string;
    };
    yao: {
      position: number;
      name: string;
      text_hanja: string;
      text_kr: string;
    };
    interpretation: string;
    fortune_score: number;
    fortune_category: string;
    keywords: string[];
    action_guide: string;
    caution: string;
  };
}

// 오늘의 운세 API 응답 타입
interface TodayFortuneData {
  hexagram_number: number;
  hexagram_name: string;
  hexagram_hanja: string;
  hexagram_symbol: string;
  yao_position: number;
  yao_name: string;
  text_hanja: string;
  text_kr: string;
  interpretation: string;
  fortune_score: number;
  fortune_category: string;
  keywords: string[];
  gua_ci: string;
  luck_number: number;
  luck_name: string;
  // 일간운세 전용 필드 (1+2 구조)
  daily_headline: string;
  daily_body: string;
}

// 효 위치를 효 이름으로 변환
const getYaoDisplayName = (position: number): string => {
  const names = ['초효', '2효', '3효', '4효', '5효', '상효'];
  return names[position - 1] || '초효';
};

export default function HeroSection({ onQuickFortune }: TodayFortuneProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFortune, setShowFortune] = useState(true);
  const [fortune, setFortune] = useState<TodayFortuneData | null>(null);
  const [isLoadingFortune, setIsLoadingFortune] = useState(true);
  const [layoutStyle, setLayoutStyle] = useState<HeroLayoutStyle | null>(null);
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>('/videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4');
  const videoRef = useRef<HTMLVideoElement>(null);

  // 질문 기반 점괘 상태
  const [questionResult, setQuestionResult] = useState<QuestionDivinationResult | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  // 질문으로 점괘 요청
  const handleQuestionSubmit = async () => {
    if (!question.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }

    setIsLoadingQuestion(true);

    // 최소 표시 시간: 3-5초 랜덤
    const minDisplayTime = 3000 + Math.random() * 2000;
    const startTime = Date.now();

    try {
      const response = await fetch(`${API_BASE}/api/divination/cast-by-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          period: 'daily'
        })
      });

      if (response.ok) {
        const data: QuestionDivinationResult = await response.json();

        // 최소 표시 시간까지 대기
        const elapsed = Date.now() - startTime;
        const remainingTime = minDisplayTime - elapsed;
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        setQuestionResult(data);
        setShowFortune(false); // 오늘의 운세 숨기기
      } else {
        alert('점괘를 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('점괘 요청 실패:', error);
      alert('서버 연결에 실패했습니다.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  useEffect(() => {
    setIsLoaded(true);

    // localStorage에서 저장된 스타일 불러오기
    const savedStyleId = localStorage.getItem(LAYOUT_STYLE_STORAGE_KEY);
    const style = getLayoutStyleById(savedStyleId || 'classic-mystical');
    setLayoutStyle(style);

    // 히어로 영상 설정 불러오기
    const fetchHeroVideo = async () => {
      try {
        // 먼저 localStorage 확인 (빠른 로드)
        const cachedVideo = localStorage.getItem('heroVideo');

        // API에서 설정 가져오기
        const response = await fetch(`${API_BASE}/api/settings/hero-video`);
        if (response.ok) {
          const data = await response.json();
          if (data.video) {
            const videoUrl = `${API_BASE}/api/settings/media/file/${data.video}`;
            setHeroVideoUrl(videoUrl);
            localStorage.setItem('heroVideo', data.video);
          }
        } else if (cachedVideo) {
          // API 실패 시 캐시 사용
          setHeroVideoUrl(`${API_BASE}/api/settings/media/file/${cachedVideo}`);
        }
      } catch (error) {
        console.log('영상 설정 로드 실패, 기본 영상 사용:', error);
        // 기본 영상 유지
      }
    };

    fetchHeroVideo();

    // 영상 자동재생 보장
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // 자동재생 실패 시 무시 (일부 브라우저 정책)
      });
    }

    // 오늘의 운세 API 호출
    const fetchTodayFortune = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/divination/today`);
        if (response.ok) {
          const data: TodayFortuneData = await response.json();
          setFortune(data);
        }
      } catch (error) {
        console.error('오늘의 운세 로드 실패:', error);
      } finally {
        setIsLoadingFortune(false);
      }
    };

    fetchTodayFortune();
  }, []);

  // 스타일이 로드되지 않았으면 기본 스타일 사용
  const style = layoutStyle || getLayoutStyleById('classic-mystical');

  return (
    <section className="space-y-4">
      {/* 🎬 영상 배경 - 독립 영역 */}
      <div className="relative overflow-hidden rounded-3xl aspect-video">
        <video
          ref={videoRef}
          key={heroVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="/videos/poster.jpg"
          src={heroVideoUrl}
        />
        {/* 하단 그라데이션만 */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900 to-transparent" />

        {/* 자막 - 떠다니는 텍스트 (명조체) */}
        <div className={`absolute inset-x-0 bottom-2 flex justify-center transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <p className="animate-floating font-serif text-sm text-white/90 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            3천년 역사 · 우주의 신비로 <span className="font-bold text-white">하늘의 뜻</span>을 구하다
          </p>
        </div>
      </div>

      {/* 오늘의 운세 카드 (클릭 시 표시) - 영상 바로 아래 */}
      {showFortune && (
        <div className={`bg-black/40 border border-white/10 ${style.fortuneCard.borderRadius} ${style.fortuneCard.padding} animate-in fade-in zoom-in duration-500`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-amber-300">🎯 오늘의 운세</span>
            <span className="text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded-full border border-amber-400/30">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              <span className="text-amber-300/70 ml-1">(음 {getLunarDate(new Date())})</span>
            </span>
          </div>

          {isLoadingFortune ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="animate-spin text-4xl">☯️</div>
            </div>
          ) : fortune ? (
            <div className="space-y-3">
              {/* 영역 1+2: 괘 + 정보 (가로 배치) */}
              <div className="flex items-stretch gap-3">
                {/* ① 괘 영역 */}
                <div className="relative rounded-xl p-4 pt-6 border border-amber-500/30 flex flex-col items-center justify-center">
                  <span className="absolute -top-[5px] left-3 px-2 text-xs text-amber-300 font-medium bg-black/40">득괘</span>
                  <HexagramDisplay
                    hexagramNumber={fortune.hexagram_number}
                    highlightYao={fortune.yao_position}
                    size="lg"
                    showLabels={false}
                  />
                </div>

                {/* ② 정보 영역 */}
                <div className="flex-1 rounded-xl p-4 border border-blue-500/30 flex flex-col justify-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {fortune.hexagram_name}
                    <span className="text-amber-400">({fortune.hexagram_hanja})</span>
                    <span className="text-sm text-amber-300 font-normal">✨ {getYaoDisplayName(fortune.yao_position)}</span>
                  </h2>
                  <p className="text-lg text-gray-300 mt-3">{fortune.text_kr}</p>
                </div>
              </div>

              {/* ③ 해석 영역 */}
              <div className="rounded-xl p-5 border border-green-500/30">
                <span className="text-xs text-green-300/80 font-medium">해석</span>
                {fortune.daily_headline && (
                  <h3 className="text-lg font-bold text-amber-300 text-center mb-3 mt-2">
                    {fortune.daily_headline}
                  </h3>
                )}
                <p className="text-sm text-gray-300 text-center leading-relaxed">
                  {fortune.daily_body || fortune.interpretation}
                </p>
              </div>

              {/* ④ 키워드 영역 */}
              {fortune.keywords.length > 0 && (
                <div className="rounded-xl p-4 border border-purple-500/30">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {fortune.keywords.map((keyword, idx) => (
                      <span key={idx} className="text-xs px-3 py-1.5 bg-white/10 text-gray-300 rounded-full border border-white/20">
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              운세를 불러올 수 없습니다
            </div>
          )}
        </div>
      )}

      {/* 질문 입력 */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💬</span>
          <span className="text-white font-medium">질문 입력</span>
        </div>

        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full h-24 bg-black/30 border border-white/10 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          {!isFocused && !question && (
            <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
              <p>예: 이번 달 취업 면접이 잘 될까요?</p>
              <p className="mt-1">💡 구체적으로 질문할수록 정확해요.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">{question.length}/100</span>
          <button
            onClick={handleQuestionSubmit}
            disabled={isLoadingQuestion}
            className="px-6 py-2 bg-black/30 text-amber-300 font-bold rounded-xl border border-white/10 hover:bg-black/50 hover:border-amber-500/30 transition-all duration-300 disabled:opacity-50"
          >
            🔮 응답받기
          </button>
        </div>
      </div>

      {/* 점괘 로딩 애니메이션 */}
      {isLoadingQuestion && (
        <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-8 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            {/* 회전하는 음양 아이콘 */}
            <div className="relative w-32 h-32">
              {/* 외곽 원 효과 */}
              <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-ping" />
              <div className="absolute inset-4 border-4 border-pink-500/50 rounded-full animate-pulse" />

              {/* 음양 이모지 - 빠른 회전 애니메이션 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl animate-spin-fast drop-shadow-glow">☯️</span>
              </div>
            </div>

            {/* 상태 텍스트 */}
            <p className="text-purple-300 text-lg font-medium">점괘를 뽑는 중...</p>
            <p className="text-xs text-purple-400">시초 49개로 점을 치고 있습니다...</p>
          </div>

          {/* CSS 애니메이션 */}
          <style jsx>{`
            @keyframes spin-fast {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .animate-spin-fast {
              animation: spin-fast 0.8s linear infinite;
            }
            .drop-shadow-glow {
              filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.8))
                      drop-shadow(0 0 20px rgba(251, 191, 36, 0.6));
            }
          `}</style>
        </div>
      )}

      {/* 질문 기반 점괘 결과 */}
      {questionResult && (
        <div className="bg-black/40 border border-amber-500/30 rounded-2xl p-5 animate-in fade-in zoom-in duration-500">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-amber-300">🎯 질문에 대한 점괘</span>
            <button
              onClick={() => {
                setQuestionResult(null);
                setShowFortune(true);
                setQuestion('');
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              ✕ 닫기
            </button>
          </div>

          {/* 질문 표시 */}
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-sm text-gray-300">"{question}"</p>
          </div>

          {/* 괘 + 정보 */}
          <div className="flex items-stretch gap-3 mb-4">
            <div className="relative rounded-xl p-4 pt-6 border border-amber-500/30 flex flex-col items-center justify-center">
              <span className="absolute -top-[5px] left-3 px-2 text-xs text-amber-300 font-medium bg-black/40">득괘</span>
              <HexagramDisplay
                hexagramNumber={questionResult.divination_result.hexagram.number}
                highlightYao={questionResult.divination_result.yao.position}
                size="lg"
                showLabels={false}
              />
            </div>

            <div className="flex-1 rounded-xl p-4 border border-blue-500/30 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {questionResult.divination_result.hexagram.name_full}
                <span className="text-amber-400">({questionResult.divination_result.hexagram.name_hanja})</span>
                <span className="text-sm text-amber-300 font-normal">✨ {getYaoDisplayName(questionResult.divination_result.yao.position)}</span>
              </h2>
              <p className="text-sm text-gray-400 mt-2">{questionResult.divination_result.yao.text_kr}</p>
            </div>
          </div>

          {/* 해석 */}
          <div className="rounded-xl p-5 border border-green-500/30 mb-4">
            <span className="text-xs text-green-300/80 font-medium">해석</span>
            <p className="text-sm text-gray-300 leading-relaxed mt-2">
              {questionResult.divination_result.interpretation}
            </p>
          </div>

          {/* 키워드 */}
          {questionResult.divination_result.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {questionResult.divination_result.keywords.map((keyword, idx) => (
                <span key={idx} className="text-xs px-3 py-1.5 bg-white/10 text-gray-300 rounded-full border border-white/20">
                  #{keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 면책 조항 */}
      <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          ⚠️ <span className="text-gray-400">면책 고지</span><br />
          본 서비스의 모든 점괘 결과는 <span className="text-amber-400/80">오락 및 참고 목적</span>으로만 제공됩니다.<br />
          <span className="font-medium text-gray-400">코리아NEWS</span>는 점괘 결과에 따른 어떠한 결정이나 행동에 대해<br />
          <span className="text-red-400/80">법적 책임을 지지 않습니다.</span> 중요한 결정은 전문가와 상담하세요.
        </p>
      </div>

    </section>
  );
}
