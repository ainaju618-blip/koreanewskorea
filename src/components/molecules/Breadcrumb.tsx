/**
 * Breadcrumb Molecule Component
 * 네비게이션 경로 표시용 브레드크럼
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RegionBreadcrumb } from '@/lib/national-regions';

export interface BreadcrumbProps {
  items: RegionBreadcrumb[];
  className?: string;
  separator?: React.ReactNode;
}

export default function Breadcrumb({
  items,
  className,
  separator = '/',
}: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav className={cn('text-sm', className)} aria-label="브레드크럼">
      <ol className="flex items-center gap-2 text-gray-500 flex-wrap">
        {items.map((item, index) => (
          <li key={item.code} className="flex items-center gap-2">
            {/* 구분자 */}
            {index > 0 && (
              <span className="text-gray-300" aria-hidden="true">
                {separator}
              </span>
            )}

            {/* 링크 또는 현재 페이지 */}
            {item.isActive ? (
              <span
                className="text-gray-900 font-medium"
                aria-current="page"
              >
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-blue-600 transition-colors"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
