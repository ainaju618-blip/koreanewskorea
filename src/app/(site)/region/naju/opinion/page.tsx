'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Lightbulb, Zap, Leaf, User, Clock, Share2 } from 'lucide-react';

interface OpinionArticle {
  id: string;
  title: string;
  summary: string; // 3문장 요약
  content: string;
  author: {
    name: string;
    position: string;
    organization: string;
    avatar: string | null;
  };
  category: 'energy' | 'agriculture';
  publishedAt: string;
  thumbnail: string | null;
  viewCount: number;
  shareCount: number;
}

export default function NajuOpinionPage() {
  const [articles, setArticles] = useState<OpinionArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: '전체', icon: Lightbulb, color: 'purple' },
    { id: 'energy', label: '에너지 밸리 파워', icon: Zap, color: 'yellow' },
    { id: 'agriculture', label: '스마트 농업 리포트', icon: Leaf, color: 'green' },
  ];

  useEffect(() => {
    async function fetchOpinions() {
      try {
        const categoryParam = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
        const res = await fetch(`/api/region/naju/opinions?limit=20${categoryParam}`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error('Failed to fetch opinions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOpinions();
  }, [activeCategory]);

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'energy':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          label: '에너지 밸리',
          icon: <Zap className="w-3.5 h-3.5" />,
        };
      case 'agriculture':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          label: '스마트 농업',
          icon: <Leaf className="w-3.5 h-3.5" />,
        };
      default:
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          label: '인사이트',
          icon: <Lightbulb className="w-3.5 h-3.5" />,
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 샘플 데이터 (API 연동 전)
  const sampleArticles: OpinionArticle[] = [
    {
      id: '1',
      title: '나주 에너지밸리, 2030년 글로벌 그린에너지 허브로 도약하다',
      summary: '한전 본사 이전 10년, 나주 에너지밸리가 만들어낸 변화는 단순한 기업 유치를 넘어선다. 312개 에너지 기업 집적, 2.3조원 투자 유치는 시작에 불과하다. 진정한 승부는 기술 표준화와 인재 양성에서 갈린다.',
      content: '',
      author: {
        name: '김OO',
        position: '사장',
        organization: '한국전력공사',
        avatar: null,
      },
      category: 'energy',
      publishedAt: '2025-01-09T09:00:00Z',
      thumbnail: null,
      viewCount: 1250,
      shareCount: 89,
    },
    {
      id: '2',
      title: '스마트팜 혁명, 나주배 농가의 새로운 도전',
      summary: '100년 전통의 나주배 농가가 ICT를 만났다. 센서 기반 정밀농업으로 수확량 23% 증가, 노동력 40% 절감을 달성했다. 농업의 미래는 경험이 아닌 데이터에서 온다.',
      content: '',
      author: {
        name: '박OO',
        position: '사장',
        organization: '한국농어촌공사',
        avatar: null,
      },
      category: 'agriculture',
      publishedAt: '2025-01-08T09:00:00Z',
      thumbnail: null,
      viewCount: 890,
      shareCount: 56,
    },
    {
      id: '3',
      title: '재생에너지 REC 시장, 나주가 주도권을 잡아야 하는 이유',
      summary: 'RE100 가입 기업이 급증하며 재생에너지 수요가 폭발한다. 전남 태양광·풍력 발전량은 전국 1위, 그 중심에 나주가 있다. 에너지 거래 플랫폼의 표준을 선점하는 자가 시장을 지배한다.',
      content: '',
      author: {
        name: '이OO',
        position: '본부장',
        organization: '한국전력거래소',
        avatar: null,
      },
      category: 'energy',
      publishedAt: '2025-01-07T09:00:00Z',
      thumbnail: null,
      viewCount: 1102,
      shareCount: 72,
    },
  ];

  const displayArticles = articles.length > 0 ? articles : sampleArticles;
  const filteredArticles = activeCategory === 'all'
    ? displayArticles
    : displayArticles.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Lightbulb className="w-7 h-7" />
            나주 인사이트 365
          </h1>
          <p className="text-purple-200 mt-2">에너지 밸리와 스마트 농업의 미래를 읽다</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-[92px] md:top-[103px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setIsLoading(true);
                    setActiveCategory(cat.id);
                    setTimeout(() => setIsLoading(false), 300);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? cat.id === 'energy'
                        ? 'bg-yellow-500 text-white shadow-md'
                        : cat.id === 'agriculture'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600">에너지 밸리 <strong className="text-yellow-600">60%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">스마트 농업 <strong className="text-green-600">40%</strong></span>
              </div>
            </div>
            <span className="text-gray-400 text-xs">매주 월요일 발행</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="ml-3 text-gray-500">인사이트를 불러오는 중...</span>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <Lightbulb className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">등록된 인사이트가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">곧 전문가 칼럼이 업데이트됩니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredArticles.map((article) => {
              const catStyle = getCategoryStyle(article.category);
              return (
                <Link
                  key={article.id}
                  href={`/region/naju/opinion/${article.id}`}
                  className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
                        {catStyle.icon}
                        {catStyle.label}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(article.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3.5 h-3.5" />
                          {article.shareCount}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {article.title}
                    </h2>

                    {/* 3-Sentence Summary (Hemingway Style) */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                        {article.author.avatar ? (
                          <Image
                            src={article.author.avatar}
                            alt={article.author.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{article.author.name}</p>
                        <p className="text-xs text-gray-500">
                          {article.author.organization} {article.author.position}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA for Contributors */}
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">전문가 기고 안내</h3>
              <p className="text-sm text-gray-600 mb-3">
                에너지, 농업, 지역발전 분야의 전문가 기고를 기다립니다.<br />
                나주의 미래를 함께 그려갈 인사이트를 공유해주세요.
              </p>
              <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
                기고 문의하기 →
              </button>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
