/**
 * ConfirmModal - 확인 모달 컴포넌트
 *
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   title="삭제 확인"
 *   message="정말 삭제하시겠습니까?"
 *   confirmLabel="삭제"
 *   variant="danger"
 *   onConfirm={() => handleDelete()}
 *   onCancel={() => setShowConfirm(false)}
 * />
 *
 * // 5번 확인 필요한 경우
 * <ConfirmModal
 *   requiredConfirms={5}
 *   ...
 * />
 */

import { useState, useEffect } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger" | "warning";
    requiredConfirms?: number; // 여러 번 확인 필요 시 (예: 5)
    onConfirm: () => void;
    onCancel: () => void;
}

const VARIANT_STYLES = {
    default: "bg-blue-600 hover:bg-blue-700",
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
};

export function ConfirmModal({
    isOpen,
    title = "확인",
    message,
    confirmLabel = "확인",
    cancelLabel = "취소",
    variant = "default",
    requiredConfirms = 1,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const [confirmCount, setConfirmCount] = useState(0);

    // 모달이 닫히면 카운트 리셋
    useEffect(() => {
        if (!isOpen) {
            setConfirmCount(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const remainingConfirms = requiredConfirms - confirmCount;
    const isMultiConfirm = requiredConfirms > 1;

    const handleConfirmClick = () => {
        if (remainingConfirms <= 1) {
            // 마지막 확인 또는 단일 확인
            onConfirm();
            setConfirmCount(0);
        } else {
            // 아직 더 확인 필요
            setConfirmCount(prev => prev + 1);
        }
    };

    const handleCancelClick = () => {
        setConfirmCount(0);
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform scale-100 transition-all">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{message}</p>

                    {/* 다중 확인 진행 상황 표시 */}
                    {isMultiConfirm && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-red-800">
                                    안전 확인 절차
                                </span>
                                <span className="text-xs text-red-600">
                                    {confirmCount} / {requiredConfirms}
                                </span>
                            </div>
                            {/* 진행 바 */}
                            <div className="w-full bg-red-200 rounded-full h-2">
                                <div
                                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(confirmCount / requiredConfirms) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-red-700 mt-2">
                                {remainingConfirms > 1
                                    ? `확인 버튼을 ${remainingConfirms}번 더 눌러주세요`
                                    : remainingConfirms === 1
                                    ? `마지막 확인입니다. 정말 실행하시겠습니까?`
                                    : ''}
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={handleCancelClick}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirmClick}
                        className={`px-4 py-2 text-white rounded-lg font-medium transition ${VARIANT_STYLES[variant]}`}
                    >
                        {isMultiConfirm
                            ? remainingConfirms <= 1
                                ? `최종 ${confirmLabel}`
                                : `${confirmLabel} (${remainingConfirms}번 남음)`
                            : confirmLabel
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
