'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import CategorySelector from '@/components/CategorySelector';
import YaoSlider from '@/components/YaoSlider';
import QuestionSearch from '@/components/QuestionSearch';
import QuestionSuggestion from '@/components/QuestionSuggestion';
import PopularQuestions from '@/components/PopularQuestions';

// 9개 대분류
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

function DivinationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 초기값 가져오기
  const initialCategory = Number(searchParams.get('category')) || 1;
  const isQuickMode = searchParams.get('quick') === 'true';

  // 상태
  const [majorCategory, setMajorCategory] = useState(initialCategory);
  const [subCategory, setSubCategory] = useState<number | null>(null);
  const [yaoPosition, setYaoPosition] = useState(1);
  const [isYang, setIsYang] = useState(true);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // 빠른 모드일 경우 자동 진행
  useEffect(() => {
    if (isQuickMode) {
      // 랜덤 효 선택
      setYaoPosition(Math.floor(Math.random() * 6) + 1);
      setIsYang(Math.random() > 0.5);
    }
  }, [isQuickMode]);

  // AI 카테고리 추천 (질문 분석)
  useEffect(() => {
    if (question.length > 5) {
      // 간단한 키워드 매칭 (실제로는 API 호출)
      const keywords: Record<string, { major: number; text: string }> = {
        '돈': { major: 1, text: '재물 카테고리 추천' },
        '주식': { major: 1, text: '재물-주식/증권 추천' },
        '코인': { major: 1, text: '재물-코인/가상자산 추천' },
        '비트코인': { major: 1, text: '재물-코인/가상자산 추천' },
        '이직': { major: 2, text: '직업-이직 추천' },
        '취업': { major: 2, text: '직업-취업/면접 추천' },
        '승진': { major: 2, text: '직업-승진 추천' },
        '시험': { major: 3, text: '학업 카테고리 추천' },
        '수능': { major: 3, text: '학업-수능/입시 추천' },
        '연애': { major: 4, text: '연애 카테고리 추천' },
        '썸': { major: 4, text: '연애-호감/썸 추천' },
        '고백': { major: 4, text: '연애-고백 추천' },
        '결혼': { major: 4, text: '연애-결혼 추천' },
        '건강': { major: 6, text: '건강 카테고리 추천' },
        '다이어트': { major: 6, text: '건강-다이어트 추천' },
        '여행': { major: 7, text: '취미-여행 추천' },
        '이사': { major: 8, text: '운명-이사 추천' },
      };

      for (const [keyword, rec] of Object.entries(keywords)) {
        if (question.includes(keyword)) {
          setAiRecommendation(`🤖 추천: ${rec.text} (95%)`);
          setMajorCategory(rec.major);
          return;
        }
      }
      setAiRecommendation(null);
    } else {
      setAiRecommendation(null);
    }
  }, [question]);

  // 점괘 요청
  const handleSubmit = async () => {
    if (!question.trim() && !isQuickMode) {
      alert('질문을 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      // API 호출 (실제 연동 시)
      // const response = await fetch('/api/divination', { ... });

      // 임시: 결과 페이지로 이동
      const resultId = Date.now().toString();
      const params = new URLSearchParams({
        major: majorCategory.toString(),
        sub: (subCategory || 1).toString(),
        yao: yaoPosition.toString(),
        yang: isYang ? '1' : '0',
        question: encodeURIComponent(question),
      });

      router.push(`/divination/result/${resultId}?${params.toString()}`);
    } catch (error) {
      console.error('Divination error:', error);
      alert('점괘 요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const majorInfo = MAJOR_CATEGORIES.find((m) => m.id === majorCategory);

  return (
    <div className="min-h-screen bg-dark-stars">
      <Header />

      <main className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* 페이지 제목 */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white">🔮 점괘 보기</h1>
          <p className="text-sm text-gray-400 mt-1">
            카테고리와 효를 선택하고 질문을 입력하세요
          </p>
        </div>

        <div className="space-y-6">
          {/* 질문 검색 */}
          <div className="card-fortune rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              &#x1F50D; 질문 검색
            </label>
            <QuestionSearch
              onSelect={(q) => {
                setQuestion(q.text);
                // 카테고리도 자동 설정
                if (q.major_category_name) {
                  const cat = MAJOR_CATEGORIES.find(c => c.name === q.major_category_name);
                  if (cat) setMajorCategory(cat.id);
                }
              }}
              placeholder="9,500개 질문에서 검색..."
              categoryFilter={majorCategory}
            />
          </div>

          {/* 질문 입력 */}
          <div className="card-fortune rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              &#x1F4AC; 질문 입력
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
              placeholder="예: 이번 주 비트코인 사도 될까요?"
              className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 outline-none resize-none transition text-white placeholder-gray-500"
              rows={3}
            />
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-gray-500">&#x1F4A1; 구체적으로 질문할수록 정확해요</span>
              <span className="text-gray-500">{question.length}/100</span>
            </div>

            {/* AI 추천 */}
            {aiRecommendation && (
              <div className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">
                {aiRecommendation}
              </div>
            )}

            {/* 질문 제안 (입력 중) */}
            <QuestionSuggestion
              userInput={question}
              categoryId={majorCategory}
              onSelect={(q) => setQuestion(q.text)}
            />
          </div>

          {/* 인기 질문 (카테고리 선택 시) */}
          {majorCategory && (
            <PopularQuestions
              categoryId={majorCategory}
              categoryName={majorInfo?.name || ''}
              onSelect={(q) => setQuestion(q.text)}
            />
          )}

          {/* 카테고리 선택 */}
          <div className="card-fortune rounded-2xl p-5">
            <CategorySelector
              selectedMajor={majorCategory}
              selectedSub={subCategory}
              onMajorChange={setMajorCategory}
              onSubChange={setSubCategory}
            />
          </div>

          {/* 효 선택 */}
          <div className="card-fortune rounded-2xl p-5">
            <YaoSlider
              value={yaoPosition}
              onChange={setYaoPosition}
              isYang={isYang}
              onYinYangChange={setIsYang}
            />
          </div>

          {/* 요약 */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">📋 선택 요약</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white">
                {majorInfo?.emoji} {majorInfo?.name}
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white">
                {isYang ? '양효' : '음효'} {yaoPosition}효
              </span>
              {question && (
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-400 truncate max-w-[200px]">
                  &ldquo;{question.slice(0, 20)}...&rdquo;
                </span>
              )}
            </div>
          </div>

          {/* 점치기 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`
              w-full py-4 rounded-xl font-bold text-lg
              flex items-center justify-center gap-2
              transition-all duration-300
              ${
                loading
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 text-amber-300'
              }
            `}
          >
            {loading ? (
              <>
                <span className="animate-spin">☯️</span>
                <span>점을 치는 중...</span>
              </>
            ) : (
              <>
                <span>🔮</span>
                <span>점 치기</span>
              </>
            )}
          </button>
        </div>

        {/* 안내 */}
        <p className="text-xs text-center text-gray-500 mt-6">
          시초 49개로 점을 칩니다. 전통 주역 점법을 디지털로 재현했습니다.
        </p>
      </main>
    </div>
  );
}

export default function DivinationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-stars flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-spin-slow inline-block">☯️</span>
          <p className="text-gray-400 mt-2">로딩 중...</p>
        </div>
      </div>
    }>
      <DivinationContent />
    </Suspense>
  );
}
