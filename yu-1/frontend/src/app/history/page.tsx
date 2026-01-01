'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface HistoryItem {
  id: string;
  hexagram: {
    number: number;
    name_kr: string;
    name_hanja: string;
    name_full: string;
  };
  yao: {
    position: number;
    name: string;
  };
  interpretation: string;
  fortune_score: number;
  fortune_category: string;
  matched_category: string;
  question?: string;
  savedAt: string;
  feedback?: 'success' | 'normal' | 'fail';
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    successRate: 0,
    categoryStats: {} as Record<string, { count: number; success: number }>,
  });

  // 히스토리 로드
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('divination_history') || '[]');
    setHistory(saved);

    // 통계 계산
    if (saved.length > 0) {
      const total = saved.length;
      const avgScore = Math.round(
        saved.reduce((acc: number, item: HistoryItem) => acc + item.fortune_score, 0) / total
      );

      const feedbackItems = saved.filter((item: HistoryItem) => item.feedback);
      const successCount = feedbackItems.filter((item: HistoryItem) => item.feedback === 'success').length;
      const successRate = feedbackItems.length > 0 ? Math.round((successCount / feedbackItems.length) * 100) : 0;

      // 카테고리별 통계
      const categoryStats: Record<string, { count: number; success: number }> = {};
      saved.forEach((item: HistoryItem) => {
        const cat = item.matched_category || '기타';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { count: 0, success: 0 };
        }
        categoryStats[cat].count++;
        if (item.feedback === 'success') {
          categoryStats[cat].success++;
        }
      });

      setStats({ total, avgScore, successRate, categoryStats });
    }
  }, []);

  // 피드백 업데이트
  const handleFeedback = (id: string, feedback: 'success' | 'normal' | 'fail') => {
    const updated = history.map((item) =>
      item.id === id ? { ...item, feedback } : item
    );
    setHistory(updated);
    localStorage.setItem('divination_history', JSON.stringify(updated));
  };

  // 항목 삭제
  const handleDelete = (id: string) => {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      const updated = history.filter((item) => item.id !== id);
      setHistory(updated);
      localStorage.setItem('divination_history', JSON.stringify(updated));
    }
  };

  // 전체 삭제
  const handleClearAll = () => {
    if (confirm('모든 기록을 삭제하시겠습니까?')) {
      setHistory([]);
      localStorage.removeItem('divination_history');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFeedbackEmoji = (feedback?: string) => {
    if (feedback === 'success') return '✅';
    if (feedback === 'normal') return '⚠️';
    if (feedback === 'fail') return '❌';
    return '❓';
  };

  return (
    <div className="min-h-screen bg-dark-stars">
      <Header showHistory={false} />

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 페이지 제목 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📜</span>
            <span>점괘 기록</span>
          </h1>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-red-400 hover:text-red-300"
            >
              전체 삭제
            </button>
          )}
        </div>

        {/* 통계 카드 */}
        {history.length > 0 && (
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <span>📊</span>
              <span>통계</span>
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{stats.total}</p>
                <p className="text-xs text-gray-500">총 점괘</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{stats.avgScore}점</p>
                <p className="text-xs text-gray-500">평균 점수</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.successRate}%</p>
                <p className="text-xs text-gray-500">성공률</p>
              </div>
            </div>

            {/* 카테고리별 통계 */}
            <div className="space-y-2">
              {Object.entries(stats.categoryStats).slice(0, 5).map(([cat, data]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{data.count}회</span>
                    {data.success > 0 && (
                      <span className="text-green-400">({data.success}승)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 히스토리 목록 */}
        {history.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">📭</span>
            <p className="text-gray-400 mb-4">아직 저장된 기록이 없습니다</p>
            <button
              onClick={() => router.push('/divination')}
              className="px-6 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/30 rounded-xl hover:from-amber-500/30 hover:to-amber-600/30 transition"
            >
              점괘 보러 가기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {item.hexagram.name_full}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.hexagram.name_hanja}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {item.yao.name} · {item.matched_category}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(item.savedAt)}
                  </span>
                </div>

                {/* 질문 */}
                {item.question && (
                  <p className="text-sm text-gray-300 bg-white/5 rounded-lg px-3 py-2 mb-2">
                    &ldquo;{item.question}&rdquo;
                  </p>
                )}

                {/* 결과 요약 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${item.fortune_score >= 70 ? 'bg-green-500/20 text-green-300' :
                        item.fortune_score >= 50 ? 'bg-blue-500/20 text-blue-300' :
                        'bg-orange-500/20 text-orange-300'}
                    `}>
                      {item.fortune_category}
                    </span>
                    <span className="text-sm text-gray-500">{item.fortune_score}점</span>
                  </div>

                  {/* 피드백 버튼 */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleFeedback(item.id, 'success')}
                      className={`p-1.5 rounded-lg text-sm transition ${
                        item.feedback === 'success' ? 'bg-green-500/20' : 'hover:bg-white/10'
                      }`}
                      title="적중!"
                    >
                      ✅
                    </button>
                    <button
                      onClick={() => handleFeedback(item.id, 'normal')}
                      className={`p-1.5 rounded-lg text-sm transition ${
                        item.feedback === 'normal' ? 'bg-yellow-500/20' : 'hover:bg-white/10'
                      }`}
                      title="보통"
                    >
                      ⚠️
                    </button>
                    <button
                      onClick={() => handleFeedback(item.id, 'fail')}
                      className={`p-1.5 rounded-lg text-sm transition ${
                        item.feedback === 'fail' ? 'bg-red-500/20' : 'hover:bg-white/10'
                      }`}
                      title="빗나감"
                    >
                      ❌
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-sm hover:bg-white/10 transition ml-2"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 하단 여백 */}
        <div className="h-20" />
      </main>
    </div>
  );
}
