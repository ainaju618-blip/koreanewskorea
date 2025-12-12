/**
 * StatusBadge - 상태 표시 배지 컴포넌트
 *
 * @example
 * // 기사 상태
 * <StatusBadge type="article" status="published" />
 *
 * // 사용자 상태
 * <StatusBadge type="user" status="active" />
 */

import { UserCheck, UserX, LucideIcon } from "lucide-react";

// 상태 설정 타입
interface StatusConfigItem {
    label: string;
    className: string;
    icon?: LucideIcon;
}

type StatusConfigMap = Record<string, StatusConfigItem>;

// 상태 타입별 설정
const STATUS_CONFIG: Record<string, StatusConfigMap> = {
    // 기사 상태
    article: {
        draft: { label: "승인 대기", className: "bg-yellow-100 text-yellow-700" },
        published: { label: "발행됨", className: "bg-green-100 text-green-700" },
        rejected: { label: "반려됨", className: "bg-red-100 text-red-700" },
        trash: { label: "휴지통", className: "bg-gray-100 text-gray-600" },
    },
    // 사용자 상태
    user: {
        active: { label: "활성", className: "bg-green-100 text-green-800", icon: UserCheck },
        suspended: { label: "정지", className: "bg-red-100 text-red-800", icon: UserX },
    },
    // 봇 상태
    bot: {
        running: { label: "실행중", className: "bg-blue-100 text-blue-700" },
        success: { label: "성공", className: "bg-green-100 text-green-700" },
        error: { label: "오류", className: "bg-red-100 text-red-700" },
        idle: { label: "대기", className: "bg-gray-100 text-gray-600" },
    },
};

interface StatusBadgeProps {
    type: "article" | "user" | "bot";
    status: string;
    onClick?: () => void;
    showIcon?: boolean;
}

export function StatusBadge({ type, status, onClick, showIcon = true }: StatusBadgeProps) {
    const config = STATUS_CONFIG[type]?.[status];

    if (!config) {
        return (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                {status}
            </span>
        );
    }

    const Icon = config.icon;
    const isClickable = !!onClick;

    return (
        <span
            onClick={onClick}
            className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                ${config.className}
                ${isClickable ? "cursor-pointer hover:opacity-80 transition" : ""}
            `}
        >
            {showIcon && Icon && <Icon className="w-3 h-3" />}
            {config.label}
        </span>
    );
}

export default StatusBadge;
