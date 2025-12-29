/**
 * Pagination - Pagination component using shadcn Button
 *
 * @example
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showPageNumbers?: boolean;
    maxVisiblePages?: number;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    showPageNumbers = false,
    maxVisiblePages = 5,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages: number[] = [];
        const half = Math.floor(maxVisiblePages / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisiblePages - 1);

        if (end - start + 1 < maxVisiblePages) {
            start = Math.max(1, end - maxVisiblePages + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 pb-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 border-border"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {showPageNumbers ? (
                <div className="flex gap-1">
                    {getVisiblePages().map((page) => (
                        <Button
                            key={page}
                            variant={page === currentPage ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className={cn(
                                "h-9 min-w-9 px-3",
                                page === currentPage
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            {page}
                        </Button>
                    ))}
                </div>
            ) : (
                <span className="px-4 py-2 text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
            )}

            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-9 w-9 border-border"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}

export default Pagination;
