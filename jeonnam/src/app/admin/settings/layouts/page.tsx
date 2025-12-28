"use client";

import React, { useState, useEffect } from "react";
import { LayoutGrid, Plus, Edit2, Trash2, Loader2, X, Check, GripVertical, Eye, Image, List, Grid3X3, Newspaper, TrendingUp } from "lucide-react";
import { useToast } from '@/components/ui/Toast';

interface LayoutSection {
    id: string;
    page_type: 'home' | 'category';
    page_slug?: string;
    section_name: string;
    section_type: 'hero' | 'carousel' | 'grid' | 'list' | 'ticker' | 'sidebar';
    source_type: 'latest' | 'category' | 'trending' | 'featured' | 'manual';
    source_category_ids?: string[];
    order_index: number;
    items_count: number;
    title?: string;
    show_more_link: boolean;
    background?: string;
    is_active: boolean;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    depth: number;
}

const SECTION_TYPES = [
    { value: 'hero', label: '히어로 (대형 배너)', icon: Image },
    { value: 'carousel', label: '캐러셀 (슬라이드)', icon: Newspaper },
    { value: 'grid', label: '그리드 (격자형)', icon: Grid3X3 },
    { value: 'list', label: '리스트 (목록형)', icon: List },
    { value: 'ticker', label: '속보 티커', icon: TrendingUp },
];

const SOURCE_TYPES = [
    { value: 'latest', label: '최신 기사' },
    { value: 'category', label: '특정 카테고리' },
    { value: 'trending', label: '인기 기사' },
    { value: 'featured', label: '편집자 추천' },
];

export default function LayoutsPage() {
    const { showSuccess, showError } = useToast();
    const [layouts, setLayouts] = useState<LayoutSection[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageType, setPageType] = useState<'home' | 'category'>('home');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingLayout, setEditingLayout] = useState<LayoutSection | null>(null);
    const [saving, setSaving] = useState(false);

    // 삭제 확인 모달
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; layout: LayoutSection | null }>({ isOpen: false, layout: null });
    const [formData, setFormData] = useState({
        section_name: '',
        section_type: 'grid' as LayoutSection['section_type'],
        source_type: 'latest' as LayoutSection['source_type'],
        source_category_ids: [] as string[],
        items_count: 6,
        title: '',
        show_more_link: true,
        background: '',
    });

    // 데이터 로딩
    const fetchData = async () => {
        try {
            const [layoutsRes, catsRes] = await Promise.all([
                fetch(`/api/layouts?page_type=${pageType}`),
                fetch('/api/categories?flat=true')
            ]);
            const layoutsData = await layoutsRes.json();
            const catsData = await catsRes.json();
            setLayouts(layoutsData.layouts || []);
            setCategories(catsData.flat || []);
        } catch (err) {
            console.error('데이터 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [pageType]);

    // 모달 열기
    const openModal = (layout?: LayoutSection) => {
        if (layout) {
            setEditingLayout(layout);
            setFormData({
                section_name: layout.section_name,
                section_type: layout.section_type,
                source_type: layout.source_type,
                source_category_ids: layout.source_category_ids || [],
                items_count: layout.items_count,
                title: layout.title || '',
                show_more_link: layout.show_more_link,
                background: layout.background || '',
            });
        } else {
            setEditingLayout(null);
            setFormData({
                section_name: '',
                section_type: 'grid',
                source_type: 'latest',
                source_category_ids: [],
                items_count: 6,
                title: '',
                show_more_link: true,
                background: '',
            });
        }
        setShowModal(true);
    };

    // 저장
    const handleSave = async () => {
        if (!formData.section_name) {
            showError('섹션 이름을 입력하세요.');
            return;
        }

        setSaving(true);
        try {
            const url = editingLayout
                ? `/api/layouts/${editingLayout.id}`
                : '/api/layouts';
            const method = editingLayout ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    page_type: pageType,
                    source_category_ids: formData.source_type === 'category' ? formData.source_category_ids : null,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            setShowModal(false);
            showSuccess('저장되었습니다.');
            fetchData();
        } catch (err: any) {
            showError(err.message || '저장 실패');
        } finally {
            setSaving(false);
        }
    };

    // 삭제 모달 열기
    const handleDelete = (layout: LayoutSection) => {
        setDeleteModal({ isOpen: true, layout });
    };

    // 실제 삭제 실행
    const confirmDelete = async () => {
        const layout = deleteModal.layout;
        if (!layout) return;
        setDeleteModal({ isOpen: false, layout: null });

        try {
            const res = await fetch(`/api/layouts/${layout.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('삭제 실패');
            showSuccess('삭제되었습니다.');
            fetchData();
        } catch (err: any) {
            showError(err.message);
        }
    };

    // 활성화 토글
    const toggleActive = async (layout: LayoutSection) => {
        try {
            await fetch(`/api/layouts/${layout.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !layout.is_active }),
            });
            fetchData();
        } catch (err) {
            console.error('토글 실패:', err);
        }
    };

    // 순서 이동
    const moveLayout = async (layout: LayoutSection, direction: 'up' | 'down') => {
        const currentIdx = layouts.findIndex(l => l.id === layout.id);

        if (direction === 'up' && currentIdx === 0) return;
        if (direction === 'down' && currentIdx === layouts.length - 1) return;

        const swapIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
        const swapLayout = layouts[swapIdx];

        await Promise.all([
            fetch(`/api/layouts/${layout.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_index: swapLayout.order_index }),
            }),
            fetch(`/api/layouts/${swapLayout.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_index: layout.order_index }),
            }),
        ]);

        fetchData();
    };

    const getSectionIcon = (type: string) => {
        const found = SECTION_TYPES.find(s => s.value === type);
        return found ? found.icon : LayoutGrid;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-3">
                        <LayoutGrid className="w-7 h-7 text-purple-600" />
                        레이아웃 관리
                    </h1>
                    <p className="text-sm text-[#8b949e] mt-2">
                        메인 페이지와 카테고리 페이지의 섹션 배치를 관리합니다.
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    섹션 추가
                </button>
            </header>

            {/* 페이지 타입 탭 */}
            <div className="flex gap-2">
                <button
                    onClick={() => setPageType('home')}
                    className={`px-4 py-2 rounded-lg font-medium ${pageType === 'home'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]'
                        }`}
                >
                    🏠 메인 페이지
                </button>
                <button
                    onClick={() => setPageType('category')}
                    className={`px-4 py-2 rounded-lg font-medium ${pageType === 'category'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]'
                        }`}
                >
                    📁 카테고리 페이지
                </button>
            </div>

            {/* 레이아웃 미리보기 */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                <div className="p-4 bg-[#21262d] border-b border-[#30363d]">
                    <h3 className="font-medium text-[#c9d1d9] flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        페이지 구조 미리보기
                    </h3>
                </div>
                <div className="p-4 space-y-2">
                    {layouts.filter(l => l.is_active).map((layout, idx) => {
                        const Icon = getSectionIcon(layout.section_type);
                        return (
                            <div
                                key={layout.id}
                                className="p-3 bg-gradient-to-r from-purple-500/10 to-[#161b22] border border-purple-500/20 rounded-lg flex items-center gap-3"
                            >
                                <span className="text-xs font-bold text-purple-400 w-6">{idx + 1}</span>
                                <Icon className="w-5 h-5 text-purple-500" />
                                <span className="font-medium text-[#e6edf3]">{layout.title || layout.section_name}</span>
                                <span className="text-xs text-[#8b949e]">({layout.items_count}개 항목)</span>
                            </div>
                        );
                    })}
                    {layouts.filter(l => l.is_active).length === 0 && (
                        <div className="text-center py-8 text-[#6e7681]">
                            활성화된 섹션이 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 섹션 목록 */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#21262d] border-b border-[#30363d]">
                            <th className="p-4 w-10"></th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">섹션</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">타입</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">데이터 소스</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">항목 수</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">상태</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">순서</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">작업</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d]">
                        {layouts.map((layout, idx) => {
                            const Icon = getSectionIcon(layout.section_type);
                            return (
                                <tr key={layout.id} className={`hover:bg-[#21262d] ${!layout.is_active ? 'opacity-50' : ''}`}>
                                    <td className="p-4">
                                        <GripVertical className="w-4 h-4 text-[#6e7681]" />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-purple-500" />
                                            <div>
                                                <div className="font-medium text-[#e6edf3]">{layout.section_name}</div>
                                                {layout.title && (
                                                    <div className="text-xs text-[#8b949e]">"{layout.title}"</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                                            {SECTION_TYPES.find(s => s.value === layout.section_type)?.label || layout.section_type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-[#c9d1d9]">
                                        {SOURCE_TYPES.find(s => s.value === layout.source_type)?.label}
                                    </td>
                                    <td className="p-4 text-sm text-[#c9d1d9]">
                                        {layout.items_count}개
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleActive(layout)}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${layout.is_active ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${layout.is_active ? 'left-5' : 'left-0.5'
                                                }`} />
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => moveLayout(layout, 'up')}
                                                disabled={idx === 0}
                                                className="p-1 text-[#6e7681] hover:text-[#c9d1d9] disabled:opacity-30"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveLayout(layout, 'down')}
                                                disabled={idx === layouts.length - 1}
                                                className="p-1 text-[#6e7681] hover:text-[#c9d1d9] disabled:opacity-30"
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(layout)}
                                                className="p-1.5 text-[#8b949e] hover:text-purple-400 hover:bg-purple-500/10 rounded"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(layout)}
                                                className="p-1.5 text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {layouts.length === 0 && (
                    <div className="text-center py-12 text-[#6e7681]">
                        등록된 섹션이 없습니다. 섹션을 추가하세요.
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#161b22] rounded-xl shadow-2xl z-50 w-[500px] max-h-[90vh] overflow-y-auto border border-[#30363d]">
                        <div className="p-6 border-b border-[#30363d] flex justify-between items-center sticky top-0 bg-[#161b22]">
                            <h2 className="text-lg font-bold text-[#e6edf3]">
                                {editingLayout ? '섹션 수정' : '섹션 추가'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-[#6e7681] hover:text-[#c9d1d9]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* 섹션 이름 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">섹션 이름 (내부용) *</label>
                                <input
                                    type="text"
                                    value={formData.section_name}
                                    onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                                    placeholder="main_hero"
                                    className="w-full px-4 py-2 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-[#21262d] text-[#e6edf3]"
                                />
                            </div>

                            {/* 표시 제목 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">표시 제목</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="오늘의 주요 뉴스"
                                    className="w-full px-4 py-2 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-[#21262d] text-[#e6edf3]"
                                />
                            </div>

                            {/* 섹션 타입 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">섹션 타입</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SECTION_TYPES.map(type => {
                                        const Icon = type.icon;
                                        return (
                                            <button
                                                key={type.value}
                                                onClick={() => setFormData({ ...formData, section_type: type.value as any })}
                                                className={`p-3 rounded-lg border text-left flex items-center gap-2 ${formData.section_type === type.value
                                                    ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                                                    : 'border-[#30363d] hover:border-[#6e7681] text-[#c9d1d9]'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-sm">{type.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 데이터 소스 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">데이터 소스</label>
                                <select
                                    value={formData.source_type}
                                    onChange={(e) => setFormData({ ...formData, source_type: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-[#30363d] rounded-lg bg-[#21262d] text-[#e6edf3]"
                                >
                                    {SOURCE_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 카테고리 선택 */}
                            {formData.source_type === 'category' && (
                                <div>
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-1">카테고리 선택</label>
                                    <select
                                        multiple
                                        value={formData.source_category_ids}
                                        onChange={(e) => {
                                            const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                                            setFormData({ ...formData, source_category_ids: selected });
                                        }}
                                        className="w-full px-4 py-2 border border-[#30363d] rounded-lg h-32 bg-[#21262d] text-[#e6edf3]"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {'  '.repeat(cat.depth)}{cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-[#8b949e] mt-1">Ctrl+클릭으로 여러 개 선택</p>
                                </div>
                            )}

                            {/* 항목 수 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">표시할 항목 수</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={formData.items_count}
                                    onChange={(e) => setFormData({ ...formData, items_count: parseInt(e.target.value) || 6 })}
                                    className="w-full px-4 py-2 border border-[#30363d] rounded-lg bg-[#21262d] text-[#e6edf3]"
                                />
                            </div>

                            {/* 더보기 링크 */}
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.show_more_link}
                                    onChange={(e) => setFormData({ ...formData, show_more_link: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm text-[#c9d1d9]">"더보기" 링크 표시</span>
                            </label>

                            {/* 배경색 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">배경색 (선택)</label>
                                <input
                                    type="text"
                                    value={formData.background}
                                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                                    placeholder="#f8f9fa 또는 bg-gray-50"
                                    className="w-full px-4 py-2 border border-[#30363d] rounded-lg bg-[#21262d] text-[#e6edf3]"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#30363d] flex justify-end gap-3 sticky bottom-0 bg-[#161b22]">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d]"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {saving ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* 삭제 확인 모달 */}
            {deleteModal.isOpen && deleteModal.layout && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-[#161b22] rounded-xl shadow-2xl w-full max-w-md p-6 mx-4 border border-[#30363d]">
                        <h3 className="text-lg font-bold text-[#e6edf3] mb-2">섹션 삭제</h3>
                        <p className="text-[#c9d1d9] mb-6">
                            <strong>"{deleteModal.layout.section_name}"</strong> 섹션을 삭제하시겠습니까?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, layout: null })}
                                className="px-4 py-2 text-[#c9d1d9] bg-[#21262d] rounded-lg hover:bg-[#30363d] font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
