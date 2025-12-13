"use client";

import { useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { AlertTriangle, Info, HelpCircle, Trash2, X } from 'lucide-react';

type ConfirmType = 'danger' | 'warning' | 'info' | 'question';

interface ConfirmOptions {
    title?: string;
    message: string;
    type?: ConfirmType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    confirmDelete: (message: string, onConfirm?: () => void | Promise<void>) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

// Confirm Provider
export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise(resolve => {
            setResolvePromise(() => resolve);
        });
    }, []);

    const confirmDelete = useCallback((message: string, onConfirm?: () => void | Promise<void>): Promise<boolean> => {
        return confirm({
            title: '삭제 확인',
            message,
            type: 'danger',
            confirmText: '삭제',
            cancelText: '취소',
            onConfirm,
        });
    }, [confirm]);

    const handleConfirm = async () => {
        if (options?.onConfirm) {
            await options.onConfirm();
        }
        resolvePromise?.(true);
        setIsOpen(false);
        setOptions(null);
    };

    const handleCancel = () => {
        options?.onCancel?.();
        resolvePromise?.(false);
        setIsOpen(false);
        setOptions(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm, confirmDelete }}>
            {children}
            {isOpen && options && (
                <ConfirmModal
                    options={options}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ConfirmContext.Provider>
    );
}

// 모달 컴포넌트
function ConfirmModal({
    options,
    onConfirm,
    onCancel,
}: {
    options: ConfirmOptions;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const {
        title,
        message,
        type = 'question',
        confirmText = '확인',
        cancelText = '취소',
    } = options;

    const icons = {
        danger: <Trash2 className="w-6 h-6 text-red-500" />,
        warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
        info: <Info className="w-6 h-6 text-blue-500" />,
        question: <HelpCircle className="w-6 h-6 text-slate-500" />,
    };

    const confirmButtonStyles = {
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white',
        info: 'bg-blue-600 hover:bg-blue-700 text-white',
        question: 'bg-slate-800 hover:bg-slate-900 text-white',
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
                            {icons[type]}
                        </div>
                        <div className="flex-1 pt-1">
                            {title && (
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {title}
                                </h3>
                            )}
                            <p className="text-gray-600 whitespace-pre-line">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmButtonStyles[type]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook
export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
