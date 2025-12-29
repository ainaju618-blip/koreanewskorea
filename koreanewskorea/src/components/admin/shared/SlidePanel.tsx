/**
 * SlidePanel - Slide panel component with shadcn styling
 *
 * @example
 * <SlidePanel
 *   isOpen={isPanelOpen}
 *   onClose={() => setIsPanelOpen(false)}
 *   title="Article Detail"
 *   subtitle="ID: abc123"
 *   headerActions={<Button>Save</Button>}
 * >
 *   <div>Panel content</div>
 * </SlidePanel>
 */

import { X } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/utils";

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
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full bg-card border-l border-border shadow-2xl z-50",
                    "transform transition-transform duration-300 ease-in-out",
                    WIDTH_CLASSES[width],
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    {(title || headerActions) && (
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                            <div>
                                {title && (
                                    <h2 className="text-lg font-bold text-foreground">{title}</h2>
                                )}
                                {subtitle && (
                                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                                )}
                            </div>
                            <div className="flex gap-2 items-center">
                                {headerActions}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
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
