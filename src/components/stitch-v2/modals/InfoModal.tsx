'use client';

import ModalBackdrop from './ModalBackdrop';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: string;
  maxHeight?: string;
}

export default function InfoModal({
  isOpen,
  onClose,
  title,
  children,
  icon = 'info',
  maxHeight = '70vh',
}: InfoModalProps) {
  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-[500px] flex flex-col bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0 size-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h4>
        </div>

        {/* Content - Scrollable */}
        <div
          className="p-5 overflow-y-auto"
          style={{ maxHeight }}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#1a2434] rounded-b-xl border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition-colors"
          >
            확인
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
