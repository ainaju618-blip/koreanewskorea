'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MAJOR_CATEGORIES,
  YAO_NAMES,
  YAO_DESCRIPTIONS,
  generateDivination,
} from '@/lib/divination-data';

type DivinationStep = 'input' | 'loading' | 'result';

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

export default function DivinationPage() {
  const [step, setStep] = useState<DivinationStep>('input');
  const [majorCategory, setMajorCategory] = useState(1);
  const [yaoPosition, setYaoPosition] = useState(1);
  const [isYang, setIsYang] = useState(true);
  const [question, setQuestion] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState<DivinationResult | null>(null);

  const yaoName = isYang ? YAO_NAMES.yang[yaoPosition - 1] : YAO_NAMES.yin[yaoPosition - 1];
  const yaoDesc = YAO_DESCRIPTIONS[yaoPosition - 1];
  const majorInfo = MAJOR_CATEGORIES.find((m) => m.id === majorCategory);

  const handleRandomYao = () => {
    setYaoPosition(Math.floor(Math.random() * 6) + 1);
    setIsYang(Math.random() > 0.5);
  };

  const handleSubmit = useCallback(async () => {
    if (!question.trim()) {
      alert('Please enter your question');
      return;
    }

    setStep('loading');
    setLoadingProgress(0);

    // Simulate divination process
    const steps = [10, 30, 50, 70, 90, 100];
    for (const progress of steps) {
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200));
      setLoadingProgress(progress);
    }

    // Generate result
    const divinationResult = generateDivination(majorCategory, yaoPosition, isYang);
    setResult(divinationResult);
    setStep('result');
  }, [majorCategory, yaoPosition, isYang, question]);

  const handleReset = () => {
    setStep('input');
    setResult(null);
    setQuestion('');
    setLoadingProgress(0);
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
      alert('Result copied to clipboard!');
    }
  };

  const getFortuneEmoji = (score: number) => {
    if (score >= 90) return '&#127881;';
    if (score >= 70) return '&#128522;';
    if (score >= 50) return '&#129300;';
    if (score >= 30) return '&#128528;';
    return '&#127783;';
  };

  const getFortuneStars = (score: number) => {
    const stars = Math.round(score / 20);
    return { filled: stars, empty: 5 - stars };
  };

  // Loading Screen
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center px-4">
        {/* Background with mist effect */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.1)_0%,transparent_50%)]" />
        </div>

        <div className="relative text-center max-w-md">
          {/* Hexagram Card Image */}
          <div className="relative w-64 h-80 mx-auto mb-6">
            <Image
              src="/images/divination/hexagram-card.png"
              alt="Hexagram Card"
              fill
              className="object-contain animate-pulse"
              priority
            />
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent rounded-2xl" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Casting the Oracle...</h2>
          <p className="text-purple-200 text-sm mb-4">
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
    const stars = getFortuneStars(result.fortune_score);

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 px-4 py-8">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.1)_0%,transparent_50%)]" />
        </div>

        <div className="relative max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="text-purple-200 hover:text-white transition-colors">
              &larr; Home
            </Link>
            <h1 className="text-white font-bold">Divination Result</h1>
            <div className="w-16" />
          </div>

          {/* Question */}
          {question && (
            <div className="text-center mb-6">
              <p className="text-sm text-purple-300">Your Question</p>
              <p className="text-white font-medium">&ldquo;{question}&rdquo;</p>
            </div>
          )}

          {/* Main Result Card */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-4">
            {/* Hexagram Header with Card Image */}
            <div className="text-center mb-6">
              {/* Hexagram Card Image */}
              <div className="relative w-32 h-40 mx-auto mb-4">
                <Image
                  src="/images/divination/hexagram-card.png"
                  alt="Hexagram Card"
                  fill
                  className="object-contain"
                />
                {/* Hexagram number overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-400 drop-shadow-lg">{result.hexagram.symbol}</span>
                </div>
              </div>

              <div className="mb-2">
                <h2 className="text-2xl font-bold text-white">{result.hexagram.name_full}</h2>
                <p className="text-amber-400">{result.hexagram.name_hanja} - {result.yao.name}</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full text-sm text-amber-300">
                <span>Hexagram #{result.hexagram.number}</span>
                <span>-</span>
                <span>Line {result.yao.position}</span>
              </div>
            </div>

            {/* Oracle Text */}
            <div className="bg-white/5 rounded-xl p-4 mb-4 text-center">
              <p className="text-gray-200 leading-relaxed">{result.interpretation}</p>
            </div>

            {/* Caution */}
            {result.caution && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
                <p className="text-orange-300 text-sm flex items-start gap-2">
                  <span>&#9888;</span>
                  <span>{result.caution}</span>
                </p>
              </div>
            )}

            {/* Fortune Score */}
            <div className="bg-white/5 rounded-xl p-4 text-center mb-4">
              <p className="text-xs text-gray-500 mb-1">Fortune Score</p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl" dangerouslySetInnerHTML={{ __html: getFortuneEmoji(result.fortune_score) }} />
                <div className="text-lg text-yellow-400">
                  {'★'.repeat(stars.filled)}{'☆'.repeat(stars.empty)}
                </div>
              </div>
              <p className="text-amber-400 font-bold">{result.fortune_score} points - {result.fortune_category}</p>
            </div>

            {/* Category */}
            <div className="text-center text-sm text-gray-400 mb-4">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full">
                {result.matched_category}
              </span>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-2 justify-center">
              {result.keywords.map((keyword, i) => (
                <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  #{keyword}
                </span>
              ))}
            </div>
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
              onClick={handleReset}
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
          <p className="text-xs text-center text-gray-500">
            This service is for entertainment and reference purposes only.
            <br />
            For important decisions, please consult with professionals.
          </p>
        </div>
      </div>
    );
  }

  // Input Screen (Default)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.1)_0%,transparent_50%)]" />
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-56 sm:h-72 overflow-hidden">
        <Image
          src="/images/divination/divination-bg.png"
          alt="I Ching Divination Table"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />

        {/* Title overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg flex items-center gap-3">
            <span className="text-4xl sm:text-5xl">&#9775;</span>
            <span>I Ching Divination</span>
          </h1>
          <p className="text-purple-200 text-sm mt-2 drop-shadow-md">
            Ancient wisdom for modern life
          </p>
        </div>

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm"
        >
          &larr; Home
        </Link>
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-6">
        {/* Subtitle */}
        <div className="text-center mb-6">
          <p className="text-purple-200 text-sm">
            Select a category and ask your question
          </p>
        </div>

        <div className="space-y-6">
          {/* Question Input */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Your Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
              placeholder="e.g., Should I change jobs this year?"
              className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 outline-none resize-none transition text-white placeholder-gray-500"
              rows={3}
            />
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-gray-500">Be specific for better results</span>
              <span className="text-gray-500">{question.length}/100</span>
            </div>
          </div>

          {/* Category Selection */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <label className="block text-sm font-medium text-purple-200 mb-3">
              Select Category
            </label>
            <div className="flex flex-wrap gap-2">
              {MAJOR_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setMajorCategory(cat.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    majorCategory === cat.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Yao Selection */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-purple-200">
                Select Line (Yao)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsYang(true)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    isYang
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}
                >
                  Yang
                </button>
                <button
                  onClick={() => setIsYang(false)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    !isYang
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}
                >
                  Yin
                </button>
              </div>
            </div>

            {/* Yao Display */}
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-2xl font-bold text-amber-400">{yaoName}</span>
                  <span className="text-sm text-gray-500 ml-2">(Line {yaoPosition})</span>
                </div>
                <button
                  onClick={handleRandomYao}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition"
                >
                  Random
                </button>
              </div>
              <p className="text-white text-sm">{yaoDesc.meaning}</p>
              <p className="text-gray-500 text-xs mt-1">{yaoDesc.hint}</p>
            </div>

            {/* Yao Buttons */}
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5, 6].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setYaoPosition(pos)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                    yaoPosition === pos
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 scale-110'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Hexagram Visualization */}
            <div className="flex justify-center mt-4">
              <div className="flex flex-col-reverse gap-1">
                {[1, 2, 3, 4, 5, 6].map((pos) => (
                  <div
                    key={pos}
                    className={`h-3 rounded transition-all ${
                      yaoPosition === pos ? 'bg-amber-500 w-20' : 'bg-white/10 w-16'
                    }`}
                    style={{
                      boxShadow: yaoPosition === pos ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-purple-200 mb-2">Summary</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white">
                {majorInfo?.emoji} {majorInfo?.name}
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white">
                {isYang ? 'Yang' : 'Yin'} - Line {yaoPosition}
              </span>
              {question && (
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-400 truncate max-w-[200px]">
                  &ldquo;{question.slice(0, 20)}...&rdquo;
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!question.trim()}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              !question.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 text-amber-300'
            }`}
          >
            <span>&#128302;</span>
            <span>Cast the Oracle</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 mt-6">
          Based on traditional I Ching (Book of Changes) divination method.
          <br />
          3000 years of ancient wisdom in digital form.
        </p>
      </div>
    </div>
  );
}
