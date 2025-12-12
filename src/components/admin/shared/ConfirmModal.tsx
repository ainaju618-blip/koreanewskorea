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
 */

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger" | "warning";
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
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform scale-100 transition-all">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{message}</p>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white rounded-lg font-medium transition ${VARIANT_STYLES[variant]}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
