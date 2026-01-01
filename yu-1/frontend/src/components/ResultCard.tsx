'use client';

interface ResultCardProps {
  hexagram: {
    number: number;
    name_kr: string;
    name_hanja: string;
    name_full: string;
    symbol?: string;
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
  onShare?: () => void;
  onSave?: () => void;
  onReset?: () => void;
}

export default function ResultCard({
  hexagram,
  yao,
  interpretation,
  fortune_score,
  fortune_category,
  keywords,
  matched_category,
  caution,
  onShare,
  onSave,
  onReset,
}: ResultCardProps) {
  const getFortuneEmoji = (score: number) => {
    if (score >= 90) return '🎊';
    if (score >= 70) return '😊';
    if (score >= 50) return '🤔';
    if (score >= 30) return '😐';
    return '🌧️';
  };

  const getFortuneColor = (score: number) => {
    if (score >= 90) return 'from-yellow-500/10 to-amber-500/10';
    if (score >= 70) return 'from-green-500/10 to-emerald-500/10';
    if (score >= 50) return 'from-blue-500/10 to-indigo-500/10';
    if (score >= 30) return 'from-orange-500/10 to-red-500/10';
    return 'from-gray-500/10 to-gray-600/10';
  };

  const getFortuneStars = (score: number) => {
    const stars = Math.round(score / 20);
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  return (
    <div className="space-y-4">
      {/* 메인 결과 카드 */}
      <div className={`bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-6 bg-gradient-to-br ${getFortuneColor(fortune_score)}`}>
        {/* 괘 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2">
            {hexagram.symbol && (
              <span className="text-4xl gua-font">{hexagram.symbol}</span>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white gua-font">
                {hexagram.name_full}
              </h2>
              <p className="text-amber-400 font-medium">
                {hexagram.name_hanja} · {yao?.name || '괘사'}
              </p>
            </div>
          </div>

          {/* 괘 번호 */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full text-sm text-amber-300">
            <span>제{hexagram.number}괘</span>
            {yao && (
              <>
                <span>·</span>
                <span>{yao.position}효</span>
              </>
            )}
          </div>
        </div>

        {/* 효사 원문 */}
        {yao && (
          <div className="bg-white/5 rounded-xl p-4 mb-4 text-center">
            <p className="text-lg text-gray-200 gua-font mb-1">{yao.text_hanja}</p>
            <p className="text-sm text-gray-400">{yao.text_kr}</p>
          </div>
        )}

        {/* 해석 */}
        <div className="bg-white/5 rounded-xl p-5 mb-4">
          <p className="text-gray-200 leading-relaxed text-lg">
            {interpretation}
          </p>
        </div>

        {/* 주의사항 */}
        {caution && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
            <p className="text-orange-300 text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>{caution}</span>
            </p>
          </div>
        )}

        {/* 운세 점수 */}
        <div className="mb-4">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">운세 점수</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{getFortuneEmoji(fortune_score)}</span>
              <div className="text-lg">{getFortuneStars(fortune_score)}</div>
            </div>
            <p className="text-sm text-amber-400 font-bold">{fortune_score}점</p>
          </div>
        </div>

        {/* 신뢰도 바 */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>0</span>
            <span>🔮 해석 신뢰도</span>
            <span>100</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full confidence-bar rounded-full transition-all duration-1000"
              style={{ width: `${fortune_score}%` }}
            />
          </div>
        </div>

        {/* 매칭 카테고리 */}
        <div className="text-center text-sm text-gray-400 mb-4">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full">
            🎯 {matched_category}
          </span>
        </div>

        {/* 키워드 */}
        <div className="flex flex-wrap gap-2 justify-center">
          {keywords.map((keyword, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm"
            >
              #{keyword}
            </span>
          ))}
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onShare}
          className="py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition flex items-center justify-center gap-2"
        >
          <span>💬</span>
          <span>공유</span>
        </button>
        <button
          onClick={onReset}
          className="py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition flex items-center justify-center gap-2"
        >
          <span>🔄</span>
          <span>다시</span>
        </button>
        <button
          onClick={onSave}
          className="py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition flex items-center justify-center gap-2"
        >
          <span>💾</span>
          <span>저장</span>
        </button>
      </div>

      {/* 면책 조항 */}
      <p className="text-xs text-center text-gray-500 mt-4">
        본 서비스는 오락 및 참고 목적으로 제공됩니다.
        <br />
        중요한 결정은 전문가와 상담하세요.
      </p>
    </div>
  );
}
