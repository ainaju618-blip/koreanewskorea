'use client';
import { useState } from 'react';

const TABS = ['인사', '동정', '부고', '결혼'];

const DATA: Record<string, string[]> = {
    '인사': [
        '[발령] 코리아NEWS 편집국장 김철수',
        '[승진] 광고사업본부 부장 이영희',
        '[전보] 경영기획실 실장 박민수'
    ],
    '동정': [
        '이낙연 전 대표, 광주 비엔날레 방문',
        '김영록 지사, 도민과의 대화 개최',
        '강기정 시장, AI 산업단지 시찰'
    ],
    '부고': [
        '[부고] 홍길동씨 별세',
        '[부고] 김철수씨 조모상',
        '[부고] 이영희씨 빙부상'
    ],
    '결혼': [
        '[결혼] 박민수군, 최영희양 (12/25)',
        '[결혼] 김철수군, 이영희양 (01/01)'
    ]
};

export default function TabbedBoard() {
    const [activeTab, setActiveTab] = useState('인사');

    return (
        <div className="border border-slate-200 bg-white">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm font-bold text-center transition-colors
                 ${activeTab === tab ? 'bg-white text-slate-900 border-b-2 border-slate-900' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}
              `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4 h-40">
                <ul className="space-y-2">
                    {DATA[activeTab]?.map((item, i) => (
                        <li key={i} className="text-xs text-slate-700 truncate cursor-pointer hover:underline">
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
