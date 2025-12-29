/**
 * DangerConfirmModal - 위험한 작업용 확인 모달
 *
 * 영구 삭제 등 되돌릴 수 없는 작업에 사용
 * 기본 5번 확인 필요
 *
 * @example
 * <DangerConfirmModal
 *   isOpen={showDeleteAll}
 *   title="전체 삭제"
 *   message="모든 기사를 삭제합니다."
 *   onConfirm={handleDeleteAll}
 *   onCancel={() => setShowDeleteAll(false)}
 * />
 */

import { ConfirmModal } from './ConfirmModal';

interface DangerConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    requiredConfirms?: number; // 기본 5번
    onConfirm: () => void;
    onCancel: () => void;
}

export function DangerConfirmModal({
    isOpen,
    title = '⚠️ 영구 삭제 경고',
    message,
    confirmLabel = '영구 삭제',
    cancelLabel = '취소',
    requiredConfirms = 5,
    onConfirm,
    onCancel,
}: DangerConfirmModalProps) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            title={title}
            message={message}
            confirmLabel={confirmLabel}
            cancelLabel={cancelLabel}
            variant="danger"
            requiredConfirms={requiredConfirms}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
}

export default DangerConfirmModal;
