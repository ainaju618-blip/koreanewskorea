"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Users, Bot, CheckCircle, Edit2, Trash2, Loader2, X, RefreshCcw, Phone, Mail, Briefcase, Crown, User, Key, type LucideIcon } from "lucide-react";
import { useToast } from '@/components/ui/Toast';

// 직위 데이터
const POSITIONS = [
    { value: 'editor_in_chief', label: '주필' },
    { value: 'branch_manager', label: '지사장' },
    { value: 'editor_chief', label: '편집국장' },
    { value: 'news_chief', label: '취재부장' },
    { value: 'senior_reporter', label: '수석기자' },
    { value: 'reporter', label: '기자' },
    { value: 'intern_reporter', label: '수습기자' },
    { value: 'citizen_reporter', label: '시민기자' },
    { value: 'opinion_writer', label: '오피니언' },
    { value: 'advisor', label: '고문' },
    { value: 'consultant', label: '자문위원' },
    { value: 'ambassador', label: '홍보대사' },
    { value: 'seoul_correspondent', label: '서울특파원' },
    { value: 'foreign_correspondent', label: '해외특파원' },
];

// 지역 데이터
const REGIONS = [
    { value: '전체', label: '전체' },
    { value: '광주광역시', label: '광주광역시' },
    { value: '전라남도', label: '전라남도' },
    { value: '목포시', label: '목포시' },
    { value: '여수시', label: '여수시' },
    { value: '순천시', label: '순천시' },
    { value: '나주시', label: '나주시' },
    { value: '광양시', label: '광양시' },
    { value: '담양군', label: '담양군' },
    { value: '곡성군', label: '곡성군' },
    { value: '구례군', label: '구례군' },
    { value: '고흥군', label: '고흥군' },
    { value: '보성군', label: '보성군' },
    { value: '화순군', label: '화순군' },
    { value: '장흥군', label: '장흥군' },
    { value: '강진군', label: '강진군' },
    { value: '해남군', label: '해남군' },
    { value: '영암군', label: '영암군' },
    { value: '무안군', label: '무안군' },
    { value: '함평군', label: '함평군' },
    { value: '영광군', label: '영광군' },
    { value: '장성군', label: '장성군' },
    { value: '완도군', label: '완도군' },
    { value: '진도군', label: '진도군' },
    { value: '신안군', label: '신안군' },
];

// 기자 타입 정의
interface Reporter {
    id: string;
    name: string;
    type: string;  // position 값과 동일하게 사용
    position: string;
    region: string;
    phone: string | null;
    email: string | null;
    bio: string | null;
    profile_image: string | null;  // 프로필 사진 URL
    status: "Active" | "Inactive";
    avatar_icon: string;
    created_at: string;
    gemini_api_key: string | null;
}

export default function ReportersPage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    const [reporters, setReporters] = useState<Reporter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReporter, setSelectedReporter] = useState<Reporter | null>(null);

    // Add/Edit Reporter Form State
    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState("reporter");  // 직위 값 사용
    const [formRegion, setFormRegion] = useState("전체");
    const [formPhone, setFormPhone] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formBio, setFormBio] = useState("");
    const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
    const [formGeminiApiKey, setFormGeminiApiKey] = useState("");
    const [formProfileImage, setFormProfileImage] = useState("");  // 프로필 사진 URL
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 필터 상태
    const [filterType, setFilterType] = useState<string>("all");  // 직위 필터
    const [filterRegion, setFilterRegion] = useState<string>("all");

    // 삭제 확인 모달
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; reporter: Reporter | null }>({ isOpen: false, reporter: null });
    const { showSuccess, showError, showWarning } = useToast();

    // 기자 목록 조회
    const fetchReporters = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/users/reporters');
            if (res.ok) {
                const data = await res.json();
                setReporters(data);
            }
        } catch (err) {
            console.error("기자 목록 조회 실패:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReporters();
    }, []);

    // 모달 초기화
    const resetForm = () => {
        setFormName("");
        setFormType("reporter");  // 기본 직위
        setFormRegion("전체");
        setFormPhone("");
        setFormEmail("");
        setFormPassword("");
        setFormBio("");
        setFormStatus("Active");
        setFormGeminiApiKey("");
        setFormProfileImage("");
        setSelectedReporter(null);
    };

    // 추가 모달 열기
    const openAddModal = () => {
        resetForm();
        setShowAddModal(true);
    };

    // 수정 모달 열기
    const openEditModal = (reporter: Reporter) => {
        setSelectedReporter(reporter);
        setFormName(reporter.name);
        setFormType(reporter.type || reporter.position || "reporter");  // 직위 값 사용
        setFormRegion(reporter.region || "전체");
        setFormPhone(reporter.phone || "");
        setFormEmail(reporter.email || "");
        setFormBio(reporter.bio || "");
        setFormStatus(reporter.status);
        setFormGeminiApiKey(reporter.gemini_api_key || "");
        setFormProfileImage(reporter.profile_image || "");
        setShowEditModal(true);
    };

    // 상세 패널 열기
    const openDetailPanel = (reporter: Reporter) => {
        setSelectedReporter(reporter);
        setShowDetailPanel(true);
    };

    // 기자 추가
    const handleAddReporter = async () => {
        if (!formName) {
            showWarning("이름을 입력해주세요.");
            return;
        }

        // 이메일 입력 시 비밀번호 검증
        if (formEmail) {
            if (formPassword && formPassword.length < 6) {
                showWarning("비밀번호는 6자 이상이어야 합니다.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/users/reporters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    position: formType,  // 직위값 (API에서 type='Human' 고정 처리)
                    region: formRegion,
                    phone: formPhone || null,
                    email: formEmail || null,
                    password: formEmail ? (formPassword || null) : null,  // 이메일 있으면 비밀번호 설정
                    bio: formBio || null,
                    profile_image: formProfileImage || null,
                    gemini_api_key: formGeminiApiKey || null,
                })
            });

            if (res.ok) {
                await fetchReporters();
                setShowAddModal(false);
                resetForm();
                if (formEmail) {
                    const msg = formPassword
                        ? "기자 계정이 생성되었습니다. 이메일과 비밀번호로 로그인할 수 있습니다."
                        : "기자 계정이 생성되었습니다. 초기 비밀번호: a1234567!";
                    showSuccess(msg);
                }
            } else {
                const err = await res.json();
                showError(err.message || "등록 실패");
            }
        } catch (err) {
            showError("서버 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 기자 수정
    const handleUpdateReporter = async () => {
        if (!selectedReporter) return;
        if (!formName) {
            showWarning("이름을 입력해주세요.");
            return;
        }

        // 비밀번호 변경 시 길이 검증
        if (formPassword && formPassword.length < 6) {
            showWarning("비밀번호는 6자 이상이어야 합니다.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/users/reporters/${selectedReporter.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    position: formType,  // 직위값 (API에서 type='Human' 고정 처리)
                    region: formRegion,
                    phone: formPhone || null,
                    email: formEmail || null,
                    bio: formBio || null,
                    profile_image: formProfileImage || null,
                    status: formStatus,
                    password: formPassword || null,  // 비밀번호 변경 (빈 문자열이면 null)
                    gemini_api_key: formGeminiApiKey || null,
                })
            });

            if (res.ok) {
                await fetchReporters();
                setShowEditModal(false);
                resetForm();
            } else {
                const err = await res.json();
                showError(err.message || "수정 실패");
            }
        } catch (err) {
            showError("서버 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 기자 삭제 모달 열기
    const handleDeleteReporter = (reporter: Reporter) => {
        setDeleteModal({ isOpen: true, reporter });
    };

    // 실제 삭제 실행
    const confirmDelete = async () => {
        const reporter = deleteModal.reporter;
        if (!reporter) return;
        setDeleteModal({ isOpen: false, reporter: null });

        try {
            const res = await fetch(`/api/users/reporters/${reporter.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchReporters();
            } else {
                const err = await res.json();
                showError(err.message || "삭제 실패");
            }
        } catch (err) {
            showError("서버 오류가 발생했습니다.");
        }
    };

    // 필터링된 기자 목록
    const filteredReporters = reporters.filter(r => {
        if (filterType !== "all" && r.type !== filterType && r.position !== filterType) return false;
        if (filterRegion !== "all" && r.region !== filterRegion) return false;
        return true;
    });

    // 통계 - 직위(position) 기준
    const stats = {
        totalReporters: reporters.length,
        // 간부급: 주필, 지사장, 편집국장, 취재부장
        executives: reporters.filter(r =>
            ['editor_in_chief', 'branch_manager', 'editor_chief', 'news_chief'].includes(r.position)
        ).length,
        // 기자급: 수석기자, 기자, 수습기자, 시민기자, 특파원
        reporters_count: reporters.filter(r =>
            ['senior_reporter', 'reporter', 'intern_reporter', 'citizen_reporter', 'seoul_correspondent', 'foreign_correspondent'].includes(r.position)
        ).length,
        activeReporters: reporters.filter(r => r.status === 'Active').length,
    };

    // 직위 라벨 가져오기
    const getPositionLabel = (value: string) => {
        return POSITIONS.find(p => p.value === value)?.label || value;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="w-7 h-7 text-blue-600" />
                        기자 등록 / 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        지역 기자단을 등록하고 관리합니다. 직위는 예우용이며 모든 기자는 동일한 권한을 갖습니다.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchReporters}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        새로고침
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 shadow-sm transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        기자 추가
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6">
                <StatCard label="전체 기자" value={`${stats.totalReporters}명`} icon={Users} color="blue" />
                <StatCard label="간부급" value={`${stats.executives}명`} icon={Crown} color="purple" />
                <StatCard label="기자단" value={`${stats.reporters_count}명`} icon={User} color="green" />
                <StatCard label="활동 중" value={`${stats.activeReporters}명`} icon={CheckCircle} color="orange" />
            </div>

            {/* Reporters Grid */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px]">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900">기자단 목록</h3>
                        <span className="text-sm text-gray-500">{filteredReporters.length}명 표시</span>
                    </div>

                    {/* 필터 영역 */}
                    <div className="flex flex-wrap gap-4">
                        {/* 유형(직위) 필터 */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">유형:</span>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
                            >
                                <option value="all">전체</option>
                                {POSITIONS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* 지역 필터 */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">지역:</span>
                            <select
                                value={filterRegion}
                                onChange={(e) => setFilterRegion(e.target.value)}
                                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
                            >
                                <option value="all">전체</option>
                                {REGIONS.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                        </div>
                    ) : filteredReporters.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            조건에 맞는 기자가 없습니다.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                            {filteredReporters.map((reporter) => (
                                <ReporterCard
                                    key={reporter.id}
                                    reporter={reporter}
                                    positionLabel={getPositionLabel(reporter.position)}
                                    onView={() => openDetailPanel(reporter)}
                                    onEdit={() => openEditModal(reporter)}
                                    onDelete={() => handleDeleteReporter(reporter)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Reporter Modal */}
            {showAddModal && (
                <Modal title="새 기자 추가" onClose={() => setShowAddModal(false)}>
                    <ReporterForm
                        formName={formName}
                        setFormName={setFormName}
                        formType={formType}
                        setFormType={setFormType}
                        formRegion={formRegion}
                        setFormRegion={setFormRegion}
                        formPhone={formPhone}
                        setFormPhone={setFormPhone}
                        formEmail={formEmail}
                        setFormEmail={setFormEmail}
                        formPassword={formPassword}
                        setFormPassword={setFormPassword}
                        formBio={formBio}
                        setFormBio={setFormBio}
                        formProfileImage={formProfileImage}
                        setFormProfileImage={setFormProfileImage}
                        formGeminiApiKey={formGeminiApiKey}
                        setFormGeminiApiKey={setFormGeminiApiKey}
                        isSubmitting={isSubmitting}
                        onSubmit={handleAddReporter}
                        onCancel={() => setShowAddModal(false)}
                        submitLabel="추가하기"
                        isAddMode
                    />
                </Modal>
            )}

            {/* Edit Reporter Modal */}
            {showEditModal && selectedReporter && (
                <Modal title="기자 정보 수정" onClose={() => setShowEditModal(false)}>
                    <ReporterForm
                        formName={formName}
                        setFormName={setFormName}
                        formType={formType}
                        setFormType={setFormType}
                        formRegion={formRegion}
                        setFormRegion={setFormRegion}
                        formPhone={formPhone}
                        setFormPhone={setFormPhone}
                        formEmail={formEmail}
                        setFormEmail={setFormEmail}
                        formPassword={formPassword}
                        setFormPassword={setFormPassword}
                        formBio={formBio}
                        setFormBio={setFormBio}
                        formProfileImage={formProfileImage}
                        setFormProfileImage={setFormProfileImage}
                        formStatus={formStatus}
                        setFormStatus={setFormStatus}
                        formGeminiApiKey={formGeminiApiKey}
                        setFormGeminiApiKey={setFormGeminiApiKey}
                        isSubmitting={isSubmitting}
                        onSubmit={handleUpdateReporter}
                        onCancel={() => setShowEditModal(false)}
                        submitLabel="수정하기"
                        showStatus
                        isEditMode
                    />
                </Modal>
            )}

            {/* Detail Panel (Slide) */}
            {showDetailPanel && selectedReporter && (
                <DetailPanel
                    reporter={selectedReporter}
                    positionLabel={getPositionLabel(selectedReporter.position)}
                    onClose={() => setShowDetailPanel(false)}
                    onEdit={() => {
                        setShowDetailPanel(false);
                        openEditModal(selectedReporter);
                    }}
                />
            )}

            {/* 삭제 확인 모달 */}
            {deleteModal.isOpen && deleteModal.reporter && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">기자 삭제</h3>
                        <p className="text-gray-600 mb-6">
                            <strong>&apos;{deleteModal.reporter.name}&apos;</strong> 기자를 삭제하시겠습니까?
                            <br />
                            <span className="text-sm text-red-500">이 작업은 되돌릴 수 없습니다.</span>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, reporter: null })}
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

// --- Components ---

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

interface ReporterFormProps {
    formName: string;
    setFormName: (v: string) => void;
    formType: string;  // 직위 값
    setFormType: (v: string) => void;
    formRegion: string;
    setFormRegion: (v: string) => void;
    formPhone: string;
    setFormPhone: (v: string) => void;
    formEmail: string;
    setFormEmail: (v: string) => void;
    formPassword?: string;
    setFormPassword?: (v: string) => void;
    formBio: string;
    setFormBio: (v: string) => void;
    formProfileImage?: string;
    setFormProfileImage?: (v: string) => void;
    formStatus?: "Active" | "Inactive";
    setFormStatus?: (v: "Active" | "Inactive") => void;
    formGeminiApiKey?: string;
    setFormGeminiApiKey?: (v: string) => void;
    isSubmitting: boolean;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel: string;
    showStatus?: boolean;
    isAddMode?: boolean;
    isEditMode?: boolean;
}

function ReporterForm({
    formName, setFormName,
    formType, setFormType,
    formRegion, setFormRegion,
    formPhone, setFormPhone,
    formEmail, setFormEmail,
    formPassword, setFormPassword,
    formBio, setFormBio,
    formProfileImage, setFormProfileImage,
    formStatus, setFormStatus,
    formGeminiApiKey, setFormGeminiApiKey,
    isSubmitting, onSubmit, onCancel, submitLabel, showStatus, isAddMode, isEditMode
}: ReporterFormProps) {
    return (
        <div className="space-y-6">
            {/* 섹션 1: 기본 정보 */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">기본 정보</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">이름 *</label>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="홍길동"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">유형 *</label>
                        <select
                            value={formType}
                            onChange={(e) => setFormType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                            {POSITIONS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">담당 지역</label>
                        <select
                            value={formRegion}
                            onChange={(e) => setFormRegion(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                            {REGIONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 섹션 2: 계정 정보 */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">계정 정보</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        아이디 <span className="text-gray-400">(로그인용)</span>
                    </label>
                    <div className="flex max-w-md">
                        <input
                            type="text"
                            value={formEmail.replace(/@koreanews(one)?\.com$/, '')}
                            onChange={(e) => setFormEmail(e.target.value ? `${e.target.value.replace(/@koreanews(one)?\.com$/, '')}@koreanewsone.com` : '')}
                            className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="userid"
                        />
                        <span className="inline-flex items-center px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-500 text-sm">
                            @koreanewsone.com
                        </span>
                    </div>
                </div>
                {setFormPassword && (isAddMode || isEditMode) && (
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            비밀번호 <span className="text-gray-400">(선택)</span>
                        </label>
                        <input
                            type="password"
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            className="max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder={isAddMode ? "미입력시 기본 비밀번호: a1234567!" : "변경시에만 입력"}
                        />
                    </div>
                )}
            </div>

            {/* 섹션 3: 연락처 */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">연락처</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">전화번호</label>
                    <input
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="010-0000-0000"
                    />
                </div>
            </div>

            {/* 섹션 4: 추가 정보 (선택) */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">추가 정보 <span className="font-normal text-gray-400">(선택)</span></h3>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">소개/약력</label>
                    <textarea
                        value={formBio}
                        onChange={(e) => setFormBio(e.target.value)}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="간단한 소개 (선택사항)"
                    />
                </div>
                {setFormProfileImage && (
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            프로필 사진 URL <span className="text-gray-400">(이미지 주소)</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={formProfileImage}
                                onChange={(e) => setFormProfileImage(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="https://example.com/photo.jpg"
                            />
                            {formProfileImage && (
                                <img
                                    src={formProfileImage}
                                    alt="프로필 미리보기"
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            프로필 사진의 URL을 입력하세요. Cloudinary 등에 업로드된 이미지 주소를 사용하세요.
                        </p>
                    </div>
                )}
                {showStatus && setFormStatus && (
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">상태</label>
                        <select
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                            <option value="Active">활동 중</option>
                            <option value="Inactive">비활성</option>
                        </select>
                    </div>
                )}
            </div>

            {/* 섹션 5: AI 설정 */}
            {setFormGeminiApiKey && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <Key className="w-4 h-4 text-purple-600" />
                        AI 설정
                    </h3>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Gemini API 키 <span className="text-gray-400">(Google AI Studio에서 발급)</span>
                        </label>
                        <input
                            type="password"
                            value={formGeminiApiKey}
                            onChange={(e) => setFormGeminiApiKey(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                            placeholder="AIzaSy..."
                            autoComplete="off"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                                Google AI Studio
                            </a>에서 API 키를 발급받으세요.
                        </p>
                    </div>
                </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3 pt-4 border-t">
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center text-sm"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : submitLabel}
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-sm"
                >
                    취소
                </button>
            </div>
        </div>
    );
}

type StatCardColor = 'blue' | 'purple' | 'green' | 'orange';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: LucideIcon; color: StatCardColor }) {
    const colors: Record<StatCardColor, string> = {
        blue: "bg-blue-50 border-blue-200",
        purple: "bg-purple-50 border-purple-200",
        green: "bg-green-50 border-green-200",
        orange: "bg-orange-50 border-orange-200",
    };

    const iconColors: Record<StatCardColor, string> = {
        blue: "text-blue-600",
        purple: "text-purple-600",
        green: "text-green-600",
        orange: "text-orange-600",
    };

    return (
        <div className={`rounded-xl border p-5 ${colors[color]}`}>
            <div className="flex items-center justify-between mb-2">
                <Icon className={`w-6 h-6 ${iconColors[color]}`} />
            </div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

interface ReporterCardProps {
    reporter: Reporter;
    positionLabel: string;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function ReporterCard({ reporter, positionLabel, onView, onEdit, onDelete }: ReporterCardProps) {
    const isBot = reporter.type === 'AI Bot';
    const isActive = reporter.status === 'Active';

    return (
        <div
            className={`border-2 rounded-lg p-4 transition-all bg-white cursor-pointer ${isActive
                ? 'border-gray-100 hover:border-blue-400 hover:shadow-md'
                : 'border-gray-100 opacity-60'
                }`}
            onClick={onView}
        >
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl overflow-hidden ${isBot ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    {reporter.profile_image ? (
                        <img
                            src={reporter.profile_image}
                            alt={reporter.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        reporter.avatar_icon || (isBot ? '🤖' : '👤')
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{reporter.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${isBot ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {positionLabel}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{reporter.region}</p>
                </div>
                {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-green-500" title="활동 중" />
                ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300" title="비활성" />
                )}
            </div>

            {/* 연락처 미리보기 */}
            {(reporter.phone || reporter.email) && (
                <div className="text-xs text-gray-400 mb-3 flex gap-3">
                    {reporter.phone && (
                        <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {reporter.phone}
                        </span>
                    )}
                    {reporter.email && (
                        <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" />
                            {reporter.email}
                        </span>
                    )}
                </div>
            )}

            <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onEdit}
                    className="flex-1 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1 transition"
                >
                    <Edit2 className="w-3 h-3" />
                    수정
                </button>
                <button
                    onClick={onDelete}
                    className="flex-1 py-1.5 text-xs border border-gray-300 rounded hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center justify-center gap-1 transition"
                >
                    <Trash2 className="w-3 h-3" />
                    삭제
                </button>
            </div>
        </div>
    );
}

interface DetailPanelProps {
    reporter: Reporter;
    positionLabel: string;
    onClose: () => void;
    onEdit: () => void;
}

function DetailPanel({ reporter, positionLabel, onClose, onEdit }: DetailPanelProps) {
    const isBot = reporter.type === 'AI Bot';

    return (
        <div className="fixed inset-0 z-50" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Panel */}
            <div
                className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-slide-in-right"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${isBot ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                    {reporter.avatar_icon || (isBot ? '🤖' : '👤')}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{reporter.name}</h2>
                                    <p className="text-sm text-gray-500">{positionLabel} | {reporter.region}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* 기본 정보 */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">기본 정보</h3>
                            <div className="space-y-3">
                                <InfoRow icon={Briefcase} label="직위" value={positionLabel} />
                                <InfoRow icon={Users} label="유형" value={isBot ? 'AI Bot' : '시민기자'} />
                                <InfoRow icon={CheckCircle} label="상태" value={reporter.status === 'Active' ? '활동 중' : '비활성'} />
                            </div>
                        </div>

                        {/* 연락처 */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">연락처</h3>
                            <div className="space-y-3">
                                <InfoRow icon={Phone} label="전화" value={reporter.phone || '-'} />
                                <InfoRow icon={Mail} label="이메일" value={reporter.email || '-'} />
                            </div>
                        </div>

                        {/* 소개 */}
                        {reporter.bio && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">소개</h3>
                                <p className="text-gray-700 text-sm leading-relaxed">{reporter.bio}</p>
                            </div>
                        )}

                        {/* 등록일 */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">등록 정보</h3>
                            <p className="text-sm text-gray-600">
                                등록일: {new Date(reporter.created_at).toLocaleDateString('ko-KR')}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200">
                        <button
                            onClick={onEdit}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" />
                            정보 수정
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 w-16">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
        </div>
    );
}
