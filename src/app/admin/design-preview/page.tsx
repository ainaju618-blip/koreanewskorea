"use client";

import React, { useState } from "react";
import {
    LayoutDashboard,
    Newspaper,
    Bot,
    Users,
    Settings,
    Play,
    Calendar,
    Filter,
    CheckCircle,
    X,
    Search,
    ChevronRight,
    UserPlus
} from "lucide-react";

// --- Mock Data ---
const MOCK_NEWS = [
    { id: 1, title: "[나주] 혁신도시 시즌2, 공공기관 이전 로드맵 발표 임박", category: "나주", date: "2025-12-07 09:30", status: "Draft" },
    { id: 2, title: "[전남] 도청 이전 20주년 기념식 개최... '세계로 웅비하는 전남'", category: "전남", date: "2025-12-07 09:15", status: "Published" },
    { id: 3, title: "[교육] 2026학년도 고교학점제 전면 시행, 무엇이 달라지나?", category: "교육", date: "2025-12-07 08:45", status: "Draft" },
    { id: 4, title: "[광주] AI 데이터센터 가동률 80% 돌파, 기업 입주 줄이어", category: "광주", date: "2025-12-06 18:20", status: "Published" },
    { id: 5, title: "[속보] 영산강 유역 고대 마한 유적 대규모 발굴", category: "문화", date: "2025-12-06 17:00", status: "Trash" },
];

const MOCK_REPORTERS = [
    { id: 'b1', name: '나빛가람 기자', role: 'AI Bot', region: '나주/혁신도시', status: 'Active' },
    { id: 'b2', name: '여수바다 기자', role: 'AI Bot', region: '여수/순천', status: 'Active' },
    { id: 'h1', name: '김철수', role: 'Human', region: '광주 본부', status: 'Active' },
];

export default function DesignPreviewPage() {
    const [activeTab, setActiveTab] = useState("news"); // 'dashboard', 'news', 'bot', 'users', 'settings'
    const [selectedArticle, setSelectedArticle] = useState<any>(null);

    // Bot Control State
    const [selectedRegions, setSelectedRegions] = useState<string[]>(["naju", "gwangju"]);

    const regions = [
        { id: "gwangju", label: "광주광역시" },
        { id: "jeonnam", label: "전라남도" },
        { id: "naju", label: "나주시" },
        { id: "mokpo", label: "목포시" },
        { id: "yeosu", label: "여수시" },
        { id: "suncheon", label: "순천시" },
        { id: "gwangyang", label: "광양시" },
        { id: "damyang", label: "담양군" },
        { id: "hampyeong", label: "함평군" },
        { id: "muan", label: "무안군" },
    ];

    return (
        <div className="flex h-screen bg-[#0d1117] text-[#e6edf3] font-sans">
            {/* 1. Sidebar (New Design) */}
            <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col shadow-sm">
                <div className="p-6 border-b border-[#30363d] flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
                    <span className="text-lg font-bold text-[#e6edf3] tracking-tight">Korea CMS</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="통합 대시보드" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />

                    <div className="pt-4 pb-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider px-3">Contents</div>
                    <SidebarItem icon={Newspaper} label="기사 관리" active={activeTab === 'news'} onClick={() => setActiveTab('news')} />
                    <SidebarItem icon={Bot} label="봇 관리 센터" active={activeTab === 'bot'} onClick={() => setActiveTab('bot')} highlight />

                    <div className="pt-4 pb-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider px-3">Management</div>
                    <SidebarItem icon={Users} label="사용자/기자 관리" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <SidebarItem icon={Settings} label="시스템 설정" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>

                <div className="p-4 border-t border-[#30363d]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#21262d]" />
                        <div>
                            <p className="text-sm font-medium text-[#e6edf3]">발행인</p>
                            <p className="text-xs text-[#8b949e]">Master Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 2. Main Content Area */}
            <main className="flex-1 overflow-auto flex relative">
                <div className="flex-1 p-8 max-w-7xl mx-auto">

                    {/* Header */}
                    <header className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-[#e6edf3]">
                                {activeTab === 'bot' ? '🤖 봇 관리 센터 (Bot Control Center)' :
                                    activeTab === 'users' ? '👥 사용자/기자 관리' : '📰 기사 관리'}
                            </h1>
                            <p className="text-sm text-[#8b949e] mt-1">
                                {activeTab === 'bot' ? '뉴스 수집 봇의 스케줄과 수집 대상을 제어합니다.' :
                                    activeTab === 'users' ? '시민 기자와 AI 기자를 등록하고 관리합니다.' : '수집된 기사를 검수하고 발행합니다.'}
                            </p>
                        </div>
                        {activeTab === 'news' && (
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8b949e]" />
                                    <input type="text" placeholder="기사 검색..." className="pl-9 pr-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">기사 작성</button>
                            </div>
                        )}
                    </header>

                    {/* CONTENT: BOT CONTROL */}
                    {activeTab === 'bot' && (
                        <div className="space-y-6">
                            {/* Control Panel Card */}
                            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[#30363d] bg-[#21262d] flex justify-between items-center">
                                    <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2">
                                        <Play className="w-5 h-5 text-blue-600" /> 수동 수집 제어
                                    </h3>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
                                        시스템 정상 대기중
                                    </span>
                                </div>
                                <div className="p-6">
                                    {/* Date Range */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-[#c9d1d9] mb-2 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> 수집 기간 설정
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input type="date" className="bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded px-3 py-2 text-sm" defaultValue="2025-12-01" />
                                            <span className="text-[#8b949e]">~</span>
                                            <input type="date" className="bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded px-3 py-2 text-sm" defaultValue="2025-12-07" />
                                            <button className="text-xs text-blue-400 hover:underline px-2">최근 1주일</button>
                                            <button className="text-xs text-blue-400 hover:underline px-2">오늘</button>
                                        </div>
                                        <p className="text-xs text-[#8b949e] mt-1">* 기간을 길게 설정하면 서버 부하가 발생할 수 있습니다.</p>
                                    </div>

                                    {/* Region Select */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-[#c9d1d9] mb-2 flex items-center gap-2">
                                            <Filter className="w-4 h-4" /> 수집 대상 지역 (Target Regions)
                                        </label>
                                        <div className="grid grid-cols-4 gap-3 bg-[#0d1117] p-4 rounded-lg border border-[#30363d]">
                                            {regions.map((region) => (
                                                <label key={region.id} className="flex items-center gap-2 cursor-pointer hover:bg-[#21262d] p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRegions.includes(region.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedRegions([...selectedRegions, region.id]);
                                                            else setSelectedRegions(selectedRegions.filter(r => r !== region.id));
                                                        }}
                                                        className="rounded border-[#30363d] bg-[#0d1117] text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-[#c9d1d9]">{region.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition">
                                            <Play className="w-4 h-4" /> 선택한 조건으로 수집 시작
                                        </button>
                                        <button className="px-6 py-2.5 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] rounded-lg font-medium hover:bg-[#30363d] transition">
                                            Dry Run (테스트)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Card */}
                            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden p-6">
                                <h3 className="font-semibold text-[#e6edf3] mb-4">⏰ 자동 수집 스케줄</h3>
                                <div className="space-y-3">
                                    <ScheduleItem time="09:00" label="조간 뉴스 수집 (아침)" active />
                                    <ScheduleItem time="13:00" label="점심 속보 수집" active />
                                    <ScheduleItem time="17:00" label="석간/마감 뉴스 수집" active={false} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTENT: NEWS LIST */}
                    {activeTab === 'news' && (
                        <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#21262d] border-b border-[#30363d] text-xs text-[#8b949e] uppercase tracking-wider">
                                        <th className="px-6 py-3 font-medium cursor-pointer hover:bg-[#30363d]">검택</th>
                                        <th className="px-6 py-3 font-medium">제목</th>
                                        <th className="px-6 py-3 font-medium">카테고리</th>
                                        <th className="px-6 py-3 font-medium">작성일</th>
                                        <th className="px-6 py-3 font-medium text-center">상태</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#21262d]">
                                    {MOCK_NEWS.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedArticle(item)}
                                            className={`cursor-pointer hover:bg-[#21262d] transition ${selectedArticle?.id === item.id ? 'bg-[#21262d]' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="rounded border-[#30363d] bg-[#0d1117]" onClick={(e) => e.stopPropagation()} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className={`text-sm font-medium ${selectedArticle?.id === item.id ? 'text-blue-400' : 'text-[#e6edf3]'}`}>{item.title}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#21262d] text-[#8b949e]">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#8b949e]">{item.date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={item.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 border-t border-[#30363d] bg-[#0d1117] text-center text-xs text-[#8b949e]">
                                1-5 of 128 items Showing
                            </div>
                        </div>
                    )}

                    {/* CONTENT: USER MANAGEMENT */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] flex-1 shadow-sm">
                                    <h3 className="text-[#8b949e] text-sm font-medium mb-1">총 활동 기자</h3>
                                    <p className="text-3xl font-bold text-[#e6edf3]">8명</p>
                                    <div className="mt-2 text-xs text-blue-400 font-medium">+2명 (이번 달)</div>
                                </div>
                                <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] flex-1 shadow-sm">
                                    <h3 className="text-[#8b949e] text-sm font-medium mb-1">총 구독자</h3>
                                    <p className="text-3xl font-bold text-[#e6edf3]">1,284명</p>
                                    <div className="mt-2 text-xs text-green-400 font-medium">+15% 증가</div>
                                </div>
                            </div>

                            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-[#e6edf3]">기자단 목록 (Reporters)</h3>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] text-[#e6edf3] rounded text-sm hover:bg-[#30363d] border border-[#30363d]">
                                        <UserPlus className="w-4 h-4" /> 기자 추가
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {MOCK_REPORTERS.map((reporter) => (
                                        <div key={reporter.id} className="border border-[#30363d] rounded-lg p-4 flex items-center gap-3 hover:border-blue-500 transition cursor-pointer bg-[#0d1117]">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${reporter.role === 'AI Bot' ? 'bg-purple-900/50 text-purple-400' : 'bg-[#21262d] text-[#8b949e]'}`}>
                                                {reporter.role === 'AI Bot' ? '🤖' : '👤'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[#e6edf3] text-sm">{reporter.name}</p>
                                                <p className="text-xs text-[#8b949e]">{reporter.region} | {reporter.role}</p>
                                            </div>
                                            <span className="ml-auto w-2 h-2 rounded-full bg-green-500"></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* 3. Sliding Detail Panel (Review Mode) */}
                {selectedArticle && activeTab === 'news' && (
                    <div className="w-[480px] border-l border-[#30363d] bg-[#161b22] h-full shadow-xl flex flex-col animate-slide-in-right z-10 transition-transform">
                        <div className="p-5 border-b border-[#30363d] flex justify-between items-start bg-[#21262d]">
                            <div>
                                <h2 className="text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1">Article Preview</h2>
                                <StatusBadge status={selectedArticle.status} />
                            </div>
                            <button onClick={() => setSelectedArticle(null)} className="text-[#8b949e] hover:text-[#e6edf3]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <h1 className="text-xl font-bold text-[#e6edf3] leading-snug mb-4">{selectedArticle.title}</h1>
                            <div className="flex items-center gap-2 text-xs text-[#8b949e] mb-6">
                                <span>{selectedArticle.category}</span>
                                <span>•</span>
                                <span>{selectedArticle.date}</span>
                                <span>•</span>
                                <span>By 나빛가람 기자</span>
                            </div>

                            {/* Mock Content */}
                            <div className="prose prose-sm max-w-none text-[#c9d1d9] space-y-4">
                                <div className="w-full h-48 bg-[#0d1117] rounded-lg flex items-center justify-center text-[#8b949e] mb-4">
                                    (이미지 미리보기 영역)
                                </div>
                                <p>
                                    동해물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세.
                                    무궁화 삼천리 화려강산 대한사람 대한으로 길이 보전하세.
                                </p>
                                <p>
                                    이 기사는 AI 봇에 의해 자동으로 수집되고 작성된 초안입니다. 발행 전 팩트 체크가 필요합니다.
                                    관리자가 내용을 수정하면 'Draft' 상태가 유지되며, '발행' 버튼을 누르면 즉시 사이트에 반영됩니다.
                                </p>
                                <p>
                                    (이하 생략...)
                                </p>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex gap-2">
                            {selectedArticle.status === 'Draft' ? (
                                <>
                                    <button className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition">
                                        발행 승인 (Publish)
                                    </button>
                                    <button className="flex-1 py-2.5 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] rounded-lg font-medium hover:bg-[#30363d] transition">
                                        수정하기
                                    </button>
                                </>
                            ) : (
                                <button className="flex-1 py-2.5 bg-[#21262d] border border-[#30363d] text-red-400 rounded-lg font-medium hover:bg-red-900/30 transition">
                                    발행 취소 (Unpublish)
                                </button>
                            )}
                            <button className="px-3 py-2.5 text-[#8b949e] hover:text-red-400 transition">
                                <span className="sr-only">삭제</span>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// --- Components ---

function SidebarItem({ icon: Icon, label, active, onClick, highlight }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1
        ${active
                    ? 'bg-blue-900/50 text-blue-400 shadow-sm'
                    : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'}
        ${highlight && !active ? 'text-blue-400 bg-blue-900/30' : ''}
      `}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-[#8b949e]'}`} />
            {label}
            {highlight && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        Draft: "bg-yellow-900/50 text-yellow-400 border-yellow-800",
        Published: "bg-green-900/50 text-green-400 border-green-800",
        Trash: "bg-red-900/50 text-red-400 border-red-800",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || 'bg-[#21262d]'}`}>
            {status === 'Draft' && '● 승인 대기'}
            {status === 'Published' && '● 발행됨'}
            {status === 'Trash' && '● 삭제됨'}
        </span>
    );
}

function ScheduleItem({ time, label, active }: any) {
    return (
        <div className="flex items-center justify-between p-3 border border-[#30363d] rounded-lg bg-[#0d1117]">
            <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-[#e6edf3] bg-[#21262d] px-2 py-1 rounded border border-[#30363d] shadow-sm">{time}</span>
                <span className="text-sm text-[#c9d1d9]">{label}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative cursor-pointer transition ${active ? 'bg-blue-500' : 'bg-[#30363d]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${active ? 'left-5.5' : 'left-0.5'}`} />
            </div>
        </div>
    )
}
