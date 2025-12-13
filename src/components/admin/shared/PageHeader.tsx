/**
 * PageHeader - 페이지 헤더 컴포넌트
 *
 * @example
 * <PageHeader
 *   title="기사 관리"
 *   description="전체 기사를 검색하고 승인/반려 처리를 수행합니다."
 *   icon={FileEdit}
 *   actions={
 *     <button className="btn-primary">새 기사 작성</button>
 *   }
 * />
 */

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    iconBgColor?: string;
    actions?: ReactNode;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    iconBgColor = "bg-blue-600",
    actions,
}: PageHeaderProps) {
    return (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    {Icon && (
                        <div className={`w-10 h-10 ${iconBgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    )}
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-gray-500 mt-2">{description}</p>
                )}
            </div>
            {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
        </header>
    );
}

export default PageHeader;
