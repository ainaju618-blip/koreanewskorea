'use client';

import React, { useEffect, useRef } from 'react';

// ============================================
// Types
// ============================================
interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
  onShareKakao?: () => void;
  onShareFacebook?: () => void;
  onShareTwitter?: () => void;
  onCopyLink?: () => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  icon?: string;
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttonText?: string;
  variant?: 'success' | 'info' | 'warning' | 'error';
  icon?: string;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCancelButton?: boolean;
  cancelText?: string;
}

interface BottomSheetOptionProps {
  icon: string;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

// ============================================
// Modal Base Component
// ============================================
function ModalBase({ isOpen, onClose, children, className = '' }: ModalBaseProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className={`relative ${className}`}>{children}</div>
    </div>
  );
}

// ============================================
// Share Modal Component
// ============================================
export function ShareModal({
  isOpen,
  onClose,
  url = 'https://news.app/article/12345',
  title = '공유하기',
  onShareKakao,
  onShareFacebook,
  onShareTwitter,
  onCopyLink,
}: ShareModalProps) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      if (onCopyLink) {
        onCopyLink();
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareOptions = [
    {
      icon: 'chat_bubble',
      label: '카카오톡',
      bgColor: 'bg-[#FEE500]',
      iconColor: 'text-[#3C1E1E]',
      onClick: onShareKakao || (() => {}),
    },
    {
      icon: 'thumb_up',
      label: '페이스북',
      bgColor: 'bg-[#1877F2]',
      iconColor: 'text-white',
      onClick: onShareFacebook || (() => {}),
    },
    {
      icon: 'flutter_dash',
      label: '트위터',
      bgColor: 'bg-black',
      iconColor: 'text-white',
      onClick: onShareTwitter || (() => {}),
    },
    {
      icon: 'link',
      label: '링크 복사',
      bgColor: 'bg-slate-100',
      iconColor: 'text-slate-600',
      onClick: handleCopyLink,
    },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-[320px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <span className="text-[#111418] dark:text-white text-lg font-bold">
            {title}
          </span>
          <button
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Share Grid */}
        <div className="p-6 pb-2">
          <div className="grid grid-cols-4 gap-4">
            {shareOptions.map((option) => (
              <button
                key={option.label}
                className="flex flex-col items-center gap-2 group cursor-pointer"
                onClick={option.onClick}
              >
                <div
                  className={`w-12 h-12 ${option.bgColor} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <span className={`material-symbols-outlined ${option.iconColor}`}>
                    {option.icon}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* URL Copy Section */}
        <div className="p-4 pt-2">
          <div className="flex items-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-1 pl-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1 mr-2">
              {url}
            </span>
            <button
              className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 shadow-sm text-slate-700 dark:text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
              onClick={handleCopyLink}
            >
              복사
            </button>
          </div>
        </div>
      </div>
    </ModalBase>
  );
}

// ============================================
// Confirm Modal Component
// ============================================
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  icon,
}: ConfirmModalProps) {
  const isDanger = variant === 'danger';
  const iconName = icon || (isDanger ? 'delete' : 'help');

  return (
    <ModalBase isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-[320px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            isDanger
              ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
              : 'bg-blue-50 dark:bg-blue-900/20 text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-3xl">{iconName}</span>
        </div>

        {/* Title */}
        <h3 className="text-[#111418] dark:text-white text-lg font-bold mb-2">
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
            {message.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < message.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )}

        {/* Buttons */}
        <div className="flex w-full gap-3">
          <button
            className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium py-3 rounded-xl transition-colors text-sm"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={`flex-1 font-bold py-3 rounded-xl transition-colors text-sm shadow-md ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                : 'bg-primary hover:bg-blue-600 text-white shadow-blue-500/20'
            }`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

// ============================================
// Alert Modal Component
// ============================================
export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = '확인',
  variant = 'success',
  icon,
}: AlertModalProps) {
  const variantStyles = {
    success: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-primary',
      buttonBg: 'bg-primary hover:bg-blue-600',
      shadow: 'shadow-blue-500/20',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-500',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
      shadow: 'shadow-blue-500/20',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-500',
      buttonBg: 'bg-amber-500 hover:bg-amber-600',
      shadow: 'shadow-amber-500/20',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600',
      shadow: 'shadow-red-500/20',
    },
  };

  const styles = variantStyles[variant];
  const iconName = icon || (variant === 'success' ? 'check' : variant === 'error' ? 'error' : 'info');

  return (
    <ModalBase isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-[320px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={`w-12 h-12 ${styles.bg} ${styles.text} rounded-full flex items-center justify-center mb-4`}
        >
          <span className="material-symbols-outlined text-3xl font-bold">
            {iconName}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[#111418] dark:text-white text-lg font-bold mb-2">
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
            {message}
          </p>
        )}

        {/* Button */}
        <button
          className={`w-full ${styles.buttonBg} text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-md ${styles.shadow}`}
          onClick={onClose}
        >
          {buttonText}
        </button>
      </div>
    </ModalBase>
  );
}

// ============================================
// Bottom Sheet Option Component
// ============================================
export function BottomSheetOption({
  icon,
  label,
  description,
  onClick,
  variant = 'default',
}: BottomSheetOptionProps) {
  const isDanger = variant === 'danger';

  return (
    <button
      className={`flex items-center gap-4 px-5 py-3.5 transition-colors text-left group ${
        isDanger
          ? 'hover:bg-red-50 dark:hover:bg-red-900/10 active:bg-red-100 dark:active:bg-red-900/20'
          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700'
      }`}
      onClick={onClick}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isDanger
            ? 'bg-red-50 dark:bg-red-900/20 text-red-500 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-sm'
            : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-sm'
        }`}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="flex-1">
        <p
          className={`font-medium text-base ${
            isDanger
              ? 'text-red-500'
              : 'text-[#111418] dark:text-white'
          }`}
        >
          {label}
        </p>
        {description && (
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

// ============================================
// Bottom Sheet Component
// ============================================
export function BottomSheet({
  isOpen,
  onClose,
  title = '더보기',
  children,
  showCancelButton = true,
  cancelText = '취소',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-2xl flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-w-md mx-auto animate-slide-up"
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50 dark:border-slate-700">
          <h3 className="text-[#111418] dark:text-white text-lg font-bold">
            {title}
          </h3>
          <button
            className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Options List */}
        <div className="flex flex-col py-2">{children}</div>

        {/* Footer Cancel Button */}
        {showCancelButton && (
          <div className="p-4 pt-2 pb-8 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700">
            <button
              className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-xl transition-colors text-base"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// ============================================
// Exports
// ============================================
export type {
  ModalBaseProps,
  ShareModalProps,
  ConfirmModalProps,
  AlertModalProps,
  BottomSheetProps,
  BottomSheetOptionProps,
};
