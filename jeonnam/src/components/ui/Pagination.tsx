'use client';

import Link from 'next/link';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath?: string; // Optional: Override URL base (default: current path)
    onPageChange?: (page: number) => void; // Optional: Handler for client-side override
}

/**
 * 전역 페이지네이션 컴포넌트
 * @param currentPage 현재 페이지 번호
 * @param totalPages 전체 페이지 수
 * @param basePath 기본 URL 경로 (없으면 현재 경로 사용)
 * @param onPageChange 페이지 변경 핸들러 (제공 시 URL 변경 없이 실행됨)
 */
export default function Pagination({ currentPage, totalPages, basePath, onPageChange }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // 현재 경로 또는 지정된 경로 사용
    const path = basePath || pathname;

    // 페이지 링크 생성 함수
    const createPageUrl = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${path}?${params.toString()}`;
    };

    if (totalPages <= 1) return null;

    // 페이지 번호 범위 계산 (현재 페이지 기준 앞뒤 2개씩 표시)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // 범위 보정 (시작이 1이면 끝을 5까지, 끝이 max면 시작을 보정)
    if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
    }
    if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    // 핸들러가 있으면 버튼(button), 없으면 링크(Link) 사용
    const renderPageItem = (pageNumber: number, content: React.ReactNode, isActive: boolean = false, isDisabled: boolean = false) => {
        if (isDisabled) {
            return (
                <span className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
                    {content}
                </span>
            );
        }

        const className = `flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 font-medium ${isActive
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`;

        if (onPageChange) {
            return (
                <button
                    onClick={() => onPageChange(pageNumber)}
                    className={className}
                    type="button"
                >
                    {content}
                </button>
            );
        }

        return (
            <Link href={createPageUrl(pageNumber)} className={className}>
                {content}
            </Link>
        );
    };

    return (
        <div className="flex justify-center items-center gap-2 mt-10">
            {/* 이전 그룹 */}
            {renderPageItem(
                Math.max(1, currentPage - 1),
                <ChevronLeft className="w-5 h-5" />,
                false,
                currentPage === 1
            )}

            {/* 페이지 번호 */}
            {startPage > 1 && (
                <>
                    {renderPageItem(1, '1', currentPage === 1)}
                    {startPage > 2 && <span className="px-2 text-slate-400">...</span>}
                </>
            )}

            {pages.map(page => (
                <div key={page}>
                    {renderPageItem(page, page, currentPage === page)}
                </div>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="px-2 text-slate-400">...</span>}
                    {renderPageItem(totalPages, totalPages, currentPage === totalPages)}
                </>
            )}

            {/* 다음 그룹 */}
            {renderPageItem(
                Math.min(totalPages, currentPage + 1),
                <ChevronRight className="w-5 h-5" />,
                false,
                currentPage === totalPages
            )}
        </div>
    );
}
