"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Building2, Phone, Mail, ExternalLink, Edit2, Save, X, Plus,
    Search, Filter, Loader2, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';

interface Agency {
    id: string;
    region_code: string;
    name: string;
    category: string;
    base_url: string;
    press_release_url: string;
    contact_department: string | null;
    contact_person: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    is_active: boolean;
    notes: string | null;
}

export default function AgenciesPage() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<string>('전체');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Agency>>({});

    const categories = ['전체', '광주', '전남', '교육청'];

    const fetchAgencies = async () => {
        try {
            const res = await fetch('/api/agencies');
            const data = await res.json();
            if (data.success) {
                setAgencies(data.data || []);
            }
        } catch (error) {
            console.error('기관 목록 로드 실패:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAgencies();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAgencies();
    };

    const handleEdit = (agency: Agency) => {
        setEditingId(agency.id);
        setEditForm({
            contact_department: agency.contact_department || '',
            contact_person: agency.contact_person || '',
            contact_phone: agency.contact_phone || '',
            contact_email: agency.contact_email || '',
            notes: agency.notes || ''
        });
    };

    const handleSave = async (id: string) => {
        try {
            const res = await fetch('/api/agencies', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...editForm })
            });
            const data = await res.json();
            if (data.success) {
                setAgencies(agencies.map(a => a.id === id ? { ...a, ...editForm } : a));
                setEditingId(null);
            }
        } catch (error) {
            console.error('저장 실패:', error);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    // 필터링
    const filteredAgencies = agencies.filter(agency => {
        const matchesFilter = filter === '전체' || agency.category === filter;
        const matchesSearch = agency.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#30363d] pb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#e6edf3] tracking-tight mb-2 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-red-500" />
                        기관 디렉토리
                    </h1>
                    <p className="text-[#8b949e] font-medium">
                        총 {agencies.length}개 기관의 보도자료 바로가기 및 담당자 연락처
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="p-2.5 bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-red-400 hover:border-red-500/50 rounded-full transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Category Tabs */}
                <div className="flex gap-2 bg-[#21262d] p-1 rounded-lg">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all
                                ${filter === cat
                                    ? 'bg-[#161b22] text-red-400 shadow-sm'
                                    : 'text-[#8b949e] hover:text-[#e6edf3]'
                                }`}
                        >
                            {cat}
                            {cat !== '전체' && (
                                <span className="ml-1.5 text-xs text-[#6e7681]">
                                    ({agencies.filter(a => a.category === cat).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e7681]" />
                    <input
                        type="text"
                        placeholder="기관명 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50"
                    />
                </div>
            </div>

            {/* Agency Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAgencies.map(agency => (
                    <div
                        key={agency.id}
                        className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-sm hover:border-[#484f58] transition-all duration-300 overflow-hidden group"
                    >
                        {/* Card Header */}
                        <div className="px-5 py-4 border-b border-[#30363d] bg-[#21262d]/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#e6edf3]">{agency.name}</h3>
                                    <span className="text-xs text-[#8b949e]">{agency.category}</span>
                                </div>
                            </div>
                            {agency.is_active ? (
                                <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                                    <CheckCircle className="w-3 h-3" /> 활성
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs text-[#6e7681] font-medium">
                                    <AlertCircle className="w-3 h-3" /> 비활성
                                </span>
                            )}
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-4">
                            {/* Contact Info */}
                            {editingId === agency.id ? (
                                /* Edit Mode */
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="담당부서"
                                        value={editForm.contact_department || ''}
                                        onChange={(e) => setEditForm({ ...editForm, contact_department: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50"
                                    />
                                    <input
                                        type="text"
                                        placeholder="담당자명"
                                        value={editForm.contact_person || ''}
                                        onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50"
                                    />
                                    <input
                                        type="text"
                                        placeholder="전화번호"
                                        value={editForm.contact_phone || ''}
                                        onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50"
                                    />
                                    <input
                                        type="email"
                                        placeholder="이메일"
                                        value={editForm.contact_email || ''}
                                        onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSave(agency.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            <Save className="w-4 h-4" /> 저장
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center justify-center gap-2 px-3 py-2 border border-[#30363d] text-[#8b949e] text-sm font-bold rounded-lg hover:bg-[#21262d] transition-colors"
                                        >
                                            <X className="w-4 h-4" /> 취소
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="space-y-2 min-h-[80px]">
                                    {agency.contact_department || agency.contact_person ? (
                                        <>
                                            <p className="text-sm text-[#c9d1d9]">
                                                <span className="font-medium">{agency.contact_department}</span>
                                                {agency.contact_person && ` · ${agency.contact_person}`}
                                            </p>
                                            {agency.contact_phone && (
                                                <a
                                                    href={`tel:${agency.contact_phone}`}
                                                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    {agency.contact_phone}
                                                </a>
                                            )}
                                            {agency.contact_email && (
                                                <a
                                                    href={`mailto:${agency.contact_email}`}
                                                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    {agency.contact_email}
                                                </a>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-[#6e7681] italic">담당자 정보 없음</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Card Footer - Actions */}
                        <div className="px-5 py-4 border-t border-[#30363d] bg-[#21262d]/30 flex gap-2">
                            <a
                                href={agency.press_release_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                보도자료
                            </a>
                            {editingId !== agency.id && (
                                <button
                                    onClick={() => handleEdit(agency)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#30363d] text-[#8b949e] text-sm font-bold rounded-lg hover:bg-[#21262d] transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    편집
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredAgencies.length === 0 && (
                <div className="text-center py-16">
                    <Building2 className="w-16 h-16 text-[#484f58] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#e6edf3] mb-2">기관을 찾을 수 없습니다</h3>
                    <p className="text-[#8b949e]">검색 조건을 변경해보세요.</p>
                </div>
            )}
        </div>
    );
}
