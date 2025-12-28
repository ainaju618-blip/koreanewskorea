'use client';

import React from 'react';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    warning?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    warning,
    confirmText = '확인',
    cancelText = '취소',
    type = 'danger'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const getButtonStyle = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700';
            case 'warning':
                return 'bg-amber-600 hover:bg-amber-700';
            case 'info':
                return 'bg-blue-600 hover:bg-blue-700';
            default:
                return 'bg-red-600 hover:bg-red-700';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <Trash2 className="w-5 h-5" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5" />;
            case 'info':
                return <Check className="w-5 h-5" />;
            default:
                return <Trash2 className="w-5 h-5" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-100 text-red-600' :
                            type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                'bg-blue-100 text-blue-600'
                        }`}>
                        {getIcon()}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                </div>

                <p className="text-gray-600 mb-3">{message}</p>

                {warning && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                        ⚠️ {warning}
                    </p>
                )}

                <div className="flex gap-3 justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${getButtonStyle()}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
