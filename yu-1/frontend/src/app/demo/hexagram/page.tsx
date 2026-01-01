'use client';

import { useState, useEffect } from 'react';
import HexagramDisplay from '@/components/HexagramDisplay';

// 간단한 음력 변환 (실제 서비스에서는 API 또는 라이브러리 사용 권장)
// 2026년 1월 1일 = 음력 2025년 11월 12일
const getLunarDate = (date: Date): string => {
  // 실제 음력 계산은 복잡하므로, 여기서는 예시 데이터 사용
  // 실제 구현 시 korean-lunar-calendar 라이브러리 또는 API 사용
  const lunarData: Record<string, string> = {
    '2026-1-1': '11월 12일',
    '2026-1-2': '11월 13일',
    '2026-1-3': '11월 14일',
    // 더 많은 데이터 추가 가능
  };

  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return lunarData[key] || '11월 12일'; // 기본값
};

// 테스트용 데이터 (오늘의 운세 형식)
const SAMPLE_FORTUNE = {
  hexagram_number: 1,
  hexagram_name: '건위천',
  hexagram_hanja: '乾',
  yao_position: 4,
  yao_name: '구사',
  text_kr: '혹 뛰어 연못에 있으니 허물이 없다',
  daily_headline: '내면의 목소리를 따르면 좋은 날',
  daily_body: '작은 성과들이 차곡차곡 쌓여 나중에 큰 결과로 이어질 것이다. 흐름에 몸을 맡기면 자연스럽게 길이 열린다.',
  keywords: ['도약', '기회', '판단', '신중'],
};

// 효 위치를 효 이름으로 변환
const getYaoDisplayName = (position: number): string => {
  const names = ['초효', '2효', '3효', '4효', '5효', '상효'];
  return names[position - 1] || '초효';
};

export default function HexagramDemoPage() {
  const [fortune] = useState(SAMPLE_FORTUNE);
  const [yaoPosition, setYaoPosition] = useState(1); // 초효(양효) 하이라이트

  // 투명도 조절 (투명 프리셋 적용)
  const [opacity1, setOpacity1] = useState(0); // 괘 영역
  const [opacity2, setOpacity2] = useState(0); // 정보 영역
  const [opacity3, setOpacity3] = useState(0); // 해석 영역
  const [opacity4, setOpacity4] = useState(0);  // 키워드 영역

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">오늘의 운세 카드 - 영역 구분 데모</h1>
        <p className="text-gray-400 mb-6">각 영역별 박스 투명도를 조절하여 구분</p>

        {/* 컨트롤 패널 */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-3">⚙️ 투명도 조절</h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-amber-300">① 괘 영역: {opacity1}%</label>
              <input type="range" min="0" max="100" step="5" value={opacity1}
                onChange={(e) => setOpacity1(Number(e.target.value))}
                className="w-full" />
            </div>
            <div>
              <label className="text-blue-300">② 정보 영역: {opacity2}%</label>
              <input type="range" min="0" max="100" step="5" value={opacity2}
                onChange={(e) => setOpacity2(Number(e.target.value))}
                className="w-full" />
            </div>
            <div>
              <label className="text-green-300">③ 해석 영역: {opacity3}%</label>
              <input type="range" min="0" max="100" step="5" value={opacity3}
                onChange={(e) => setOpacity3(Number(e.target.value))}
                className="w-full" />
            </div>
            <div>
              <label className="text-purple-300">④ 키워드 영역: {opacity4}%</label>
              <input type="range" min="0" max="100" step="5" value={opacity4}
                onChange={(e) => setOpacity4(Number(e.target.value))}
                className="w-full" />
            </div>
          </div>

          {/* 효 위치 선택 */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <label className="text-sm text-gray-400 mb-2 block">효 위치: {yaoPosition}효</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setYaoPosition(pos)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-all
                    ${yaoPosition === pos
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 오늘의 운세 카드 미리보기 */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-amber-300">🎯 오늘의 운세</span>
            <span className="text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded-full border border-amber-400/30">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              <span className="text-amber-300/70 ml-1">(음 {getLunarDate(new Date())})</span>
            </span>
          </div>

          {/* ===== 메인 콘텐츠 영역 (박스 구분) ===== */}
          <div className="space-y-3">

            {/* 영역 1+2: 괘 + 정보 (가로 배치) */}
            <div className="flex items-stretch gap-3">
              {/* ① 괘 영역 */}
              <div
                className="relative rounded-xl p-4 pt-6 border border-amber-500/30 flex flex-col items-center justify-center"
                style={{ backgroundColor: `rgba(251, 191, 36, ${opacity1 / 100})` }}
              >
                <span className="absolute -top-0.5 left-3 px-2 text-xs text-amber-300 font-medium bg-slate-900">득괘</span>
                <HexagramDisplay
                  hexagramNumber={fortune.hexagram_number}
                  highlightYao={yaoPosition}
                  size="lg"
                  showLabels={false}
                />
              </div>

              {/* ② 정보 영역 */}
              <div
                className="flex-1 rounded-xl p-4 border border-blue-500/30 flex flex-col justify-center"
                style={{ backgroundColor: `rgba(59, 130, 246, ${opacity2 / 100})` }}
              >
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {fortune.hexagram_name}
                  <span className="text-amber-400">({fortune.hexagram_hanja})</span>
                </h2>
                <span className="text-sm text-amber-300 mt-1">
                  ✨ {getYaoDisplayName(yaoPosition)}
                </span>
                <p className="text-lg text-gray-300 mt-3">{fortune.text_kr}</p>
              </div>
            </div>

            {/* ③ 해석 영역 */}
            <div
              className="rounded-xl p-5 border border-green-500/30"
              style={{ backgroundColor: `rgba(34, 197, 94, ${opacity3 / 100})` }}
            >
              <span className="text-xs text-green-300/80 font-medium">해석</span>
              <h3 className="text-lg font-bold text-amber-300 text-center mb-3 mt-2">
                {fortune.daily_headline}
              </h3>
              <p className="text-sm text-gray-300 text-center leading-relaxed">
                {fortune.daily_body}
              </p>
            </div>

            {/* ④ 키워드 영역 */}
            <div
              className="rounded-xl p-4 border border-purple-500/30"
              style={{ backgroundColor: `rgba(168, 85, 247, ${opacity4 / 100})` }}
            >
              <div className="flex flex-wrap gap-2 justify-center">
                {fortune.keywords.map((keyword, idx) => (
                  <span key={idx} className="text-xs px-3 py-1.5 bg-white/10 text-gray-300 rounded-full border border-white/20">
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 프리셋 버튼 */}
        <div className="mt-6 flex gap-3 flex-wrap">
          <button
            onClick={() => { setOpacity1(20); setOpacity2(10); setOpacity3(30); setOpacity4(5); }}
            className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
          >
            🎨 기본
          </button>
          <button
            onClick={() => { setOpacity1(15); setOpacity2(15); setOpacity3(15); setOpacity4(15); }}
            className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
          >
            ⚖️ 균일
          </button>
          <button
            onClick={() => { setOpacity1(30); setOpacity2(5); setOpacity3(40); setOpacity4(10); }}
            className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
          >
            🔥 강조
          </button>
          <button
            onClick={() => { setOpacity1(5); setOpacity2(5); setOpacity3(10); setOpacity4(3); }}
            className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
          >
            🌙 은은
          </button>
          <button
            onClick={() => { setOpacity1(0); setOpacity2(0); setOpacity3(0); setOpacity4(0); }}
            className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
          >
            👻 투명
          </button>
        </div>

        {/* 영역 설명 */}
        <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10 text-sm">
          <h3 className="font-medium mb-2">📦 영역 구성</h3>
          <div className="grid grid-cols-2 gap-2 text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500/50"></span>
              <span>① 괘 영역 (HexagramDisplay)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-500/50"></span>
              <span>② 정보 영역 (이름, 효, 텍스트)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-500/50"></span>
              <span>③ 해석 영역 (헤드라인, 본문)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-500/50"></span>
              <span>④ 키워드 영역 (태그)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
