"use client";

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Toast 타입 정의
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastPosition {
    x: number;
    y: number;
}

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    position?: ToastPosition; // 클릭 위치
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    showToastAt: (message: string, type: ToastType, x: number, y: number, duration?: number) => void;
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// 마지막 클릭 위치 저장
let lastClickPosition: ToastPosition = { x: 0, y: 0 };

// 클릭 위치 추적
if (typeof window !== 'undefined') {
    document.addEventListener('click', (e) => {
        lastClickPosition = { x: e.clientX, y: e.clientY };
    }, true);
}

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToastAt = useCallback((
        message: string,
        type: ToastType = 'info',
        x: number,
        y: number,
        duration = 3000
    ) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration, position: { x, y } }]);
    }, []);

    // 마지막 클릭 위치에 Toast 표시
    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        showToastAt(message, type, lastClickPosition.x, lastClickPosition.y, duration);
    }, [showToastAt]);

    const showSuccess = useCallback((message: string, duration?: number) => {
        showToast(message, 'success', duration);
    }, [showToast]);

    const showError = useCallback((message: string, duration?: number) => {
        showToast(message, 'error', duration ?? 5000);
    }, [showToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        showToast(message, 'info', duration);
    }, [showToast]);

    const showWarning = useCallback((message: string, duration?: number) => {
        showToast(message, 'warning', duration ?? 4000);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showToastAt, showSuccess, showError, showInfo, showWarning }}>
            {children}
            {/* Toast는 각자 위치에 표시 */}
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </ToastContext.Provider>
    );
}

// 개별 Toast 아이템 - 클릭 위치 근처에 표시
function ToastItem({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (toast.position) {
            // 화면 경계 체크하여 위치 조정
            const toastWidth = 300;
            const toastHeight = 80;
            const padding = 16;
            const offsetY = 20; // 클릭 위치에서 약간 아래로

            let left = toast.position.x - toastWidth / 2;
            let top = toast.position.y + offsetY;

            // 오른쪽 경계 체크
            if (left + toastWidth > window.innerWidth - padding) {
                left = window.innerWidth - toastWidth - padding;
            }
            // 왼쪽 경계 체크
            if (left < padding) {
                left = padding;
            }
            // 아래쪽 경계 체크 - 넘으면 위로
            if (top + toastHeight > window.innerHeight - padding) {
                top = toast.position.y - toastHeight - offsetY;
            }

            setPosition({ top, left });
        }
    }, [toast.position]);

    useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(onClose, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
        error: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
        info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    };

    const bgColors = {
        success: 'bg-emerald-50 border-emerald-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
        warning: 'bg-amber-50 border-amber-200',
    };

    const textColors = {
        success: 'text-emerald-800',
        error: 'text-red-800',
        info: 'text-blue-800',
        warning: 'text-amber-800',
    };

    return (
        <div
            className={`fixed z-[9999] flex items-start gap-3 px-4 py-3 rounded-lg border shadow-xl
                        animate-scale-in min-w-[200px] max-w-[320px] ${bgColors[toast.type]}`}
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            {icons[toast.type]}
            <p className={`flex-1 text-sm font-medium ${textColors[toast.type]} whitespace-pre-line`}>
                {toast.message}
            </p>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// Hook
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// 전역 toast 함수 (Provider 외부에서 사용하기 위한)
let globalShowToast: ToastContextType['showToast'] | null = null;

export function setGlobalToast(fn: ToastContextType['showToast']) {
    globalShowToast = fn;
}

export const toast = {
    show: (message: string, type?: ToastType, duration?: number) => {
        globalShowToast?.(message, type, duration);
    },
    success: (message: string, duration?: number) => {
        globalShowToast?.(message, 'success', duration);
    },
    error: (message: string, duration?: number) => {
        globalShowToast?.(message, 'error', duration ?? 5000);
    },
    info: (message: string, duration?: number) => {
        globalShowToast?.(message, 'info', duration);
    },
    warning: (message: string, duration?: number) => {
        globalShowToast?.(message, 'warning', duration ?? 4000);
    },
};
