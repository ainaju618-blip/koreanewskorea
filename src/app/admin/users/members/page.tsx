"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Edit2, Trash2, Check, Loader2, ShieldCheck, User, Mail, Phone } from "lucide-react";

// 공통 컴포넌트 import
import {
    StatusBadge,
    ConfirmModal,
    FilterTabs,
    PageHeader,
} from "@/components/admin/shared";
import { useToast } from '@/components/ui/Toast';

interface UserType {
    id: string;
    email: string;
    name: string | null;
    role: 'admin' | 'reporter' | 'subscriber';
    status: 'active' | 'suspended';
    phone: string | null;
    avatar_url: string | null;
    last_login_at: string | null;
    created_at: string;
}

export default function MembersPage() {
    const { showSuccess, showError } = useToast();
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [saving, setSaving] = useState(false);
    const [filterRole, setFilterRole] = useState('all');

    // 폼 상태
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        role: 'subscriber',
        status: 'active',
        phone: ''
    });

    // 역할 옵션
    const roleOptions = [
        { value: 'admin', label: '관리자', icon: ShieldCheck, color: 'text-purple-400' },
        { value: 'reporter', label: '기자', icon: User, color: 'text-blue-400' },
        { value: 'subscriber', label: '구독자', icon: User, color: 'text-[#8b949e]' }
    ];

    // 삭제 확인 모달
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: UserType | null }>({ isOpen: false, user: null });

    // 데이터 로드
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterRole !== 'all') params.append('role', filterRole);

            const res = await fetch(`/api/users?${params}`);
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('회원 목록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filterRole]);

    // 모달 열기
    const openModal = (user?: UserType) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                name: user.name || '',
                role: user.role,
                status: user.status,
                phone: user.phone || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                name: '',
                role: 'subscriber',
                status: 'active',
                phone: ''
            });
        }
        setShowModal(true);
    };

    // 저장
    const handleSave = async () => {
        if (!formData.email) {
            showError('이메일은 필수입니다.');
            return;
        }

        setSaving(true);
        try {
            const url = editingUser
                ? `/api/users/${editingUser.id}`
                : '/api/users';

            const res = await fetch(url, {
                method: editingUser ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showSuccess(editingUser ? '수정되었습니다.' : '등록되었습니다.');
                setShowModal(false);
                fetchUsers();
            } else {
                const err = await res.json();
                throw new Error(err.message);
            }
        } catch (error: any) {
            showError('저장 실패: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // 삭제 모달 열기
    const handleDelete = (user: UserType) => {
        setDeleteModal({ isOpen: true, user });
    };

    // 실제 삭제 실행
    const confirmDelete = async () => {
        const user = deleteModal.user;
        if (!user) return;
        setDeleteModal({ isOpen: false, user: null });

        try {
            const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
            if (res.ok) {
                showSuccess('삭제되었습니다.');
                fetchUsers();
            } else {
                throw new Error('삭제 실패');
            }
        } catch (error) {
            showError('삭제에 실패했습니다.');
        }
    };

    // 상태 토글
    const toggleStatus = async (user: UserType) => {
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        try {
            await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchUsers();
        } catch (error) {
            showError('상태 변경 실패');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header - 공통 컴포넌트 사용 */}
            <PageHeader
                title="회원 관리"
                description="시스템에 등록된 사용자를 관리합니다."
                icon={Users}
                iconBgColor="bg-blue-600"
                actions={
                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        회원 등록
                    </button>
                }
            />

            {/* Filter - 공통 컴포넌트 사용 */}
            <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] shadow-sm">
                <FilterTabs
                    tabs={[
                        { key: 'all', label: '전체' },
                        { key: 'admin', label: '관리자' },
                        { key: 'reporter', label: '기자' },
                        { key: 'subscriber', label: '구독자' }
                    ]}
                    activeTab={filterRole}
                    onChange={setFilterRole}
                    variant="buttons"
                />
            </div>

            {/* Users Table */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-[#8b949e]">
                        <Users className="w-12 h-12 mx-auto mb-4 text-[#484f58]" />
                        <p>등록된 회원이 없습니다.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#0d1117] border-b border-[#30363d]">
                                <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">상태</th>
                                <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">이메일</th>
                                <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">이름</th>
                                <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">역할</th>
                                <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">연락처</th>
                                <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">가입일</th>
                                <th className="p-4 text-xs font-semibold text-[#8b949e] uppercase">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#21262d]">
                            {users.map((user) => {
                                const roleOpt = roleOptions.find(r => r.value === user.role);
                                const RoleIcon = roleOpt?.icon || User;
                                return (
                                    <tr key={user.id} className="hover:bg-[#21262d]">
                                        <td className="p-4">
                                            <StatusBadge
                                                type="user"
                                                status={user.status}
                                                onClick={() => toggleStatus(user)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-[#8b949e]" />
                                                <span className="text-sm font-medium text-[#e6edf3]">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-[#c9d1d9]">{user.name || '-'}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${roleOpt?.color}`}>
                                                <RoleIcon className="w-4 h-4" />
                                                {roleOpt?.label}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.phone ? (
                                                <span className="flex items-center gap-1 text-sm text-[#c9d1d9]">
                                                    <Phone className="w-3 h-3" />
                                                    {user.phone}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-sm text-[#8b949e]">
                                            {new Date(user.created_at).toLocaleDateString('ko-KR')}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openModal(user)}
                                                    className="p-1.5 text-[#8b949e] hover:text-blue-400 hover:bg-blue-900/30 rounded"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-1.5 text-[#8b949e] hover:text-red-400 hover:bg-red-900/30 rounded"
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
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#161b22] rounded-xl shadow-2xl z-50 w-[480px] border border-[#30363d]">
                        <div className="p-6 border-b border-[#30363d]">
                            <h2 className="text-lg font-bold text-[#e6edf3]">
                                {editingUser ? '회원 정보 수정' : '신규 회원 등록'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* 이메일 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">이메일 *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] placeholder:text-[#484f58] focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={!!editingUser}
                                />
                            </div>

                            {/* 이름 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">이름</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="홍길동"
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] placeholder:text-[#484f58] focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* 역할 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">역할</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {roleOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 상태 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">상태</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="active">활성</option>
                                    <option value="suspended">정지</option>
                                </select>
                            </div>

                            {/* 연락처 */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">연락처</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="010-1234-5678"
                                    className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] placeholder:text-[#484f58] focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
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

            {/* ConfirmModal - 공통 컴포넌트 사용 */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="회원 삭제"
                message={deleteModal.user ? `"${deleteModal.user.email}" 회원을 삭제하시겠습니까?` : ''}
                confirmLabel="삭제"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, user: null })}
            />
        </div>
    );
}
