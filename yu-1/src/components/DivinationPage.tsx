'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MAJOR_CATEGORIES,
  generateDivination,
  generateTodayFortune,
  getLunarDate,
  type TodayFortuneData,
} from '../lib/divination-data';
import HexagramDisplay from './HexagramDisplay';

type DivinationStep = 'home' | 'input' | 'loading' | 'result';

interface DivinationResult {
  hexagram: {
    number: number;
    name_ko: string;
    name_hanja: string;
    name_full: string;
    symbol: string;
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
  matched_category: string;
  caution?: string;
}

// Convert yao position to display name
const getYaoDisplayName = (position: number): string => {
  const names = ['cho-hyo', '2-hyo', '3-hyo', '4-hyo', '5-hyo', 'sang-hyo'];
  return names[position - 1] || 'cho-hyo';
};

export default function DivinationPage() {
  const [step, setStep] = useState<DivinationStep>('home');
  const [isLoaded, setIsLoaded] = useState(false);
  const [majorCategory, setMajorCategory] = useState(1);
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [todayFortune, setTodayFortune] = useState<TodayFortuneData | null>(null);
  const [lunarDate, setLunarDate] = useState('');
  const [showFortune, setShowFortune] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Generate today's fortune on mount
  useEffect(() => {
    setIsLoaded(true);
    const fortune = generateTodayFortune();
    setTodayFortune(fortune);
    setLunarDate(getLunarDate(new Date()));

    // Ensure video autoplay
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay failure
      });
    }
  }, []);

  const handleQuestionSubmit = async () => {
    if (!question.trim()) {
      return;
    }

    setStep('loading');
    setLoadingProgress(0);

    // Simulate divination process with spinning animation
    const steps = [10, 30, 50, 70, 90, 100];
    for (const progress of steps) {
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200));
      setLoadingProgress(progress);
    }

    // Generate result - random yao
    const yaoPosition = Math.floor(Math.random() * 6) + 1;
    const isYang = Math.random() > 0.5;
    const divinationResult = generateDivination(majorCategory, yaoPosition, isYang);
    setResult(divinationResult);
    setStep('result');
  };

  const handleReset = () => {
    setStep('home');
    setResult(null);
    setQuestion('');
    setLoadingProgress(0);
    setShowFortune(true);
  };

  const handleShare = () => {
    if (!result) return;
    const shareText = `I Ching Divination Result

${result.hexagram.name_full} (${result.hexagram.name_hanja})
${result.yao.name}

"${result.interpretation}"

Fortune: ${result.fortune_category} (${result.fortune_score} points)

#IChing #Divination #Fortune`;

    if (navigator.share) {
      navigator.share({
        title: 'I Ching Divination Result',
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const getFortuneEmoji = (score: number) => {
    if (score >= 90) return '🎉';
    if (score >= 70) return '😊';
    if (score >= 50) return '🤔';
    if (score >= 30) return '😐';
    return '🌧️';
  };

  // Loading Screen
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background decoration - sage image */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Image
            src="/images/divination/sage-yinyang.png"
            alt=""
            width={600}
            height={600}
            className="object-contain"
            priority
          />
        </div>

        <div className="relative text-center max-w-md z-10">
          {/* Divination loading animation */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Outer circle effect */}
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-ping" />
            <div className="absolute inset-4 border-4 border-pink-500/50 rounded-full animate-pulse" />
            {/* Yin-yang emoji - fast spin animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl animate-spin drop-shadow-[0_0_10px_rgba(124,58,237,0.8)]" style={{ animationDuration: '0.8s' }}>☯️</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Drawing hexagram...</h2>
          <p className="text-purple-200 text-sm mb-6">
            {loadingProgress < 30 && 'Preparing 49 yarrow stalks...'}
            {loadingProgress >= 30 && loadingProgress < 60 && 'Dividing the stalks...'}
            {loadingProgress >= 60 && loadingProgress < 90 && 'Reading the hexagram...'}
            {loadingProgress >= 90 && 'Interpreting the oracle...'}
          </p>

          {/* Progress Bar */}
          <div className="max-w-xs mx-auto">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-amber-300 text-sm mt-2">{loadingProgress}%</p>
          </div>
        </div>
      </div>
    );
  }

  // Result Screen
  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-black px-4 py-8 relative overflow-hidden">
        {/* Background decoration - hexagram mandala */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <Image
            src="/images/divination/hexagram-mandala.png"
            alt=""
            width={800}
            height={800}
            className="object-contain"
          />
        </div>

        <div className="relative max-w-lg mx-auto z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleReset}
              className="text-purple-200 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-white font-bold">Divination Result</h1>
            <div className="w-16" />
          </div>

          {/* Question */}
          {question && (
            <div className="bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-sm text-gray-300">&ldquo;{question}&rdquo;</p>
            </div>
          )}

          {/* Main Result Card - yu-1 style */}
          <div className="bg-black/40 border border-amber-500/30 rounded-2xl p-5 mb-4">
            {/* Hexagram + Info (horizontal layout) */}
            <div className="flex items-stretch gap-3 mb-4">
              {/* Hexagram area */}
              <div className="relative rounded-xl p-4 pt-6 border border-amber-500/30 flex flex-col items-center justify-center">
                <span className="absolute -top-[5px] left-3 px-2 text-xs text-amber-300 font-medium bg-black/40">Hexagram</span>
                <HexagramDisplay
                  hexagramNumber={result.hexagram.number}
                  highlightYao={result.yao.position}
                  size="lg"
                  showLabels={false}
                />
              </div>

              {/* Info area */}
              <div className="flex-1 rounded-xl p-4 border border-blue-500/30 flex flex-col justify-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                  {result.hexagram.name_full}
                  <span className="text-amber-400">({result.hexagram.name_hanja})</span>
                  <span className="text-sm text-amber-300 font-normal">✨ {getYaoDisplayName(result.yao.position)}</span>
                </h2>
                <p className="text-sm text-gray-400 mt-2">{result.yao.text_kr}</p>
              </div>
            </div>

            {/* Interpretation area */}
            <div className="rounded-xl p-5 border border-green-500/30 mb-4">
              <span className="text-xs text-green-300/80 font-medium">Interpretation</span>
              <p className="text-sm text-gray-300 leading-relaxed mt-2">
                {result.interpretation}
              </p>
            </div>

            {/* Caution */}
            {result.caution && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
                <p className="text-orange-300 text-sm flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{result.caution}</span>
                </p>
              </div>
            )}

            {/* Fortune Score */}
            <div className="bg-white/5 rounded-xl p-4 text-center mb-4">
              <p className="text-xs text-gray-500 mb-1">Fortune Score</p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">{getFortuneEmoji(result.fortune_score)}</span>
                <div className="text-lg text-yellow-400">
                  {'★'.repeat(Math.round(result.fortune_score / 20))}
                  {'☆'.repeat(5 - Math.round(result.fortune_score / 20))}
                </div>
              </div>
              <p className="text-amber-400 font-bold">{result.fortune_score} points - {result.fortune_category}</p>
            </div>

            {/* Keywords area */}
            {result.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {result.keywords.map((keyword, idx) => (
                  <span key={idx} className="text-xs px-3 py-1.5 bg-white/10 text-gray-300 rounded-full border border-white/20">
                    #{keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={handleShare}
              className="py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition"
            >
              Share
            </button>
            <button
              onClick={() => { setStep('home'); setQuestion(''); setShowFortune(true); }}
              className="py-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-sm font-medium text-amber-300 hover:bg-amber-500/30 transition"
            >
              Again
            </button>
            <Link
              href="/"
              className="py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition text-center"
            >
              Home
            </Link>
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              ⚠️ <span className="text-gray-400">Disclaimer</span><br />
              All divination results are provided for <span className="text-amber-400/80">entertainment and reference purposes only</span>.<br />
              Consult professionals for important decisions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Home Screen with Video Background - yu-1 style
  return (
    <div className="min-h-screen bg-black">
      {/* Star background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(2px 2px at 10% 10%, white, transparent),
            radial-gradient(2px 2px at 20% 20%, white, transparent),
            radial-gradient(1px 1px at 30% 30%, white, transparent),
            radial-gradient(2px 2px at 40% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(2px 2px at 60% 80%, white, transparent),
            radial-gradient(1px 1px at 70% 40%, white, transparent),
            radial-gradient(2px 2px at 80% 60%, white, transparent),
            radial-gradient(1px 1px at 90% 90%, white, transparent)
          `,
          opacity: 0.3,
        }} />
        {/* Decorative trigrams image */}
        <div className="absolute bottom-0 right-0 opacity-[0.08]">
          <Image
            src="/images/divination/trigrams-yinyang.png"
            alt=""
            width={400}
            height={400}
            className="object-contain"
          />
        </div>
      </div>

      {/* Back button */}
      <div className="relative z-20 px-4 py-4">
        <Link
          href="/"
          className="inline-block text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm"
        >
          ← Home
        </Link>
      </div>

      <main className="relative z-10 max-w-lg mx-auto px-4 pb-8">
        <section className="space-y-4">
          {/* Video background - independent area */}
          <div className="relative overflow-hidden rounded-3xl aspect-video">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              src="/videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4"
            />
            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />

            {/* Caption */}
            <div className={`absolute inset-x-0 bottom-2 flex justify-center transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <p className="font-serif text-sm text-white/90 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                3000 Years of History - Seeking <span className="font-bold text-white">Heaven's Will</span> through Cosmic Mystery
              </p>
            </div>
          </div>

          {/* Today's fortune card */}
          {showFortune && todayFortune && (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-amber-300">🎯 Today's Fortune</span>
                <span className="text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded-full border border-amber-400/30">
                  {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  <span className="text-amber-300/70 ml-1">(Lunar {lunarDate})</span>
                </span>
              </div>

              <div className="space-y-3">
                {/* Area 1+2: Hexagram + Info (horizontal layout) */}
                <div className="flex items-stretch gap-3">
                  {/* Hexagram area */}
                  <div className="relative rounded-xl p-4 pt-6 border border-amber-500/30 flex flex-col items-center justify-center">
                    <span className="absolute -top-[5px] left-3 px-2 text-xs text-amber-300 font-medium bg-black/40">Hexagram</span>
                    <HexagramDisplay
                      hexagramNumber={todayFortune.hexagram_number}
                      highlightYao={todayFortune.yao_position}
                      size="lg"
                      showLabels={false}
                    />
                  </div>

                  {/* Info area */}
                  <div className="flex-1 rounded-xl p-4 border border-blue-500/30 flex flex-col justify-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                      {todayFortune.hexagram_name}
                      <span className="text-amber-400">({todayFortune.hexagram_hanja})</span>
                      <span className="text-sm text-amber-300 font-normal">✨ {getYaoDisplayName(todayFortune.yao_position)}</span>
                    </h2>
                    <p className="text-lg text-gray-300 mt-3">{todayFortune.text_kr}</p>
                  </div>
                </div>

                {/* Interpretation area */}
                <div className="rounded-xl p-5 border border-green-500/30">
                  <span className="text-xs text-green-300/80 font-medium">Interpretation</span>
                  {todayFortune.daily_headline && (
                    <h3 className="text-lg font-bold text-amber-300 text-center mb-3 mt-2">
                      {todayFortune.daily_headline}
                    </h3>
                  )}
                  <p className="text-sm text-gray-300 text-center leading-relaxed">
                    {todayFortune.interpretation}
                  </p>
                </div>

                {/* Keywords area */}
                {todayFortune.keywords.length > 0 && (
                  <div className="rounded-xl p-4 border border-purple-500/30">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {todayFortune.keywords.map((keyword, idx) => (
                        <span key={idx} className="text-xs px-3 py-1.5 bg-white/10 text-gray-300 rounded-full border border-white/20">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Question input */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💬</span>
              <span className="text-white font-medium">Ask Your Question</span>
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
                  <p>Ex: Will my job interview go well this month?</p>
                  <p className="mt-1">💡 Be specific for better results.</p>
                </div>
              )}
            </div>

            {/* Category selection */}
            <div className="mt-4 mb-4">
              <p className="text-xs text-gray-400 mb-2">Select Category</p>
              <div className="flex flex-wrap gap-2">
                {MAJOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setMajorCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      majorCategory === cat.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{question.length}/100</span>
              <button
                onClick={handleQuestionSubmit}
                disabled={!question.trim()}
                className={`px-6 py-2 font-bold rounded-xl border transition-all duration-300 ${
                  question.trim()
                    ? 'bg-black/30 text-amber-300 border-white/10 hover:bg-black/50 hover:border-amber-500/30'
                    : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                }`}
              >
                🔮 Receive Oracle
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              ⚠️ <span className="text-gray-400">Disclaimer</span><br />
              All divination results are provided for <span className="text-amber-400/80">entertainment and reference purposes only</span>.<br />
              <span className="font-medium text-gray-400">KoreaNEWS</span> assumes no <span className="text-red-400/80">legal responsibility</span> for any decisions or actions based on these results.<br />
              Consult professionals for important decisions.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
