'use client';

import ModalBackdrop from './ModalBackdrop';

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: string;
    iconBg: string;
    iconColor: string;
    buttonBg: string;
  }
> = {
  danger: {
    icon: 'warning',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-500',
    buttonBg: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    icon: 'error',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-500',
    buttonBg: 'bg-amber-500 hover:bg-amber-600',
  },
  info: {
    icon: 'info',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-500',
    buttonBg: 'bg-blue-500 hover:bg-blue-600',
  },
  success: {
    icon: 'check_circle',
    iconBg: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-500',
    buttonBg: 'bg-green-500 hover:bg-green-600',
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant];

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-[400px] flex flex-col bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl">
        {/* Header & Content */}
        <div className="p-6 pb-2">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`flex-shrink-0 size-10 rounded-full ${config.iconBg} flex items-center justify-center ${config.iconColor}`}
            >
              <span className="material-symbols-outlined">{config.icon}</span>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-2">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#1a2434] rounded-b-xl flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg ${config.buttonBg} text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2`}
          >
            {isLoading && (
              <span className="material-symbols-outlined animate-spin text-sm">
                progress_activity
              </span>
            )}
            {confirmText}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="닫기"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </ModalBackdrop>
  );
}
