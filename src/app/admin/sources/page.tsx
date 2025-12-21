"use client";

import React, { useState, useEffect } from "react";
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
    Sparkles
} from "lucide-react";
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

// 상태 배지 컴포넌트
const ScraperStatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        completed: { label: '완료', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
        developing: { label: '개발중', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
        planned: { label: '예정', color: 'bg-blue-100 text-blue-700', icon: <FileText className="w-3 h-3" /> },
        none: { label: '미개발', color: 'bg-gray-100 text-gray-500', icon: <AlertCircle className="w-3 h-3" /> }
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

    // 필터링된 목록
    const filteredSources = sources.filter(source => {
        const matchesSearch = searchQuery === '' ||
            source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            source.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRegion = filterRegion === 'all' || source.region === filterRegion;
        const matchesStatus = filterStatus === 'all' || source.scraper_status === filterStatus;
        return matchesSearch && matchesRegion && matchesStatus;
    });

    // 통계
    const stats = {
        total: sources.length,
        completed: sources.filter(s => s.scraper_status === 'completed').length,
        developing: sources.filter(s => s.scraper_status === 'developing').length,
        planned: sources.filter(s => s.scraper_status === 'planned').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <PageHeader
                    title="수집처 관리"
                    description="뉴스 수집 대상 기관의 기초 정보를 관리합니다. 스크래퍼 개발 시 참고 자료로 활용됩니다."
                    icon={Building2}
                    iconBgColor="bg-emerald-600"
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => openPanel()}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2 font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        수집처 추가
                    </button>
                    <button
                        onClick={fetchSources}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">전체 기관</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">스크래퍼 완료</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">개발 중</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.developing}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">개발 예정</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
                </div>
            </div>

            {/* 필터 툴바 */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="기관명 또는 코드 검색..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
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

            {/* 테이블 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : filteredSources.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>등록된 수집처가 없습니다.</p>
                        <button
                            onClick={() => openPanel()}
                            className="mt-4 text-emerald-600 hover:underline"
                        >
                            첫 번째 기관 추가하기
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-10">No</th>
                                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">기관명</th>
                                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">코드</th>
                                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-14">지역</th>
                                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-16">유형</th>
                                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-12">AI</th>
                                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">보도자료 URL</th>
                                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-16">상태</th>
                                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-16">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSources.map((source, index) => (
                                <tr key={source.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openPanel(source)}>
                                    <td className="px-3 py-1.5 text-gray-400">{index + 1}</td>
                                    <td className="px-3 py-1.5">
                                        <span className="font-medium text-gray-900">{source.name}</span>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{source.code}</code>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${source.region === '광주' ? 'bg-purple-100 text-purple-700' :
                                                source.region === '전남' ? 'bg-blue-100 text-blue-700' :
                                                    source.region === 'AI' ? 'bg-emerald-100 text-emerald-700' :
                                                        source.region === '뉴스' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-700'
                                            }`}>
                                            {source.region}
                                        </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-600">{source.org_type}</td>
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
                                                    console.error('AI 토글 실패:', err);
                                                }
                                            }}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${source.ai_rewrite_enabled ? 'bg-purple-600' : 'bg-gray-300'
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
                                                className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                                            >
                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{new URL(source.press_list_url).hostname}</span>
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <ScraperStatusBadge status={source.scraper_status} />
                                    </td>
                                    <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openPanel(source)}
                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(source)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            기본 정보
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">기관명 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="예: 나주시"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">영문 코드 *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                                    placeholder="예: naju"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-1">스크래퍼 폴더명과 동일하게 입력</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                                <select
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    {regionOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">기관 유형</label>
                                <select
                                    value={formData.org_type}
                                    onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    {orgTypeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* URL 정보 */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            URL 정보
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">기관 홈페이지</label>
                            <input
                                type="url"
                                value={formData.homepage_url}
                                onChange={(e) => setFormData({ ...formData, homepage_url: e.target.value })}
                                placeholder="https://www.naju.go.kr"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">보도자료 목록 URL</label>
                            <input
                                type="url"
                                value={formData.press_list_url}
                                onChange={(e) => setFormData({ ...formData, press_list_url: e.target.value })}
                                placeholder="https://www.naju.go.kr/news/..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">상세 URL 패턴 (선택)</label>
                            <input
                                type="text"
                                value={formData.press_detail_pattern}
                                onChange={(e) => setFormData({ ...formData, press_detail_pattern: e.target.value })}
                                placeholder="예: /news/view?id={id}"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* 연락처 정보 */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            연락처 정보
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">대표 전화</label>
                            <input
                                type="tel"
                                value={formData.main_phone}
                                onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                                placeholder="061-XXX-XXXX"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">홍보 담당 부서</label>
                                <input
                                    type="text"
                                    value={formData.contact_dept}
                                    onChange={(e) => setFormData({ ...formData, contact_dept: e.target.value })}
                                    placeholder="예: 홍보담당관실"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">담당자명</label>
                                <input
                                    type="text"
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    placeholder="예: 홍길동"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">담당자 전화</label>
                                <input
                                    type="tel"
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                    placeholder="061-XXX-XXXX"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">담당자 이메일</label>
                                <input
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    placeholder="example@naju.go.kr"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 개발 정보 */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            개발 정보
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">스크래퍼 상태</label>
                            <select
                                value={formData.scraper_status}
                                onChange={(e) => setFormData({ ...formData, scraper_status: e.target.value as any })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">기술 메모</label>
                            <textarea
                                value={formData.tech_notes}
                                onChange={(e) => setFormData({ ...formData, tech_notes: e.target.value })}
                                placeholder="JS 렌더링 필요, 로그인 필요, 특이사항 등..."
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>
            </SlidePanel>

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
