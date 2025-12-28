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

// Modal Component - Modern Design
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
        confirmText = 'Confirm',
        cancelText = 'Cancel',
    } = options;

    const styles = {
        danger: {
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            accent: 'bg-gradient-to-r from-red-500 to-red-400',
            button: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/25',
        },
        warning: {
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            accent: 'bg-gradient-to-r from-amber-500 to-amber-400',
            button: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/25',
        },
        info: {
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            accent: 'bg-gradient-to-r from-blue-500 to-blue-400',
            button: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25',
        },
        question: {
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-600',
            accent: 'bg-gradient-to-r from-slate-600 to-slate-500',
            button: 'bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white shadow-lg shadow-slate-500/25',
        },
    };

    const icons = {
        danger: <Trash2 className={`w-6 h-6 ${styles[type].iconColor}`} />,
        warning: <AlertTriangle className={`w-6 h-6 ${styles[type].iconColor}`} />,
        info: <Info className={`w-6 h-6 ${styles[type].iconColor}`} />,
        question: <HelpCircle className={`w-6 h-6 ${styles[type].iconColor}`} />,
    };

    const style = styles[type];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.3)] w-full max-w-md animate-scale-in overflow-hidden">
                {/* Accent Bar */}
                <div className={`h-1.5 ${style.accent}`} />

                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6 pt-8">
                    <div className="flex flex-col items-center text-center">
                        {/* Icon */}
                        <div className={`p-4 ${style.iconBg} rounded-2xl mb-5`}>
                            {icons[type]}
                        </div>

                        {/* Title */}
                        {title && (
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {title}
                            </h3>
                        )}

                        {/* Message */}
                        <p className="text-slate-500 whitespace-pre-line leading-relaxed max-w-[280px]">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-5 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-5 py-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-5 py-3 text-sm font-semibold rounded-xl transition-all ${style.button}`}
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
