'use client';

import { useState } from 'react';
import HexagramDisplay from '@/components/HexagramDisplay';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API 응답 타입
interface MatchedCategoryInfo {
  major_id: number;
  major_name: string;
  sub_id: number | null;
  sub_name: string | null;
  confidence: number;
}

interface SimilarQuestion {
  id: string;
  text: string;
  similarity: number;
}

interface HexagramInfo {
  number: number;
  name_kr: string;
  name_hanja: string;
  name_full: string;
}

interface YaoInfo {
  position: number;
  name: string;
  text_hanja: string;
  text_kr: string;
}

interface ReadingMethodInfo {
  reading_type: string;
  yao_position: number;
  use_transformed: boolean;
  description: string;
}

interface DivinationResult {
  hexagram: HexagramInfo;
  yao: YaoInfo;
  reading_method: ReadingMethodInfo;
  gua_ci: string | null;
  transformed_gua_ci: string | null;
  interpretation: string;
  fortune_score: number;
  fortune_category: string;
  action_guide: string | null;
  caution: string | null;
  keywords: string[];
  matched_category: string;
  changing_lines: number[];
  transformed_hexagram: number | null;
  transformed_hexagram_name: string | null;
}

interface QuestionBasedResponse {
  matched_category: MatchedCategoryInfo;
  similar_questions: SimilarQuestion[];
  divination_result: DivinationResult;
}

// 효 위치를 효 이름으로 변환
const getYaoDisplayName = (position: number): string => {
  const names = ['초효', '이효', '삼효', '사효', '오효', '상효'];
  return names[position - 1] || '초효';
};

// 점수 → 별점 변환
const getFortuneStars = (score: number): string => {
  const stars = Math.round(score / 20);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
};

export default function QuestionInputDemoPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestionBasedResponse | null>(null);

  // 예시 질문들
  const sampleQuestions = [
    '이번 달 취업 면접이 잘 될까요?',
    '올해 결혼운이 있을까요?',
    '비트코인에 투자해도 될까요?',
    '이직하는 것이 좋을까요?',
    '건강 검진 결과가 괜찮을까요?',
  ];

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError('질문을 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/divination/cast-by-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          period: 'daily',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '점술 요청 실패' }));
        throw new Error(errorData.detail || '점술 요청 실패');
      }

      const data: QuestionBasedResponse = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Divination error:', err);
      setError(err instanceof Error ? err.message : '점술 요청에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">질문 입력 데모</h1>
        <p className="text-gray-400 mb-6">질문을 입력하면 주역 점괘로 답변합니다</p>

        {/* 질문 입력 영역 */}
        {!result && (
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
            {/* 입력 헤더 */}
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <h2 className="text-lg font-medium">질문 입력</h2>
            </div>

            {/* 텍스트 입력 */}
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
                placeholder="예: 이번 달 취업 면접이 잘 될까요?"
                className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 outline-none resize-none transition text-white placeholder-gray-500"
                rows={3}
                disabled={loading}
              />
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-gray-500">💡 구체적으로 질문할수록 정확해요.</span>
                <span className="text-gray-500">{question.length}/100</span>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-center">
                <p className="text-red-300 text-sm">⚠️ {error}</p>
              </div>
            )}

            {/* 예시 질문 */}
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">예시 질문:</p>
              <div className="flex flex-wrap gap-2">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuestion(q)}
                    className="text-xs px-3 py-1.5 bg-white/5 text-gray-400 rounded-full border border-white/10 hover:bg-white/10 transition"
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              className={`
                w-full py-4 rounded-xl font-bold text-lg
                flex items-center justify-center gap-2
                transition-all duration-300
                ${loading || !question.trim()
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 text-amber-300'
                }
              `}
            >
              {loading ? (
                <>
                  <span className="animate-spin">☯️</span>
                  <span>점괘를 뽑는 중...</span>
                </>
              ) : (
                <>
                  <span>🔮</span>
                  <span>응답받기</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 결과 영역 */}
        {result && (
          <div className="space-y-4">
            {/* 질문 표시 */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-gray-400">질문</p>
              <p className="text-lg text-white mt-1">"{question}"</p>
            </div>

            {/* 카테고리 매칭 결과 */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-sm text-blue-300 mb-2">🏷️ 자동 분류</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-500/20 rounded-full text-blue-200 text-sm">
                  {result.matched_category.major_name}
                </span>
                {result.matched_category.sub_name && (
                  <>
                    <span className="text-gray-500">→</span>
                    <span className="px-3 py-1 bg-blue-500/20 rounded-full text-blue-200 text-sm">
                      {result.matched_category.sub_name}
                    </span>
                  </>
                )}
                <span className="text-xs text-blue-400 ml-auto">
                  신뢰도 {Math.round(result.matched_category.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* 괘 결과 */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-amber-300">🎯 점괘 결과</span>
                <span className="text-xs text-gray-400">
                  {result.divination_result.reading_method.description}
                </span>
              </div>

              {/* 괘 + 정보 */}
              <div className="flex items-stretch gap-4">
                {/* 괘 영역 */}
                <div className="relative rounded-xl p-4 pt-6 border border-amber-500/30 bg-amber-500/5 flex flex-col items-center justify-center">
                  <span className="absolute -top-0.5 left-3 px-2 text-xs text-amber-300 font-medium bg-slate-900">득괘</span>
                  <HexagramDisplay
                    hexagramNumber={result.divination_result.hexagram.number}
                    highlightYao={result.divination_result.yao.position}
                    size="lg"
                    showLabels={false}
                  />
                </div>

                {/* 정보 영역 */}
                <div className="flex-1 rounded-xl p-4 border border-blue-500/30 bg-blue-500/5 flex flex-col justify-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {result.divination_result.hexagram.name_full}
                    <span className="text-amber-400">({result.divination_result.hexagram.name_hanja})</span>
                  </h2>
                  <span className="text-sm text-amber-300 mt-1">
                    ✨ {getYaoDisplayName(result.divination_result.yao.position)}
                  </span>
                  <p className="text-lg text-gray-300 mt-3">{result.divination_result.yao.text_kr}</p>
                </div>
              </div>

              {/* 해석 */}
              <div className="mt-4 rounded-xl p-5 border border-green-500/30 bg-green-500/5">
                <span className="text-xs text-green-300/80 font-medium">해석</span>
                <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                  {result.divination_result.interpretation}
                </p>
              </div>

              {/* 운세 점수 */}
              <div className="mt-4 rounded-xl p-4 border border-purple-500/30 bg-purple-500/5 text-center">
                <p className="text-sm text-purple-300">운세 점수</p>
                <p className="text-2xl text-amber-300 mt-1">{getFortuneStars(result.divination_result.fortune_score)}</p>
                <p className="text-sm text-purple-400">{result.divination_result.fortune_score}/100 ({result.divination_result.fortune_category})</p>
              </div>

              {/* 행동 지침 & 주의사항 */}
              {(result.divination_result.action_guide || result.divination_result.caution) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {result.divination_result.action_guide && (
                    <div className="rounded-xl p-3 border border-emerald-500/30 bg-emerald-500/5">
                      <p className="text-xs text-emerald-300 mb-1">💡 행동 지침</p>
                      <p className="text-sm text-gray-300">{result.divination_result.action_guide}</p>
                    </div>
                  )}
                  {result.divination_result.caution && (
                    <div className="rounded-xl p-3 border border-orange-500/30 bg-orange-500/5">
                      <p className="text-xs text-orange-300 mb-1">⚠️ 주의사항</p>
                      <p className="text-sm text-gray-300">{result.divination_result.caution}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 키워드 */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {result.divination_result.keywords.map((keyword, idx) => (
                  <span key={idx} className="text-xs px-3 py-1.5 bg-white/10 text-gray-300 rounded-full border border-white/20">
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* 유사 질문 */}
            {result.similar_questions.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-gray-400 mb-3">📝 유사 질문</p>
                <div className="space-y-2">
                  {result.similar_questions.slice(0, 3).map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 truncate">{q.text}</span>
                      <span className="text-xs text-gray-500 ml-2">{Math.round(q.similarity * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 다시하기 버튼 */}
            <button
              onClick={handleReset}
              className="w-full py-3 bg-white/10 rounded-xl text-gray-300 hover:bg-white/20 transition"
            >
              🔄 다른 질문하기
            </button>

            {/* 면책 조항 */}
            <p className="text-xs text-center text-gray-500 mt-4">
              본 서비스는 오락 및 참고 목적으로 제공됩니다. 중요한 결정은 전문가와 상담하세요.
            </p>
          </div>
        )}

        {/* 돌아가기 */}
        <div className="mt-8 text-center">
          <a href="/demo/hexagram" className="text-sm text-gray-500 hover:text-gray-300 transition">
            ← 괘 표시 데모로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
