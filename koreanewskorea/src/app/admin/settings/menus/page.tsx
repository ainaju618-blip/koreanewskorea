"use client";

import React, { useState, useEffect } from "react";
import { Menu, Plus, Edit2, Trash2, Loader2, X, Check, GripVertical, ExternalLink, ChevronDown, Eye } from "lucide-react";
import { useToast } from '@/components/ui/Toast';

interface MenuItem {
    id: string;
    name: string;
    type: 'home' | 'category' | 'custom' | 'external';
    category_id?: string;
    category?: { id: string; name: string; slug: string; color: string };
    custom_url?: string;
    target: string;
    parent_id?: string;
    order_index: number;
    is_mega: boolean;
    mega_columns: number;
    icon?: string;
    highlight: boolean;
    is_active: boolean;
    children?: MenuItem[];
}

interface Category {
    id: string;
    name: string;
    slug: string;
    depth: number;
}

export default function MenusPage() {
    const { showSuccess, showError } = useToast();
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'category' as 'home' | 'category' | 'custom' | 'external',
        category_id: '',
        custom_url: '',
        target: '_self',
        is_mega: false,
        mega_columns: 2,
        highlight: false,
    });

    // 데이터 로딩
    const fetchData = async () => {
        try {
            const [menusRes, catsRes] = await Promise.all([
                fetch('/api/menus?active=false'),
                fetch('/api/categories?flat=true')
            ]);
            const menusData = await menusRes.json();
            const catsData = await catsRes.json();
            setMenus(menusData.menus || []);
            setCategories(catsData.flat || []);
        } catch (err) {
            console.error('데이터 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 모달 열기
    const openModal = (menu?: MenuItem) => {
        if (menu) {
            setEditingMenu(menu);
            setFormData({
                name: menu.name,
                type: menu.type,
                category_id: menu.category_id || '',
                custom_url: menu.custom_url || '',
                target: menu.target,
                is_mega: menu.is_mega,
                mega_columns: menu.mega_columns,
                highlight: menu.highlight,
            });
        } else {
            setEditingMenu(null);
            setFormData({
                name: '',
                type: 'category',
                category_id: '',
                custom_url: '',
                target: '_self',
                is_mega: false,
                mega_columns: 2,
                highlight: false,
            });
        }
        setShowModal(true);
    };

    // 저장
    const handleSave = async () => {
        if (!formData.name) {
            showError('메뉴 이름을 입력하세요.');
            return;
        }

        setSaving(true);
        try {
            const url = editingMenu
                ? `/api/menus/${editingMenu.id}`
                : '/api/menus';
            const method = editingMenu ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    category_id: formData.type === 'category' ? formData.category_id : null,
                    custom_url: ['custom', 'external'].includes(formData.type) ? formData.custom_url : null,
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

    // 삭제 확인 모달 상태 추가
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; menu: MenuItem | null }>({ isOpen: false, menu: null });

    // 삭제 모달 열기
    const handleDelete = (menu: MenuItem) => {
        setDeleteModal({ isOpen: true, menu });
    };

    // 실제 삭제 실행
    const confirmDelete = async () => {
        const menu = deleteModal.menu;
        if (!menu) return;

        setDeleteModal({ isOpen: false, menu: null });

        try {
            const res = await fetch(`/api/menus/${menu.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('삭제 실패');
            showSuccess('삭제되었습니다.');
            fetchData();
        } catch (err: any) {
            showError(err.message);
        }
    };

    // 순서 이동
    const moveMenu = async (menu: MenuItem, direction: 'up' | 'down') => {
        const flatMenus = menus.flatMap(m => [m, ...(m.children || [])]);
        const sameLevel = flatMenus.filter(m => m.parent_id === menu.parent_id);
        const currentIdx = sameLevel.findIndex(m => m.id === menu.id);

        if (direction === 'up' && currentIdx === 0) return;
        if (direction === 'down' && currentIdx === sameLevel.length - 1) return;

        const swapIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
        const swapMenu = sameLevel[swapIdx];

        // 순서 교환
        await Promise.all([
            fetch(`/api/menus/${menu.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_index: swapMenu.order_index }),
            }),
            fetch(`/api/menus/${swapMenu.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_index: menu.order_index }),
            }),
        ]);

        fetchData();
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
                        <Menu className="w-7 h-7 text-blue-600" />
                        GNB 메뉴 관리
                    </h1>
                    <p className="text-sm text-[#8b949e] mt-2">
                        상단 네비게이션 메뉴를 관리합니다. 순서를 변경하거나 메가메뉴를 설정할 수 있습니다.
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    메뉴 추가
                </button>
            </header>

            {/* 실시간 미리보기 */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                <div className="p-4 bg-[#21262d] border-b border-[#30363d]">
                    <h3 className="font-medium text-[#c9d1d9] flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        GNB 미리보기
                    </h3>
                </div>
                <div className="p-4 bg-[#161b22]">
                    <div className="flex items-center gap-1 bg-gray-900 rounded-lg px-6 py-3">
                        {menus.map((menu) => (
                            <div key={menu.id} className="relative group">
                                <button className={`px-4 py-2 text-sm font-medium rounded ${menu.highlight
                                        ? 'text-yellow-400'
                                        : 'text-white hover:text-blue-300'
                                    }`}>
                                    {menu.name}
                                    {menu.is_mega && <ChevronDown className="inline-block w-3 h-3 ml-1" />}
                                </button>
                                {menu.is_mega && menu.category && (
                                    <div className="absolute top-full left-0 mt-1 bg-[#161b22] rounded-lg shadow-lg p-4 hidden group-hover:block z-10 min-w-[200px] border border-[#30363d]">
                                        <div className="text-xs text-[#8b949e] mb-2">하위 카테고리</div>
                                        <div className="text-sm text-[#c9d1d9]">
                                            (카테고리 연결됨: {menu.category.name})
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 메뉴 목록 */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#21262d] border-b border-[#30363d]">
                            <th className="p-4 w-10"></th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">메뉴명</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">타입</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">연결</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">옵션</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">순서</th>
                            <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">작업</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d]">
                        {menus.map((menu, idx) => (
                            <tr key={menu.id} className="hover:bg-[#21262d]">
                                <td className="p-4">
                                    <GripVertical className="w-4 h-4 text-[#6e7681]" />
                                </td>
                                <td className="p-4 font-medium text-[#e6edf3]">
                                    {menu.name}
                                    {menu.highlight && (
                                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">강조</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded ${menu.type === 'home' ? 'bg-gray-100 text-gray-600' :
                                            menu.type === 'category' ? 'bg-blue-100 text-blue-600' :
                                                menu.type === 'custom' ? 'bg-purple-100 text-purple-600' :
                                                    'bg-green-100 text-green-600'
                                        }`}>
                                        {menu.type === 'home' ? '홈' :
                                            menu.type === 'category' ? '카테고리' :
                                                menu.type === 'custom' ? '커스텀' : '외부링크'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-[#c9d1d9]">
                                    {menu.type === 'category' && menu.category ? (
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: menu.category.color }}></span>
                                            {menu.category.name}
                                        </span>
                                    ) : menu.custom_url ? (
                                        <span className="flex items-center gap-1">
                                            {menu.custom_url}
                                            {menu.target === '_blank' && <ExternalLink className="w-3 h-3" />}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="p-4">
                                    {menu.is_mega && (
                                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded">
                                            메가메뉴
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => moveMenu(menu, 'up')}
                                            disabled={idx === 0}
                                            className="p-1 text-[#6e7681] hover:text-[#c9d1d9] disabled:opacity-30"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => moveMenu(menu, 'down')}
                                            disabled={idx === menus.length - 1}
                                            className="p-1 text-[#6e7681] hover:text-[#c9d1d9] disabled:opacity-30"
                                        >
                                            ↓
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModal(menu)}
                                            className="p-1.5 text-[#8b949e] hover:text-blue-400 hover:bg-blue-500/10 rounded"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(menu)}
                                            className="p-1.5 text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#161b22] rounded-xl shadow-2xl z-50 w-[450px] border border-[#30363d]">
                        <div className="p-6 border-b border-[#30363d] flex justify-between items-center">
                            <h2 className="text-lg font-bold text-[#e6edf3]">
                                {editingMenu ? '메뉴 수정' : '메뉴 추가'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-[#6e7681] hover:text-[#c9d1d9]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* 이름 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">메뉴 이름 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="전남"
                                    className="w-full px-4 py-2 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-[#21262d] text-[#e6edf3]"
                                />
                            </div>

                            {/* 타입 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">타입</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-[#30363d] rounded-lg bg-[#21262d] text-[#e6edf3]"
                                >
                                    <option value="home">홈</option>
                                    <option value="category">카테고리 연결</option>
                                    <option value="custom">커스텀 URL</option>
                                    <option value="external">외부 링크</option>
                                </select>
                            </div>

                            {/* 카테고리 선택 */}
                            {formData.type === 'category' && (
                                <div>
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-1">카테고리</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-[#30363d] rounded-lg bg-[#21262d] text-[#e6edf3]"
                                    >
                                        <option value="">선택하세요</option>
                                        {categories.filter(c => c.depth === 0).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* 커스텀 URL */}
                            {['custom', 'external'].includes(formData.type) && (
                                <div>
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-1">URL</label>
                                    <input
                                        type="text"
                                        value={formData.custom_url}
                                        onChange={(e) => setFormData({ ...formData, custom_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2 border border-[#30363d] rounded-lg bg-[#21262d] text-[#e6edf3]"
                                    />
                                </div>
                            )}

                            {/* 메가메뉴 */}
                            {formData.type === 'category' && (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_mega}
                                        onChange={(e) => setFormData({ ...formData, is_mega: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm text-[#c9d1d9]">메가메뉴 사용 (하위 카테고리 드롭다운)</span>
                                </label>
                            )}

                            {/* 강조 */}
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.highlight}
                                    onChange={(e) => setFormData({ ...formData, highlight: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm text-[#c9d1d9]">강조 표시</span>
                            </label>
                        </div>
                        <div className="p-6 border-t border-[#30363d] flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d]"
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
            {deleteModal.isOpen && deleteModal.menu && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-[#161b22] rounded-xl shadow-2xl w-full max-w-md p-6 mx-4 border border-[#30363d]">
                        <h3 className="text-lg font-bold text-[#e6edf3] mb-2">메뉴 삭제</h3>
                        <p className="text-[#c9d1d9] mb-6">
                            "{deleteModal.menu.name}" 메뉴를 삭제하시겠습니까?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, menu: null })}
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
