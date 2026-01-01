'use client';

import { useState, useEffect } from 'react';
import { castDivination, DivinationResponse, healthCheck } from '@/lib/api';

// 점술 종류 (베타 준비 중 표시)
const DIVINATION_TYPES = [
  { id: 'iching', name: '주역', sub: '64괘 384효', emoji: '☯️', available: true },
  { id: 'saju', name: '사주', sub: '베타 준비 중', emoji: '🏛️', available: false },
  { id: 'tarot', name: '타로', sub: '베타 준비 중', emoji: '🃏', available: false },
  { id: 'taja', name: '타자', sub: '베타 준비 중', emoji: '🐉', available: false },
];

// 기간
const PERIODS = [
  { id: 'daily', name: '일간', sub: 'TODAY', emoji: '📅' },
  { id: 'weekly', name: '주간', sub: 'WEEK', emoji: '📆' },
  { id: 'monthly', name: '월간', sub: 'MONTH', emoji: '🗓️' },
  { id: 'yearly', name: '연간', sub: 'YEAR', emoji: '🎊' },
];

// 대분류
const CATEGORIES = [
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

// 에러 메시지 매핑
const ERROR_MESSAGES: Record<string, string> = {
  'Failed to fetch': '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
  'Network Error': '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
  '500': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  '503': '서비스가 일시적으로 중단되었습니다.',
  'timeout': '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  'default': '점술 요청에 실패했습니다. 다시 시도해주세요.',
};

// 에러 컴포넌트
function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
      <p className="text-red-300 mb-2">⚠️ {message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-500/30 rounded-lg text-sm hover:bg-red-500/50 transition"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

// 서버 상태 표시
function ServerStatus({ isOnline }: { isOnline: boolean | null }) {
  if (isOnline === null) return null;

  return (
    <div className={`text-xs flex items-center gap-1 justify-center ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
      {isOnline ? '서버 정상' : '서버 점검 중'}
    </div>
  );
}

// 폴백 결과 (서버 오류 시)
const FALLBACK_RESULT: DivinationResponse = {
  hexagram: {
    number: 1,
    name_kr: '건괘',
    name_hanja: '乾',
    name_full: '건위천',
  },
  yao: {
    position: 1,
    name: '초구',
    text_hanja: '潛龍勿用',
    text_kr: '잠긴 용은 쓰지 말라',
  },
  interpretation: '지금은 때를 기다릴 때입니다. 섣불리 움직이지 말고 내면의 힘을 기르세요. 좋은 기회가 반드시 찾아올 것입니다.',
  fortune_score: 50,
  fortune_category: '보통',
  action_guide: '인내하며 준비하세요',
  caution: '성급한 행동은 금물',
  keywords: ['인내', '준비', '잠재력'],
  matched_category: '기타',
  changing_lines: [],
  transformed_hexagram: null,
};

// 이괘(64괘) 심볼 컴포넌트 - 6효 표시
function HexagramSymbol({ number, size = 'md' }: { number: number; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  // 64괘의 6효 패턴 (1=양효, 0=음효, 아래→위 순서)
  const HEXAGRAM_PATTERNS: Record<number, number[]> = {
    1: [1,1,1,1,1,1],   // 건 ䷀
    2: [0,0,0,0,0,0],   // 곤 ䷁
    3: [1,0,0,0,1,0],   // 준 ䷂
    4: [0,1,0,0,0,1],   // 몽 ䷃
    5: [1,1,1,0,1,0],   // 수 ䷄
    6: [0,1,0,1,1,1],   // 송 ䷅
    7: [0,1,0,0,0,0],   // 사 ䷆
    8: [0,0,0,0,1,0],   // 비 ䷇
    9: [1,1,1,0,1,1],   // 소축 ䷈
    10: [1,1,0,1,1,1],  // 이 ䷉
    11: [1,1,1,0,0,0],  // 태 ䷊
    12: [0,0,0,1,1,1],  // 비 ䷋
    13: [1,0,1,1,1,1],  // 동인 ䷌
    14: [1,1,1,1,0,1],  // 대유 ䷍
    15: [0,0,1,0,0,0],  // 겸 ䷎
    16: [0,0,0,1,0,0],  // 예 ䷏
    17: [1,0,0,1,1,0],  // 수 ䷐
    18: [0,1,1,0,0,1],  // 고 ䷑
    19: [1,1,0,0,0,0],  // 임 ䷒
    20: [0,0,0,0,1,1],  // 관 ䷓
    21: [1,0,0,1,0,1],  // 서합 ䷔
    22: [1,0,1,0,0,1],  // 비 ䷕
    23: [0,0,0,0,0,1],  // 박 ䷖
    24: [1,0,0,0,0,0],  // 복 ䷗
    25: [1,0,0,1,1,1],  // 무망 ䷘
    26: [1,1,1,0,0,1],  // 대축 ䷙
    27: [1,0,0,0,0,1],  // 이 ䷚
    28: [0,1,1,1,1,0],  // 대과 ䷛
    29: [0,1,0,0,1,0],  // 감 ䷜
    30: [1,0,1,1,0,1],  // 리 ䷝
    31: [0,0,1,1,1,0],  // 함 ䷞
    32: [0,1,1,1,0,0],  // 항 ䷟
    33: [0,0,1,1,1,1],  // 돈 ䷠
    34: [1,1,1,1,0,0],  // 대장 ䷡
    35: [0,0,0,1,0,1],  // 진 ䷢
    36: [1,0,1,0,0,0],  // 명이 ䷣
    37: [1,0,1,0,1,1],  // 가인 ䷤
    38: [1,1,0,1,0,1],  // 규 ䷥
    39: [0,0,1,0,1,0],  // 건 ䷦
    40: [0,1,0,1,0,0],  // 해 ䷧
    41: [1,1,0,0,0,1],  // 손 ䷨
    42: [1,0,0,0,1,1],  // 익 ䷩
    43: [1,1,1,1,1,0],  // 쾌 ䷪
    44: [0,1,1,1,1,1],  // 구 ䷫
    45: [0,0,0,1,1,0],  // 췌 ䷬
    46: [0,1,1,0,0,0],  // 승 ䷭
    47: [0,1,0,1,1,0],  // 곤 ䷮
    48: [0,1,1,0,1,0],  // 정 ䷯
    49: [1,0,1,1,1,0],  // 혁 ䷰
    50: [0,1,1,1,0,1],  // 정 ䷱
    51: [1,0,0,1,0,0],  // 진 ䷲
    52: [0,0,1,0,0,1],  // 간 ䷳
    53: [0,0,1,0,1,1],  // 점 ䷴
    54: [1,1,0,1,0,0],  // 귀매 ䷵
    55: [1,0,1,1,0,0],  // 풍 ䷶
    56: [0,0,1,1,0,1],  // 려 ䷷
    57: [0,1,1,0,1,1],  // 손 ䷸
    58: [1,1,0,1,1,0],  // 태 ䷹
    59: [0,1,0,0,1,1],  // 환 ䷺
    60: [1,1,0,0,1,0],  // 절 ䷻
    61: [1,1,0,0,1,1],  // 중부 ䷼
    62: [0,0,1,1,0,0],  // 소과 ䷽
    63: [1,0,1,0,1,0],  // 기제 ䷾
    64: [0,1,0,1,0,1],  // 미제 ䷿
  };

  const pattern = HEXAGRAM_PATTERNS[number] || [1,1,1,1,1,1];
  const sizeClass = {
    sm: 'w-16 gap-2',
    md: 'w-24 gap-3',
    lg: 'w-32 gap-4',
    xl: 'w-40 gap-5',  // 신규: 160px 너비
  }[size];
  const lineHeight = {
    sm: 'h-8',      // 20px → 32px (1.5배)
    md: 'h-11',     // 28px → 44px (1.5배)
    lg: 'h-[60px]', // 40px → 60px (1.5배)
    xl: 'h-[72px]', // 48px → 72px (1.5배)
  }[size];

  return (
    <div className={`flex flex-col-reverse ${sizeClass}`}>
      {pattern.map((yao, index) => (
        <div key={index} className={`flex justify-center gap-1 ${lineHeight}`}>
          {yao === 1 ? (
            // 양효 (━━━━━━)
            <div className="flex-1 bg-white rounded-sm" />
          ) : (
            // 음효 (━━ ━━)
            <>
              <div className="flex-1 bg-white rounded-sm" />
              <div className="w-2" />
              <div className="flex-1 bg-white rounded-sm" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// 3초 회전 애니메이션 컴포넌트
function DivinationAnimation({
  onComplete,
  loading,
  retryCount,
}: {
  onComplete: () => void;
  loading: boolean;
  retryCount: number;
}) {
  const [phase, setPhase] = useState<'spinning' | 'reveal'>('spinning');
  const [showHexagram, setShowHexagram] = useState(false);

  useEffect(() => {
    // 3초 후 결과 요청
    const spinTimer = setTimeout(() => {
      setPhase('reveal');
      onComplete();
    }, 3000);

    return () => clearTimeout(spinTimer);
  }, [onComplete]);

  // 로딩이 완료되면 이괘 표시
  useEffect(() => {
    if (!loading && phase === 'reveal') {
      // 약간의 딜레이 후 탁 나타나기
      const revealTimer = setTimeout(() => {
        setShowHexagram(true);
      }, 100);
      return () => clearTimeout(revealTimer);
    }
  }, [loading, phase]);

  return (
    <div className="text-center py-12 space-y-6">
      {/* 회전하는 음양 아이콘 */}
      <div className="relative w-40 h-40 mx-auto">
        {/* 외곽 원 효과 */}
        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-ping" />
        <div className="absolute inset-4 border-4 border-pink-500/50 rounded-full animate-pulse" />

        {/* 음양 아이콘 - 회전 애니메이션 */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            showHexagram ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <img
            src="/icon-transparent.svg"
            alt="음양"
            className="w-24 h-24 animate-spin-divination drop-shadow-glow"
          />
        </div>

        {/* 이괘 - 탁 나타나기 */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
            showHexagram
              ? 'scale-100 opacity-100'
              : 'scale-150 opacity-0'
          }`}
        >
          <span className="text-6xl">🔮</span>
        </div>
      </div>

      {/* 상태 텍스트 */}
      <p className="text-purple-300">
        {phase === 'spinning' ? '점괘를 뽑는 중...' : loading ? '해석하는 중...' : '결과가 나왔습니다!'}
      </p>

      {retryCount > 0 && (
        <p className="text-yellow-400 text-sm">재시도 중... ({retryCount}/3)</p>
      )}

      {phase === 'spinning' && (
        <p className="text-xs text-purple-400">시초 49개로 점을 치고 있습니다...</p>
      )}

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes spin-divination {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(720deg); }
          50% { transform: rotate(720deg); }
          75% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-spin-divination {
          animation: spin-divination 1.5s ease-in-out infinite;
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 15px rgba(124, 58, 237, 0.6))
                  drop-shadow(0 0 30px rgba(251, 191, 36, 0.4));
        }
      `}</style>
    </div>
  );
}

export default function DivinationFlow() {
  const [step, setStep] = useState(0);
  const [divinationType, setDivinationType] = useState('iching');
  const [period, setPeriod] = useState('daily');
  const [category, setCategory] = useState(1);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DivinationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 서버 상태 체크
  useEffect(() => {
    const checkServer = async () => {
      try {
        const status = await healthCheck();
        setServerOnline(status.status === 'healthy');
      } catch {
        setServerOnline(false);
      }
    };

    checkServer();
    // 30초마다 재확인
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      for (const [key, msg] of Object.entries(ERROR_MESSAGES)) {
        if (err.message.includes(key)) {
          return msg;
        }
      }
    }
    return ERROR_MESSAGES.default;
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError('질문을 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setUsedFallback(false);

    try {
      const response = await castDivination({
        divination_type: divinationType,
        period,
        main_category: category,
        question: question.trim(),
      });
      setResult(response);
      setStep(5);
      setRetryCount(0);
    } catch (err) {
      console.error('Divination error:', err);

      // 3회까지 자동 재시도
      if (retryCount < 2) {
        setRetryCount((prev) => prev + 1);
        setTimeout(handleSubmit, 1000); // 1초 후 재시도
        return;
      }

      // 폴백 사용
      if (serverOnline === false || retryCount >= 2) {
        setResult(FALLBACK_RESULT);
        setUsedFallback(true);
        setStep(5);
      } else {
        setError(getErrorMessage(err));
        setStep(3); // 질문 입력 단계로 돌아가기
      }
      setRetryCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDivinationTypeSelect = (typeId: string) => {
    const type = DIVINATION_TYPES.find((t) => t.id === typeId);
    if (type?.available) {
      setDivinationType(typeId);
    }
  };

  const resetFlow = () => {
    setStep(0);
    setResult(null);
    setQuestion('');
    setError(null);
    setUsedFallback(false);
    setRetryCount(0);
  };

  const getFortuneStars = (score: number) => {
    const stars = Math.round(score / 20);
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-white">
      <div className="max-w-md md:max-w-lg mx-auto p-4">
        {/* 헤더 */}
        <header className="text-center py-6">
          <h1 className="text-2xl font-bold">🔮 주역점</h1>
          <p className="text-purple-300 text-sm mt-1">주역 / 사주 / 타로 / 타자</p>
          <ServerStatus isOnline={serverOnline} />
        </header>

        {/* 진행 표시 */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-all ${
                s <= step ? 'bg-purple-400 scale-110' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* 전역 에러 표시 */}
        {error && step !== 3 && (
          <div className="mb-4">
            <ErrorBanner message={error} onRetry={resetFlow} />
          </div>
        )}

        {/* STEP 0: 점술 선택 */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">어떤 점술로 보시겠어요?</h2>
            <div className="grid grid-cols-4 gap-3">
              {DIVINATION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleDivinationTypeSelect(type.id)}
                  disabled={!type.available}
                  className={`p-4 rounded-xl flex flex-col items-center transition-all relative ${
                    !type.available
                      ? 'bg-gray-800/50 opacity-60 cursor-not-allowed'
                      : divinationType === type.id
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-105'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {!type.available && (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] px-1 rounded font-bold">
                      SOON
                    </span>
                  )}
                  <span className="text-2xl">{type.emoji}</span>
                  <span className="text-sm font-medium mt-1">{type.name}</span>
                  <span className={`text-xs ${type.available ? 'text-purple-300' : 'text-gray-500'}`}>
                    {type.sub}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold mt-4 hover:opacity-90 transition"
            >
              다음 →
            </button>
          </div>
        )}

        {/* STEP 1: 기간 선택 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">언제에 대해 알고 싶으세요?</h2>
            <div className="grid grid-cols-4 gap-3">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`p-4 rounded-xl flex flex-col items-center transition-all ${
                    period === p.id
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-105'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-sm font-medium mt-1">{p.name}</span>
                  <span className="text-xs text-purple-300">{p.sub}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition"
              >
                ← 이전
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:opacity-90 transition"
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 대분류 선택 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">어떤 분야가 궁금하세요?</h2>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-xl flex flex-col items-center transition-all ${
                    category === cat.id
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-105'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm font-medium mt-1">{cat.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition"
              >
                ← 이전
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:opacity-90 transition"
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 질문 입력 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">질문을 입력해주세요</h2>
            <div className="bg-white/10 rounded-xl p-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
                placeholder="예: 이번 주 비트코인 사도 될까요?"
                className="w-full bg-transparent border-none outline-none resize-none text-white placeholder-purple-300 h-24"
              />
              <div className="flex justify-between text-sm text-purple-300">
                <span>💡 구체적으로 질문할수록 정확해요</span>
                <span>{question.length}/100</span>
              </div>
            </div>
            {error && (
              <ErrorBanner message={error} onRetry={() => setError(null)} />
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition"
              >
                ← 이전
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!question.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                점 치기 🔮
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: 로딩 - 3초 회전 후 결과 */}
        {step === 4 && (
          <DivinationAnimation
            onComplete={handleSubmit}
            loading={loading}
            retryCount={retryCount}
          />
        )}

        {/* STEP 5: 결과 - 탁 나타나기 */}
        {step === 5 && result && (
          <div className="space-y-4 animate-reveal-result">
            {/* 폴백 경고 */}
            {usedFallback && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 text-center text-sm">
                <span className="text-yellow-300">
                  ⚠️ 서버 연결 오류로 기본 결과를 표시합니다
                </span>
              </div>
            )}

            {/* 괘 정보 - 탁 효과 */}
            <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 rounded-2xl p-4 text-center animate-pop-in">
              {/* 이괘 심볼 - 탁 나타나기 */}
              <div className="flex justify-center mb-4 animate-bounce-once">
                <div className="bg-black/50 rounded-xl p-2 border border-white/20">
                  <HexagramSymbol number={result.hexagram.number} size="xl" />
                </div>
              </div>
              <h2 className="text-2xl font-bold animate-fade-in-up">
                {result.hexagram.name_full}({result.hexagram.name_hanja})
              </h2>
              <p className="text-purple-300 animate-fade-in-up delay-100">{result.yao.name}</p>
            </div>

            {/* 효사 원문 */}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-center text-purple-300 text-sm">{result.yao.text_hanja}</p>
              <p className="text-center mt-1">{result.yao.text_kr}</p>
            </div>

            {/* 해석 */}
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-lg leading-relaxed">{result.interpretation}</p>
            </div>

            {/* 주의사항 (있을 경우) */}
            {result.caution && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                <p className="text-sm text-orange-300">⚠️ {result.caution}</p>
              </div>
            )}

            {/* 운세 점수 */}
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-sm text-purple-300">운세 점수</p>
              <p className="text-2xl">{getFortuneStars(result.fortune_score)}</p>
              <p className="text-sm text-purple-400">{result.fortune_score}/100</p>
            </div>

            {/* 키워드 */}
            <div className="flex flex-wrap gap-2 justify-center">
              {result.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-purple-500/30 rounded-full text-sm"
                >
                  #{keyword}
                </span>
              ))}
            </div>

            {/* 면책 조항 */}
            <p className="text-xs text-center text-purple-400/60 mt-4">
              본 서비스는 오락 및 참고 목적으로 제공됩니다.
              <br />
              중요한 결정은 전문가와 상담하세요.
            </p>

            {/* 버튼들 */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: '주역 운세 결과',
                      text: `${result.hexagram.name_full} - ${result.interpretation}`,
                    });
                  } else {
                    // 폴백: 클립보드 복사
                    navigator.clipboard.writeText(
                      `${result.hexagram.name_full} - ${result.interpretation}`
                    );
                    alert('결과가 복사되었습니다!');
                  }
                }}
                className="py-3 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition"
              >
                💬 공유
              </button>
              <button
                onClick={resetFlow}
                className="py-3 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition"
              >
                🔄 다시
              </button>
              <button
                onClick={() => {
                  // 로컬 스토리지에 저장
                  const saved = JSON.parse(localStorage.getItem('divination_history') || '[]');
                  saved.unshift({
                    ...result,
                    question,
                    savedAt: new Date().toISOString(),
                  });
                  localStorage.setItem('divination_history', JSON.stringify(saved.slice(0, 10)));
                  alert('저장되었습니다!');
                }}
                className="py-3 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition"
              >
                💾 저장
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
