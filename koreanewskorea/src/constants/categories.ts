/**
 * 콘텐츠 카테고리 상수 정의
 * 
 * 기사 분류용 카테고리 정보를 포함합니다.
 * GNB 메뉴, 카테고리 페이지, 기사 필터링에 사용됩니다.
 */

import { LucideIcon, Bot, TrendingUp, GraduationCap, PenSquare } from 'lucide-react';

// 카테고리 타입 정의
export interface Category {
    code: string;           // URL slug 및 DB 필터링용 코드
    name: string;           // 한글 표시명
    description: string;    // 카테고리 설명
    color: string;          // 테마 색상 (Tailwind 색상명)
    icon: string;           // 이모지 아이콘
}

// 콘텐츠 카테고리 목록
export const CONTENT_CATEGORIES: Category[] = [
    {
        code: 'ai',
        name: 'AI',
        description: '글로벌 AI 트렌드와 기술 혁신 소식',
        color: 'purple',
        icon: '🤖',
    },
    {
        code: 'politics-economy',
        name: '정치경제',
        description: '국내 정치와 경제 동향',
        color: 'amber',
        icon: '📊',
    },
    {
        code: 'education',
        name: '교육',
        description: '교육 관련 최신 뉴스',
        color: 'green',
        icon: '📚',
    },
    {
        code: 'opinion',
        name: '오피니언',
        description: '칼럼과 사설, 전문가 의견',
        color: 'slate',
        icon: '✍️',
    },
];

// 카테고리 코드로 카테고리 정보 조회
export function getCategoryByCode(code: string): Category | undefined {
    return CONTENT_CATEGORIES.find(c => c.code === code);
}

// 카테고리명으로 카테고리 정보 조회
export function getCategoryByName(name: string): Category | undefined {
    return CONTENT_CATEGORIES.find(c => c.name === name);
}

// 색상별 Tailwind 클래스 매핑
export const CATEGORY_COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; bgLight: string }> = {
    purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-600',
        bgLight: 'bg-purple-50',
    },
    amber: {
        bg: 'bg-amber-600',
        text: 'text-amber-600',
        border: 'border-amber-600',
        bgLight: 'bg-amber-50',
    },
    green: {
        bg: 'bg-green-600',
        text: 'text-green-600',
        border: 'border-green-600',
        bgLight: 'bg-green-50',
    },
    slate: {
        bg: 'bg-slate-600',
        text: 'text-slate-600',
        border: 'border-slate-600',
        bgLight: 'bg-slate-50',
    },
};
