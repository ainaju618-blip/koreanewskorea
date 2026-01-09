'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, User, Clock, Share2, Zap, Leaf, Lightbulb, Eye, MessageSquare, Bookmark } from 'lucide-react';

interface OpinionDetail {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: {
    name: string;
    position: string;
    organization: string;
    avatar: string | null;
    bio: string | null;
  };
  category: 'energy' | 'agriculture';
  publishedAt: string;
  thumbnail: string | null;
  viewCount: number;
  shareCount: number;
  tags: string[];
}

export default function OpinionDetailPage() {
  const params = useParams();
  const [opinion, setOpinion] = useState<OpinionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 샘플 데이터
  const sampleOpinions: Record<string, OpinionDetail> = {
    '1': {
      id: '1',
      title: '나주 에너지밸리, 2030년 글로벌 그린에너지 허브로 도약하다',
      summary: '한전 본사 이전 10년, 나주 에너지밸리가 만들어낸 변화는 단순한 기업 유치를 넘어선다. 312개 에너지 기업 집적, 2.3조원 투자 유치는 시작에 불과하다. 진정한 승부는 기술 표준화와 인재 양성에서 갈린다.',
      content: `2014년 한전 본사가 나주로 이전한 이후 10년이 지났다.

그 사이 나주 에너지밸리에는 312개 에너지 관련 기업이 입주했고, 누적 투자액은 2.3조원을 넘어섰다. 고용 창출 효과는 1만 2천명에 달한다.

하지만 이것은 시작에 불과하다.

전 세계가 탄소중립을 향해 달려가는 지금, 나주 에너지밸리의 진정한 경쟁력은 단순한 기업 유치가 아니다. 우리가 만들어낸 기술이 글로벌 표준이 되어야 하고, 우리가 길러낸 인재가 세계 에너지 시장을 이끌어야 한다.

2030년까지 나주를 아시아 최대의 그린에너지 R&D 허브로 만드는 것이 우리의 목표다.

이를 위해 세 가지 전략을 추진하고 있다.

첫째, 기술 표준화다. 한전과 에너지 공기업들이 개발한 스마트그리드, ESS, 전력 반도체 기술을 국제 표준으로 만드는 작업이 진행 중이다.

둘째, 인재 양성이다. 전남대학교, 한전공대와 협력하여 에너지 특화 인재를 연간 500명씩 배출한다.

셋째, 창업 생태계 구축이다. 에너지 분야 유니콘 기업을 나주에서 만들어낸다.

10년 뒤, 전 세계가 나주를 보게 될 것이다.`,
      author: {
        name: '김종호',
        position: '사장',
        organization: '한국전력공사',
        avatar: null,
        bio: '서울대학교 전기공학과를 졸업하고, MIT에서 에너지시스템 박사학위를 취득했다. 한국전력 기술연구원장, 전력거래소 이사장을 거쳐 현재 한국전력공사 사장을 맡고 있다.',
      },
      category: 'energy',
      publishedAt: '2025-01-08T09:00:00Z',
      thumbnail: null,
      viewCount: 1250,
      shareCount: 89,
      tags: ['에너지밸리', '한전', '그린에너지', 'RE100'],
    },
    '2': {
      id: '2',
      title: '스마트팜 혁명, 나주배 농가의 새로운 도전',
      summary: '100년 전통의 나주배 농가가 ICT를 만났다. 센서 기반 정밀농업으로 수확량 23% 증가, 노동력 40% 절감을 달성했다. 농업의 미래는 경험이 아닌 데이터에서 온다.',
      content: `나주배의 역사는 100년이 넘는다.

조부모 대부터 이어온 농사 기술, 날씨를 읽는 감각, 과일의 상태를 보는 눈. 이 모든 것이 "경험"이라는 이름으로 전해져 왔다.

하지만 이제 그 경험을 데이터가 대체하고 있다.

나주시 금천면의 스마트팜 시범단지에서는 토양 센서, 기상 센서, 생육 카메라가 24시간 과수원을 모니터링한다. AI가 최적의 관수 시점과 양을 알려주고, 병충해 발생을 미리 예측한다.

결과는 놀라웠다.

수확량 23% 증가. 노동력 40% 절감. 농약 사용 30% 감소.

무엇보다 중요한 것은 청년 농부들의 진입 장벽이 낮아졌다는 점이다. 예전에는 최소 10년의 경험이 있어야 제대로 된 농사를 지을 수 있다고 했다. 이제는 데이터를 읽을 줄 아는 청년이 3년 만에 베테랑 농부 못지않은 성과를 낸다.

100년 경험 위에 데이터라는 새로운 무기가 더해지고 있다.

한국농어촌공사는 나주를 스마트농업의 모델 지역으로 만들고 있다. 2030년까지 나주 전체 농가의 50%가 스마트팜 기술을 도입하는 것이 목표다.

농업의 미래가 나주에서 시작되고 있다.`,
      author: {
        name: '조성완',
        position: '사장',
        organization: '한국농어촌공사',
        avatar: null,
        bio: '고려대학교 농경제학과를 졸업하고, UC Davis에서 농업경영학 석사학위를 취득했다. 농림축산식품부 차관을 거쳐 현재 한국농어촌공사 사장을 맡고 있다.',
      },
      category: 'agriculture',
      publishedAt: '2025-01-07T09:00:00Z',
      thumbnail: null,
      viewCount: 890,
      shareCount: 56,
      tags: ['스마트팜', '나주배', '정밀농업', 'AgTech'],
    },
    '3': {
      id: '3',
      title: '재생에너지 REC 시장, 나주가 주도권을 잡아야 하는 이유',
      summary: 'RE100 가입 기업이 급증하며 재생에너지 수요가 폭발한다. 전남 태양광·풍력 발전량은 전국 1위, 그 중심에 나주가 있다. 에너지 거래 플랫폼의 표준을 선점하는 자가 시장을 지배한다.',
      content: `RE100. 기업이 사용하는 전력 100%를 재생에너지로 충당하겠다는 글로벌 캠페인이다.

삼성, 현대차, SK 등 국내 대기업들이 앞다투어 가입하고 있다. 이들이 필요로 하는 재생에너지는 어디서 오는가?

전라남도는 전국 태양광·풍력 발전량 1위다. 그리고 그 중심에 나주가 있다.

한국전력거래소가 나주에 있다는 것은 우연이 아니다. 우리는 재생에너지 거래 플랫폼의 표준을 만들어야 한다.

누가 그 표준을 만드느냐가 향후 수십조원 규모의 시장을 지배하게 될 것이다.`,
      author: {
        name: '이성훈',
        position: '본부장',
        organization: '한국전력거래소',
        avatar: null,
        bio: 'KAIST 전기전자공학과를 졸업하고, 에너지경제연구원 연구위원을 거쳐 현재 한국전력거래소 시장운영본부장을 맡고 있다.',
      },
      category: 'energy',
      publishedAt: '2025-01-06T09:00:00Z',
      thumbnail: null,
      viewCount: 1102,
      shareCount: 72,
      tags: ['RE100', 'REC', '재생에너지', '전력거래'],
    },
  };

  useEffect(() => {
    async function fetchOpinion() {
      try {
        const res = await fetch(`/api/region/naju/opinions/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.article) {
            setOpinion(data.article);
          } else {
            // API에 데이터가 없으면 샘플 사용
            setOpinion(sampleOpinions[params.id as string] || null);
          }
        } else {
          setOpinion(sampleOpinions[params.id as string] || null);
        }
      } catch {
        setOpinion(sampleOpinions[params.id as string] || null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOpinion();
  }, [params.id]);

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'energy':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          label: '에너지 밸리 파워',
          icon: <Zap className="w-4 h-4" />,
          gradient: 'from-yellow-500 to-orange-500',
        };
      case 'agriculture':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          label: '스마트 농업 리포트',
          icon: <Leaf className="w-4 h-4" />,
          gradient: 'from-green-500 to-emerald-500',
        };
      default:
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          label: '인사이트',
          icon: <Lightbulb className="w-4 h-4" />,
          gradient: 'from-purple-500 to-indigo-500',
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!opinion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <Lightbulb className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">기고문을 찾을 수 없습니다</h1>
          <p className="text-gray-500 mb-6">요청하신 인사이트가 존재하지 않거나 삭제되었습니다.</p>
          <Link
            href="/region/naju/opinion"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const catStyle = getCategoryStyle(opinion.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${catStyle.gradient} text-white py-6`}>
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/region/naju/opinion"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
              {catStyle.icon}
              {catStyle.label}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            {opinion.title}
          </h1>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 py-8">
        {/* Meta Info */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              {opinion.author.avatar ? (
                <Image
                  src={opinion.author.avatar}
                  alt={opinion.author.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <User className="w-6 h-6 text-purple-400" />
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900">{opinion.author.name}</p>
              <p className="text-sm text-gray-500">
                {opinion.author.organization} {opinion.author.position}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(opinion.publishedAt)}
            </span>
          </div>
        </div>

        {/* Summary Box */}
        <div className="bg-gray-100 rounded-xl p-6 mb-8 border-l-4 border-purple-500">
          <h2 className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            핵심 요약
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {opinion.summary}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {opinion.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="text-gray-700 leading-relaxed mb-6">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Tags */}
        {opinion.tags && opinion.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {opinion.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats & Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {opinion.viewCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              {opinion.shareCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <Bookmark className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Author Bio */}
        {opinion.author.bio && (
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">기고자 소개</h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{opinion.author.name}</p>
                <p className="text-sm text-gray-500 mb-2">
                  {opinion.author.organization} {opinion.author.position}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {opinion.author.bio}
                </p>
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
