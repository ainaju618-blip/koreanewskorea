"use client";

import React, { useState, useEffect } from "react";
import { Database, Plus, Edit2, Trash2, Check, X, Loader2, ExternalLink, RefreshCw, Globe, Rss } from "lucide-react";

interface Source {
    id: string;
    name: string;
    type: 'rss' | 'web';
    url: string;
    region: string | null;
    category: string;
    active: boolean;
    last_fetched_at: string | null;
    articles_count: number;
    created_at: string;
}

export default function SourcesPage() {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSource, setEditingSource] = useState<Source | null>(null);
    const [saving, setSaving] = useState(false);

    // 폼 상태
    const [formData, setFormData] = useState({
        name: '',
        type: 'web',
        url: '',
        region: '',
        category: 'local',
        active: true
    });

    // 지역 옵션
    const regionOptions = [
        { value: '', label: '선택 안함' },
        { value: 'gwangju', label: '광주광역시' },
        { value: 'jeonnam', label: '전라남도' },
        { value: 'naju', label: '나주시' },
        { value: 'mokpo', label: '목포시' },
        { value: 'yeosu', label: '여수시' },
        { value: 'suncheon', label: '순천시' },
        { value: 'gwangyang', label: '광양시' },
    ];

    // 카테고리 옵션
    const categoryOptions = [
        { value: 'local', label: '지역' },
        { value: 'education', label: '교육' },
        { value: 'economy', label: '경제' },
        { value: 'culture', label: '문화' },
    ];

    // 데이터 로드
    const fetchSources = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bot/sources');
            const data = await res.json();
            setSources(data.sources || []);
        } catch (error) {
            console.error('소스 목록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    // 모달 열기 (신규/수정)
    const openModal = (source?: Source) => {
        if (source) {
            setEditingSource(source);
            setFormData({
                name: source.name,
                type: source.type,
                url: source.url,
                region: source.region || '',
                category: source.category,
                active: source.active
            });
        } else {
            setEditingSource(null);
            setFormData({
                name: '',
                type: 'web',
                url: '',
                region: '',
                category: 'local',
                active: true
            });
        }
        setShowModal(true);
    };

    // 저장
    const handleSave = async () => {
        if (!formData.name || !formData.url) {
            alert('소스명과 URL은 필수입니다.');
            return;
        }

        setSaving(true);
        try {
            const url = editingSource
                ? `/api/bot/sources/${editingSource.id}`
                : '/api/bot/sources';

            const res = await fetch(url, {
                method: editingSource ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert(editingSource ? '수정되었습니다.' : '추가되었습니다.');
                setShowModal(false);
                fetchSources();
            } else {
                const err = await res.json();
                throw new Error(err.message);
            }
        } catch (error: any) {
            alert('저장 실패: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // 삭제
    const handleDelete = async (source: Source) => {
        if (!confirm(`"${source.name}" 소스를 삭제하시겠습니까?`)) return;

        try {
            const res = await fetch(`/api/bot/sources/${source.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('삭제되었습니다.');
                fetchSources();
            } else {
                throw new Error('삭제 실패');
            }
        } catch (error) {
            alert('삭제에 실패했습니다.');
        }
    };

    // 활성/비활성 토글
    const toggleActive = async (source: Source) => {
        try {
            await fetch(`/api/bot/sources/${source.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !source.active })
            });
            fetchSources();
        } catch (error) {
            alert('상태 변경 실패');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Database className="w-7 h-7 text-blue-600" />
                        소스 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        스크래퍼가 수집하는 RSS/웹사이트 소스를 관리합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchSources}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        소스 추가
                    </button>
                </div>
            </header>

            {/* Sources Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : sources.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>등록된 소스가 없습니다.</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-4 text-blue-600 hover:underline"
                        >
                            첫 번째 소스 추가하기
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">상태</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">소스명</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">유형</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">지역</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">수집 기사</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">마지막 수집</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sources.map((source) => (
                                <tr key={source.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleActive(source)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${source.active ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${source.active ? 'translate-x-5' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{source.name}</p>
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                {source.url}
                                            </a>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${source.type === 'rss'
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {source.type === 'rss' ? <Rss className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                            {source.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-gray-600">
                                            {regionOptions.find(r => r.value === source.region)?.label || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-medium text-gray-900">{source.articles_count}</span>
                                        <span className="text-gray-400 text-xs">건</span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {source.last_fetched_at
                                            ? new Date(source.last_fetched_at).toLocaleString('ko-KR')
                                            : '없음'
                                        }
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(source)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(source)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-[500px] max-h-[90vh] overflow-auto">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingSource ? '소스 수정' : '신규 소스 추가'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* 소스명 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">소스명 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="예: 나주시청 보도자료"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* 유형 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="web"
                                            checked={formData.type === 'web'}
                                            onChange={() => setFormData({ ...formData, type: 'web' })}
                                            className="text-blue-600"
                                        />
                                        <Globe className="w-4 h-4 text-purple-600" />
                                        Web Scraping
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="rss"
                                            checked={formData.type === 'rss'}
                                            onChange={() => setFormData({ ...formData, type: 'rss' })}
                                            className="text-blue-600"
                                        />
                                        <Rss className="w-4 h-4 text-orange-600" />
                                        RSS Feed
                                    </label>
                                </div>
                            </div>

                            {/* URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://example.com/rss"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* 지역 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">지역 태그</label>
                                <select
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {regionOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 카테고리 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {categoryOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 활성화 */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="active" className="text-sm text-gray-700">활성화 (수집 대상에 포함)</label>
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
        </div>
    );
}
