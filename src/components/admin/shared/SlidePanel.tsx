/**
 * SlidePanel - 슬라이드 패널 컴포넌트
 *
 * @example
 * <SlidePanel
 *   isOpen={isPanelOpen}
 *   onClose={() => setIsPanelOpen(false)}
 *   title="기사 상세"
 *   subtitle="ID: abc123"
 *   headerActions={<button>저장</button>}
 * >
 *   <div>패널 내용</div>
 * </SlidePanel>
 */

import { X } from "lucide-react";
import { ReactNode } from "react";

interface SlidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    headerActions?: ReactNode;
    children: ReactNode;
    width?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const WIDTH_CLASSES = {
    sm: "w-[400px]",
    md: "w-[500px]",
    lg: "w-[600px]",
    xl: "w-[800px]",
    "2xl": "w-[900px]",
};

export function SlidePanel({
    isOpen,
    onClose,
    title,
    subtitle,
    headerActions,
    children,
    width = "lg",
}: SlidePanelProps) {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div
                className={`
                    fixed top-0 right-0 h-full ${WIDTH_CLASSES[width]} bg-white shadow-2xl z-50
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "translate-x-full"}
                `}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    {(title || headerActions) && (
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                {title && (
                                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                                )}
                                {subtitle && (
                                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                                )}
                            </div>
                            <div className="flex gap-2 items-center">
                                {headerActions}
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}

export default SlidePanel;
