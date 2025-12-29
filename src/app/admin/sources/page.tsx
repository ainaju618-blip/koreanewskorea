"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Building2,
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    Loader2,
    ExternalLink,
    RefreshCw,
    Phone,
    Mail,
    Globe,
    MapPin,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    Sparkles,
    Settings,
    List,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import {
    PageHeader,
    ConfirmModal,
    SlidePanel,
    FilterTabs
} from "@/components/admin/shared";
import { useToast } from '@/components/ui/Toast';

// 수집처 타입 정의
interface NewsSource {
    id: string;
    name: string;           // 기관명 (나주시)
    code: string;           // 영문 코드 (naju)
    region: string;         // 지역 (광주/전남)
    org_type: string;       // 유형 (광역시/도/시/군/교육청)

    // URL 정보
    homepage_url: string;
    press_list_url: string;
    press_detail_pattern?: string;

    // 연락처
    main_phone?: string;
    contact_dept?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;

    // 개발 상태
    scraper_status: 'completed' | 'developing' | 'planned' | 'none';
    tech_notes?: string;

    // AI 재가공
    ai_rewrite_enabled?: boolean;

    // 메타
    created_at: string;
    updated_at: string;
}

// Status badge component
const ScraperStatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        completed: { label: '완료', color: 'bg-green-900/40 text-green-400 border border-green-800', icon: <CheckCircle className="w-3 h-3" /> },
        developing: { label: '개발중', color: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800', icon: <Clock className="w-3 h-3" /> },
        planned: { label: '예정', color: 'bg-blue-900/40 text-blue-400 border border-blue-800', icon: <FileText className="w-3 h-3" /> },
        none: { label: '미개발', color: 'bg-[#21262d] text-[#8b949e] border border-[#30363d]', icon: <AlertCircle className="w-3 h-3" /> }
    };
    const { label, color, icon } = config[status] || config.none;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${color}`}>
            {icon}
            {label}
        </span>
    );
};

export default function SourcesManagementPage() {
    const { showSuccess, showError } = useToast();
    const [sources, setSources] = useState<NewsSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRegion, setFilterRegion] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // 패널/모달 상태
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; source: NewsSource | null }>({
        isOpen: false,
        source: null
    });

    // 폼 상태
    const [formData, setFormData] = useState<{
        name: string;
        code: string;
        region: string;
        org_type: string;
        homepage_url: string;
        press_list_url: string;
        press_detail_pattern: string;
        main_phone: string;
        contact_dept: string;
        contact_name: string;
        contact_phone: string;
        contact_email: string;
        scraper_status: 'completed' | 'developing' | 'planned' | 'none';
        tech_notes: string;
    }>({
        name: '',
        code: '',
        region: '전남',
        org_type: '군',
        homepage_url: '',
        press_list_url: '',
        press_detail_pattern: '',
        main_phone: '',
        contact_dept: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        scraper_status: 'none',
        tech_notes: ''
    });

    // 지역 옵션
    const regionOptions = [
        { value: '광주', label: '광주' },
        { value: '전남', label: '전남' },
        { value: 'AI', label: 'AI' },
        { value: '뉴스', label: '뉴스' }
    ];

    // 기관 유형 옵션
    const orgTypeOptions = [
        { value: '광역시', label: '광역시' },
        { value: '도', label: '도' },
        { value: '시', label: '시' },
        { value: '군', label: '군' },
        { value: '교육청', label: '교육청' },
        { value: 'AI매체', label: 'AI매체' },
        { value: '뉴스매체', label: '뉴스매체' },
        { value: '블로그', label: '블로그' },
        { value: 'RSS', label: 'RSS' }
    ];

    // 스크래퍼 상태 옵션
    const statusOptions = [
        { value: 'completed', label: '완료' },
        { value: 'developing', label: '개발중' },
        { value: 'planned', label: '예정' },
        { value: 'none', label: '미개발' }
    ];

    // 데이터 로드
    const fetchSources = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sources');
            const data = await res.json();
            setSources(data.sources || []);
        } catch (error) {
            console.error('수집처 목록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    // 패널 열기 (신규/수정)
    const openPanel = (source?: NewsSource) => {
        if (source) {
            setEditingSource(source);
            setFormData({
                name: source.name,
                code: source.code,
                region: source.region,
                org_type: source.org_type,
                homepage_url: source.homepage_url,
                press_list_url: source.press_list_url,
                press_detail_pattern: source.press_detail_pattern || '',
                main_phone: source.main_phone || '',
                contact_dept: source.contact_dept || '',
                contact_name: source.contact_name || '',
                contact_phone: source.contact_phone || '',
                contact_email: source.contact_email || '',
                scraper_status: source.scraper_status,
                tech_notes: source.tech_notes || ''
            });
        } else {
            setEditingSource(null);
            setFormData({
                name: '',
                code: '',
                region: '전남',
                org_type: '군',
                homepage_url: '',
                press_list_url: '',
                press_detail_pattern: '',
                main_phone: '',
                contact_dept: '',
                contact_name: '',
                contact_phone: '',
                contact_email: '',
                scraper_status: 'none',
                tech_notes: ''
            });
        }
        setIsPanelOpen(true);
    };

    // 저장
    const handleSave = async () => {
        if (!formData.name || !formData.code) {
            showError('기관명과 영문 코드는 필수입니다.');
            return;
        }

        setSaving(true);
        try {
            const url = editingSource
                ? `/api/sources/${editingSource.id}`
                : '/api/sources';

            const res = await fetch(url, {
                method: editingSource ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showSuccess(editingSource ? '수정되었습니다.' : '추가되었습니다.');
                setIsPanelOpen(false);
                fetchSources();
            } else {
                const err = await res.json();
                throw new Error(err.message || '저장 실패');
            }
        } catch (error: any) {
            showError('저장 실패: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // 삭제 확인
    const confirmDelete = (source: NewsSource) => {
        setConfirmModal({ isOpen: true, source });
    };

    // 삭제 실행
    const handleDelete = async () => {
        if (!confirmModal.source) return;

        try {
            const res = await fetch(`/api/sources/${confirmModal.source.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                showSuccess('삭제되었습니다.');
                fetchSources();
            } else {
                throw new Error('삭제 실패');
            }
        } catch (error) {
            showError('삭제에 실패했습니다.');
        } finally {
            setConfirmModal({ isOpen: false, source: null });
        }
    };

    // 필터링된 목록 - memoized to prevent recalculation
    const filteredSources = useMemo(() => {
        return sources.filter(source => {
            const matchesSearch = searchQuery === '' ||
                source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                source.code.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRegion = filterRegion === 'all' || source.region === filterRegion;
            const matchesStatus = filterStatus === 'all' || source.scraper_status === filterStatus;
            return matchesSearch && matchesRegion && matchesStatus;
        });
    }, [sources, searchQuery, filterRegion, filterStatus]);

    // 통계 - memoized
    const stats = useMemo(() => ({
        total: sources.length,
        completed: sources.filter(s => s.scraper_status === 'completed').length,
        developing: sources.filter(s => s.scraper_status === 'developing').length,
        planned: sources.filter(s => s.scraper_status === 'planned').length
    }), [sources]);

    return (
        <div className="space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-4 border-b border-[#30363d] pb-4 mb-6">
                <h1 className="text-2xl font-bold text-[#e6edf3]">수집처 관리</h1>
                <div className="flex-1" />
                <div className="flex bg-[#21262d] p-1 rounded-lg">
                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#161b22] text-blue-400 shadow-sm rounded-md border border-[#30363d]">
                        <List className="w-4 h-4" />
                        수집처 관리
                    </div>
                    <Link
                        href="/admin/settings/ai"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#8b949e] hover:text-[#e6edf3] rounded-md transition"
                    >
                        <Settings className="w-4 h-4" />
                        AI 설정
                    </Link>
                </div>
            </div>

            <PageHeader
                title=""
                description="뉴스 수집 대상 기관을 관리하고 스크래퍼 상태를 모니터링합니다."
                actions={
                    <button
                        onClick={() => openPanel()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        새 수집처 등록
                    </button>
                }
            />
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => openPanel()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        수집처 추가
                    </button>
                    <button
                        onClick={fetchSources}
                        className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-[#c9d1d9] hover:bg-[#30363d] flex items-center gap-2 shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4">
                    <p className="text-sm text-[#8b949e]">전체 기관</p>
                    <p className="text-2xl font-bold text-[#e6edf3]">{stats.total}</p>
                </div>
                <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4">
                    <p className="text-sm text-[#8b949e]">스크래퍼 완료</p>
                    <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                </div>
                <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4">
                    <p className="text-sm text-[#8b949e]">개발 중</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.developing}</p>
                </div>
                <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4">
                    <p className="text-sm text-[#8b949e]">개발 예정</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.planned}</p>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6e7681] w-4 h-4" />
                        <input
                            type="text"
                            placeholder="기관명 또는 코드 검색..."
                            className="w-full pl-10 pr-4 py-2 border border-[#30363d] rounded-lg text-sm bg-[#0d1117] text-[#c9d1d9] placeholder-[#6e7681] focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-[#30363d] rounded-lg px-3 py-2 text-sm bg-[#0d1117] text-[#c9d1d9]"
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value)}
                    >
                        <option value="all">모든 지역</option>
                        <option value="광주">광주</option>
                        <option value="전남">전남</option>
                        <option value="AI">AI</option>
                        <option value="뉴스">뉴스</option>
                    </select>
                </div>
                <FilterTabs
                    tabs={[
                        { key: 'all', label: '전체' },
                        { key: 'completed', label: '완료' },
                        { key: 'developing', label: '개발중' },
                        { key: 'planned', label: '예정' },
                        { key: 'none', label: '미개발' }
                    ]}
                    activeTab={filterStatus}
                    onChange={setFilterStatus}
                />
            </div>

            {/* Table */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    </div>
                ) : filteredSources.length === 0 ? (
                    <div className="text-center py-12 text-[#8b949e]">
                        <Building2 className="w-12 h-12 mx-auto mb-4 text-[#484f58]" />
                        <p>등록된 수집처가 없습니다.</p>
                        <button
                            onClick={() => openPanel()}
                            className="mt-4 text-blue-400 hover:underline"
                        >
                            첫 번째 기관 추가하기
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-[#21262d] border-b border-[#30363d]">
                                <th className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase w-10">No</th>
                                <th className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase">기관명</th>
                                <th className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase">코드</th>
                                <th className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase w-14">지역</th>
                                <th className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase w-16">유형</th>
                                <th className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase w-12">AI</th>
                                <th className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase">보도자료 URL</th>
                                <th className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase w-16">상태</th>
                                <th className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase w-16">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#21262d]">
                            {filteredSources.map((source, index) => (
                                <tr key={source.id} className="hover:bg-[#21262d] cursor-pointer" onClick={() => openPanel(source)}>
                                    <td className="px-3 py-1.5 text-[#8b949e]">{index + 1}</td>
                                    <td className="px-3 py-1.5">
                                        <span className="font-medium text-[#e6edf3]">{source.name}</span>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <code className="text-xs bg-[#21262d] px-1.5 py-0.5 rounded text-[#8b949e]">{source.code}</code>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${source.region === '광주' ? 'bg-purple-900/40 text-purple-400' :
                                            source.region === '전남' ? 'bg-blue-900/40 text-blue-400' :
                                                source.region === 'AI' ? 'bg-emerald-900/40 text-emerald-400' :
                                                    source.region === '뉴스' ? 'bg-orange-900/40 text-orange-400' :
                                                        'bg-[#21262d] text-[#8b949e]'
                                            }`}>
                                            {source.region}
                                        </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-[#8b949e]">{source.org_type}</td>
                                    <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`/api/sources/${source.id}`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ ai_rewrite_enabled: !source.ai_rewrite_enabled })
                                                    });
                                                    if (res.ok) {
                                                        fetchSources();
                                                    }
                                                } catch (err) {
                                                    console.error('AI toggle failed:', err);
                                                }
                                            }}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${source.ai_rewrite_enabled ? 'bg-purple-600' : 'bg-[#484f58]'
                                                }`}
                                            title={source.ai_rewrite_enabled ? 'AI 재가공 활성화됨' : 'AI 재가공 비활성화'}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${source.ai_rewrite_enabled ? 'translate-x-5' : ''
                                                    }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        {source.press_list_url ? (
                                            <a
                                                href={source.press_list_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                                            >
                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{new URL(source.press_list_url).hostname}</span>
                                            </a>
                                        ) : (
                                            <span className="text-[#484f58]">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <ScraperStatusBadge status={source.scraper_status} />
                                    </td>
                                    <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openPanel(source)}
                                                className="p-1 text-[#8b949e] hover:text-blue-400 hover:bg-blue-900/30 rounded"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(source)}
                                                className="p-1 text-[#8b949e] hover:text-red-400 hover:bg-red-900/30 rounded"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 수정/추가 슬라이드 패널 */}
            <SlidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                title={editingSource ? '기관 정보 수정' : '신규 기관 추가'}
                subtitle={editingSource ? `코드: ${editingSource.code}` : '수집 대상 기관의 정보를 입력하세요'}
                width="xl"
                headerActions={
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        저장
                    </button>
                }
            >
                <div className="space-y-6">
                    {/* 기본 정보 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            기본 정보
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">기관명 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="예: 나주시"
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-[#484f58]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">영문 코드 *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                                    placeholder="예: naju"
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono placeholder:text-[#484f58]"
                                />
                                <p className="text-xs text-[#8b949e] mt-1">스크래퍼 폴더명과 동일하게 입력</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">지역</label>
                                <select
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                >
                                    {regionOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">기관 유형</label>
                                <select
                                    value={formData.org_type}
                                    onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                >
                                    {orgTypeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* URL 정보 */}
                    <div className="space-y-4 pt-4 border-t border-[#30363d]">
                        <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
                            <Globe className="w-4 h-4 text-green-400" />
                            URL 정보
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-[#c9d1d9] mb-1">기관 홈페이지</label>
                            <input
                                type="url"
                                value={formData.homepage_url}
                                onChange={(e) => setFormData({ ...formData, homepage_url: e.target.value })}
                                placeholder="https://www.naju.go.kr"
                                className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-[#484f58]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#c9d1d9] mb-1">보도자료 목록 URL</label>
                            <input
                                type="url"
                                value={formData.press_list_url}
                                onChange={(e) => setFormData({ ...formData, press_list_url: e.target.value })}
                                placeholder="https://www.naju.go.kr/news/..."
                                className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-[#484f58]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#c9d1d9] mb-1">상세 URL 패턴 (선택)</label>
                            <input
                                type="text"
                                value={formData.press_detail_pattern}
                                onChange={(e) => setFormData({ ...formData, press_detail_pattern: e.target.value })}
                                placeholder="예: /news/view?id={id}"
                                className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm placeholder:text-[#484f58]"
                            />
                        </div>
                    </div>

                    {/* 연락처 정보 */}
                    <div className="space-y-4 pt-4 border-t border-[#30363d]">
                        <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
                            <Phone className="w-4 h-4 text-purple-400" />
                            연락처 정보
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-[#c9d1d9] mb-1">대표 전화</label>
                            <input
                                type="tel"
                                value={formData.main_phone}
                                onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                                placeholder="061-XXX-XXXX"
                                className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-[#484f58]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">홍보 담당 부서</label>
                                <input
                                    type="text"
                                    value={formData.contact_dept}
                                    onChange={(e) => setFormData({ ...formData, contact_dept: e.target.value })}
                                    placeholder="예: 홍보담당관실"
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-[#484f58]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">담당자명</label>
                                <input
                                    type="text"
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    placeholder="예: 홍길동"
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-[#484f58]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">담당자 전화</label>
                                <input
                                    type="tel"
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                    placeholder="061-XXX-XXXX"
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-[#484f58]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">담당자 이메일</label>
                                <input
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    placeholder="example@naju.go.kr"
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-[#484f58]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 개발 정보 */}
                    <div className="space-y-4 pt-4 border-t border-[#30363d]">
                        <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-400" />
                            개발 정보
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-[#c9d1d9] mb-1">스크래퍼 상태</label>
                            <select
                                value={formData.scraper_status}
                                onChange={(e) => setFormData({ ...formData, scraper_status: e.target.value as any })}
                                className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#c9d1d9] mb-1">기술 메모</label>
                            <textarea
                                value={formData.tech_notes}
                                onChange={(e) => setFormData({ ...formData, tech_notes: e.target.value })}
                                placeholder="JS 렌더링 필요, 로그인 필요, 특이사항 등..."
                                rows={3}
                                className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none placeholder:text-[#484f58]"
                            />
                        </div>
                    </div>
                </div>
            </SlidePanel>

            {/* Footer Navigation (User Request) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pb-12">
                {/* Left: API Key Issuance */}
                <div className="bg-gray-900 rounded-xl p-6 text-white">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <ExternalLink className="w-5 h-5 text-yellow-400" />
                        API 키 발급 바로가기
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center py-3 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-blue-400 hover:text-blue-300 transition text-sm font-medium"
                        >
                            Google AI Studio (Gemini - 무료/Pay-as-you-go)
                        </a>
                        <a
                            href="https://console.cloud.google.com/enable-mfa?redirectTo=%2F"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center py-3 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-indigo-400 hover:text-indigo-300 transition text-sm font-medium"
                        >
                            Google Cloud Console (유료/MFA 설정)
                        </a>
                        <a
                            href="https://console.anthropic.com/settings/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center py-3 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-amber-600 hover:text-amber-500 transition text-sm font-medium"
                        >
                            Anthropic Console (Claude)
                        </a>
                        <a
                            href="https://console.x.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center py-3 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition text-sm font-medium"
                        >
                            xAI Console (Grok)
                        </a>
                    </div>
                </div>

                {/* Right: Go to AI Settings */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            AI 설정으로 이동
                        </h3>
                        <p className="text-blue-100 text-sm mb-6">
                            발급받은 키를 등록하거나, 자동 기사 작성 시스템 프롬프트를 수정하려면 AI 설정 페이지로 이동하세요.
                        </p>
                    </div>
                    <Link
                        href="/admin/settings/ai"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-white text-blue-700 rounded-lg font-bold hover:bg-blue-50 transition shadow-lg"
                    >
                        AI 설정 페이지 바로가기
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* 삭제 확인 모달 */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="기관 삭제"
                message={`"${confirmModal.source?.name}" 기관을 삭제하시겠습니까?`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmModal({ isOpen: false, source: null })}
            />
        </div>
    );
}
