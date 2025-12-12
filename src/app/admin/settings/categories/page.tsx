"use client";

import React, { useState, useEffect } from "react";
import { FolderTree, Plus, Edit2, Trash2, ChevronRight, ChevronDown, Loader2, X, Check, GripVertical, Eye, EyeOff, Menu } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parent_id: string | null;
    depth: number;
    path: string;
    order_index: number;
    icon?: string;
    color: string;
    scraper_slug?: string;
    is_active: boolean;
    show_in_gnb: boolean;
    show_in_main: boolean;
    children?: Category[];
}

// Sortable Item Component
function SortableItem({ category, renderContent }: { category: Category; renderContent: (category: Category) => React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : 'auto',
        position: isDragging ? 'relative' as const : 'static' as const,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? "bg-blue-50/50" : ""}>
            <div className="flex items-center gap-2">
                {/* Drag Handle - Only for Sortable Items */}
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
                    title="드래그하여 순서 변경"
                >
                    <GripVertical className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    {renderContent(category)}
                </div>
            </div>
        </div>
    );
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [flatCategories, setFlatCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);

    // 삭제 확인 모달 상태
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        category: Category | null;
    }>({ isOpen: false, category: null });
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        icon: '',
        color: '#3B82F6',
        scraper_slug: '',
        custom_url: '',
        link_target: '_self',
        show_in_gnb: true,
        show_in_main: true,
    });

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 데이터 로딩
    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories?active=false');
            const data = await res.json();
            setCategories(data.categories || []);
            setFlatCategories(data.flat || []);

            // 기존 확장 상태 유지 또는 초기화
            if (expanded.size === 0) {
                const roots = (data.categories || []).map((c: Category) => c.id);
                setExpanded(new Set(roots));
            }
        } catch (err) {
            console.error('카테고리 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // 토글 확장
    const toggleExpand = (id: string) => {
        const next = new Set(expanded);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpanded(next);
    };

    // 모달 열기
    const openModal = (category?: Category, parentId?: string) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                parent_id: category.parent_id || '',
                icon: category.icon || '',
                color: category.color,
                scraper_slug: category.scraper_slug || '',
                custom_url: (category as any).custom_url || '',
                link_target: (category as any).link_target || '_self',
                show_in_gnb: category.show_in_gnb,
                show_in_main: category.show_in_main,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                slug: '',
                description: '',
                parent_id: parentId || '',
                icon: '',
                color: '#3B82F6',
                scraper_slug: '',
                custom_url: '',
                link_target: '_self',
                show_in_gnb: true,
                show_in_main: true,
            });
        }
        setShowModal(true);
    };

    // 슬러그 자동 생성
    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9가-힣-]/g, '');
        setFormData({
            ...formData,
            name,
            slug: editingCategory ? formData.slug : slug
        });
    };

    // 저장
    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            alert('이름과 슬러그는 필수입니다.');
            return;
        }

        setSaving(true);
        try {
            const url = editingCategory
                ? `/api/categories/${editingCategory.id}`
                : '/api/categories';
            const method = editingCategory ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    parent_id: formData.parent_id || null,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            setShowModal(false);
            fetchCategories();
        } catch (err: any) {
            alert(err.message || '저장 실패');
        } finally {
            setSaving(false);
        }
    };

    // 삭제 모달 열기
    const handleDelete = (category: Category) => {
        setDeleteModal({ isOpen: true, category });
    };

    // 실제 삭제 실행
    const confirmDelete = async () => {
        const category = deleteModal.category;
        if (!category) return;

        setDeleteModal({ isOpen: false, category: null });

        try {
            const res = await fetch(`/api/categories/${category.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }
            fetchCategories();
        } catch (err: any) {
            alert(err.message || '삭제 실패');
        }
    };

    // 활성화 토글 (is_active)
    const toggleActive = async (category: Category) => {
        try {
            await fetch(`/api/categories/${category.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !category.is_active }),
            });
            fetchCategories(); // Reload to reflect changes
        } catch (err) {
            console.error('토글 실패:', err);
        }
    };

    // GNB 노출 토글 (show_in_gnb)
    const toggleGnb = async (category: Category) => {
        try {
            await fetch(`/api/categories/${category.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ show_in_gnb: !category.show_in_gnb }),
            });
            fetchCategories();
        } catch (err) {
            console.error('GNB 토글 실패:', err);
        }
    };

    // Drag End Handler
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // 순서 변경 API 호출
                const reorderedItems = newItems.map((item, index) => ({
                    id: item.id,
                    order_index: index
                }));

                // 비동기로 API 호출 (UI는 즉시 반영)
                fetch('/api/categories/reorder', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: reorderedItems }),
                }).catch(err => {
                    console.error('순서 저장 실패:', err);
                    alert('순서 저장에 실패했습니다.');
                });

                return newItems;
            });
        }
    };

    // 카테고리 내용 렌더링
    const renderCategoryContent = (category: Category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expanded.has(category.id);

        return (
            <div
                className={`flex items-center gap-2 py-2.5 px-2 rounded-lg hover:bg-gray-50 group border border-transparent hover:border-gray-100 ${!category.is_active ? 'opacity-50' : ''}`}
            >
                {/* 확장 버튼 */}
                <button
                    onClick={() => toggleExpand(category.id)}
                    className={`w-5 h-5 flex items-center justify-center ${hasChildren ? '' : 'invisible'}`}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                </button>

                {/* 색상 표시 */}
                <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                />

                {/* 이름 */}
                <span className="font-medium text-gray-800 flex-1">{category.name}</span>

                {/* 슬러그 */}
                <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded hidden sm:inline-block">
                    /{category.slug}
                </code>

                {/* 상태 배지 및 GNB 토글 버튼 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleGnb(category); }}
                        className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${category.show_in_gnb
                                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                        title={category.show_in_gnb ? "메뉴 숨기기" : "메뉴 보이기"}
                    >
                        <Menu className="w-3 h-3" />
                        {category.show_in_gnb ? 'ON' : 'OFF'}
                    </button>

                    {category.show_in_main && (
                        <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded hidden lg:inline-block">메인</span>
                    )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    {category.depth < 2 && (
                        <button
                            onClick={() => openModal(undefined, category.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="하위 카테고리 추가"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => openModal(category)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="수정"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => toggleActive(category)}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                        title={category.is_active ? '비활성화' : '활성화'}
                    >
                        {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => handleDelete(category)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="삭제"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    // 재귀 렌더링 (하위 카테고리는 드래그 불가 - SortableItem 미사용)
    const renderChildren = (category: Category, level: number) => {
        if (!category.children || category.children.length === 0 || !expanded.has(category.id)) {
            return null;
        }

        return (
            <div className="border-l border-gray-100 ml-4 pl-4">
                {category.children.map(child => (
                    <div key={child.id}>
                        {/* 하위 메뉴는 드래그 핸들 없이 바로 내용 렌더링. 레벨에 따른 패딩은 CSS로 처리 */}
                        <div className="flex items-center gap-2">
                            {/* 빈 공간 (드래그 핸들 자리 맞춤) */}
                            <div className="w-7 h-7 flex-shrink-0" />
                            <div className="flex-1">
                                {renderCategoryContent(child)}
                            </div>
                        </div>
                        {renderChildren(child, level + 1)}
                    </div>
                ))}
            </div>
        );
    }

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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <FolderTree className="w-7 h-7 text-blue-600" />
                        카테고리 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        좌측 핸들을 드래그하여 대메뉴 순서를 변경할 수 있습니다. 'GNB ON/OFF' 버튼으로 메뉴 노출을 제어하세요.
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    대메뉴 추가
                </button>
            </header>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <div className="text-2xl font-bold text-gray-900">{flatCategories.length}</div>
                    <div className="text-sm text-gray-500">전체 카테고리</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="text-2xl font-bold text-gray-900">
                        {flatCategories.filter(c => c.depth === 0).length}
                    </div>
                    <div className="text-sm text-gray-500">대메뉴</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="text-2xl font-bold text-gray-900">
                        {flatCategories.filter(c => c.is_active).length}
                    </div>
                    <div className="text-sm text-gray-500">활성화</div>
                </div>
            </div>

            {/* 카테고리 트리 (Sortable Context) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                {categories.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        카테고리가 없습니다. 대메뉴를 추가하세요.
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={categories.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="divide-y divide-gray-100 flex flex-col gap-1">
                                {categories.map(category => (
                                    <div key={category.id}>
                                        {/* 대메뉴는 SortableItem으로 렌더링 */}
                                        <SortableItem
                                            category={category}
                                            renderContent={renderCategoryContent}
                                        />
                                        {/* 하위 메뉴 렌더링 (드래그 불가 영역) */}
                                        {renderChildren(category, 0)}
                                    </div>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> 카테고리 순서는 드래그 즉시 저장됩니다.
                    <code className="bg-blue-100 px-1 rounded ml-1">GNB ON/OFF</code> 버튼을 누르면 관리자 페이지에는 보이지만 메인 메뉴에서는 숨길 수 있습니다.
                </p>
            </div>

            {/* Modal */}
            {showModal && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-[500px] max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingCategory ? '카테고리 수정' : '카테고리 추가'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* 이름 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="예: 나주시"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* 슬러그 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">슬러그 *</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="naju"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">URL에 사용됩니다: /category/{formData.slug || 'slug'}</p>
                            </div>

                            {/* 부모 카테고리 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">상위 카테고리</label>
                                <select
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">없음 (대메뉴)</option>
                                    {flatCategories.filter(c => c.depth < 2).map(c => (
                                        <option key={c.id} value={c.id}>
                                            {'　'.repeat(c.depth)}{c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 색상 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-12 h-10 rounded border cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* 스크래퍼 슬러그 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">스크래퍼 슬러그</label>
                                <input
                                    type="text"
                                    value={formData.scraper_slug}
                                    onChange={(e) => setFormData({ ...formData, scraper_slug: e.target.value })}
                                    placeholder="naju (스크래퍼 연동용)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* 커스텀 URL */}
                            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                                <label className="block text-sm font-medium text-blue-800 mb-1">
                                    🔗 커스텀 링크 (선택)
                                </label>
                                <input
                                    type="text"
                                    value={formData.custom_url}
                                    onChange={(e) => setFormData({ ...formData, custom_url: e.target.value })}
                                    placeholder="예: /map 또는 https://example.com"
                                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                />
                                <p className="text-xs text-blue-600">
                                    입력하면 /category/{formData.slug || 'slug'} 대신 이 URL로 이동합니다
                                </p>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="link_target"
                                            checked={formData.link_target === '_self'}
                                            onChange={() => setFormData({ ...formData, link_target: '_self' })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700">같은 탭</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="link_target"
                                            checked={formData.link_target === '_blank'}
                                            onChange={() => setFormData({ ...formData, link_target: '_blank' })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700">새 탭</span>
                                    </label>
                                </div>
                            </div>

                            {/* 표시 옵션 */}
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_gnb}
                                        onChange={(e) => setFormData({ ...formData, show_in_gnb: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">GNB에 표시</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_main}
                                        onChange={(e) => setFormData({ ...formData, show_in_main: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">메인에 표시</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {saving ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* 삭제 확인 모달 */}
            {deleteModal.isOpen && deleteModal.category && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            🗑️ 카테고리 삭제
                        </h3>
                        <p className="text-gray-600 mb-2">
                            <strong>"{deleteModal.category.name}"</strong> 카테고리를 삭제하시겠습니까?
                        </p>
                        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                            ⚠️ 이 카테고리에 속한 기사들은 '미분류'로 변경됩니다.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, category: null })}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
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
