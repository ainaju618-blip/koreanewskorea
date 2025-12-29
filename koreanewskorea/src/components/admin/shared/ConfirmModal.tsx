/**
 * ConfirmModal - Confirm modal using shadcn AlertDialog
 *
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   title="Delete Confirm"
 *   message="Are you sure you want to delete?"
 *   confirmLabel="Delete"
 *   variant="danger"
 *   onConfirm={() => handleDelete()}
 *   onCancel={() => setShowConfirm(false)}
 * />
 *
 * // Multiple confirms required
 * <ConfirmModal
 *   requiredConfirms={5}
 *   ...
 * />
 */

import { useState, useEffect } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/shadcn/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger" | "warning";
    requiredConfirms?: number;
    onConfirm: () => void;
    onCancel: () => void;
}

const VARIANT_STYLES = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700",
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

    // Reset count when modal closes
    useEffect(() => {
        if (!isOpen) {
            setConfirmCount(0);
        }
    }, [isOpen]);

    const remainingConfirms = requiredConfirms - confirmCount;
    const isMultiConfirm = requiredConfirms > 1;

    const handleConfirmClick = () => {
        if (remainingConfirms <= 1) {
            onConfirm();
            setConfirmCount(0);
        } else {
            setConfirmCount(prev => prev + 1);
        }
    };

    const handleCancelClick = () => {
        setConfirmCount(0);
        onCancel();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancelClick()}>
            <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground whitespace-pre-wrap">
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Multi-confirm progress display */}
                {isMultiConfirm && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-destructive">
                                안전 확인 절차
                            </span>
                            <span className="text-xs text-destructive/80">
                                {confirmCount} / {requiredConfirms}
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-destructive/20 rounded-full h-2">
                            <div
                                className="bg-destructive h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(confirmCount / requiredConfirms) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-destructive/90 mt-2">
                            {remainingConfirms > 1
                                ? `확인 버튼을 ${remainingConfirms}번 더 눌러주세요`
                                : remainingConfirms === 1
                                ? `마지막 확인입니다. 정말 실행하시겠습니까?`
                                : ''}
                        </p>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={handleCancelClick}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmClick}
                        className={cn(VARIANT_STYLES[variant])}
                    >
                        {isMultiConfirm
                            ? remainingConfirms <= 1
                                ? `최종 ${confirmLabel}`
                                : `${confirmLabel} (${remainingConfirms}번 남음)`
                            : confirmLabel
                        }
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ConfirmModal;
