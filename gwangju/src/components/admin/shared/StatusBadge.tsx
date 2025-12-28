/**
 * StatusBadge - Status badge component using shadcn Badge
 *
 * @example
 * // Article status
 * <StatusBadge type="article" status="published" />
 *
 * // User status
 * <StatusBadge type="user" status="active" />
 */

import { UserCheck, UserX, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/shadcn/badge";
import { cn } from "@/lib/utils";

// Status configuration type
interface StatusConfigItem {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
    icon?: LucideIcon;
}

type StatusConfigMap = Record<string, StatusConfigItem>;

// Status configuration by type (dark mode friendly)
const STATUS_CONFIG: Record<string, StatusConfigMap> = {
    // Article status
    article: {
        draft: {
            label: "승인 대기",
            variant: "outline",
            className: "bg-amber-900/40 text-amber-300 border-amber-700/50 hover:bg-amber-900/50"
        },
        published: {
            label: "발행됨",
            variant: "outline",
            className: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/50"
        },
        limited: {
            label: "제한공개",
            variant: "outline",
            className: "bg-orange-900/40 text-orange-300 border-orange-700/50 hover:bg-orange-900/50"
        },
        rejected: {
            label: "노출불가",
            variant: "destructive",
            className: "bg-red-900/40 text-red-300 border-red-700/50 hover:bg-red-900/50"
        },
        trash: {
            label: "휴지통",
            variant: "secondary",
            className: "bg-slate-800/60 text-slate-400 border-slate-600/50 hover:bg-slate-800/70"
        },
    },
    // User status
    user: {
        active: {
            label: "활성",
            variant: "default",
            className: "bg-green-600 text-white hover:bg-green-700",
            icon: UserCheck
        },
        suspended: {
            label: "정지",
            variant: "destructive",
            className: "bg-red-600 text-white hover:bg-red-700",
            icon: UserX
        },
    },
    // Bot status
    bot: {
        running: {
            label: "실행중",
            variant: "default",
            className: "bg-blue-600 text-white hover:bg-blue-700"
        },
        success: {
            label: "성공",
            variant: "default",
            className: "bg-green-600 text-white hover:bg-green-700"
        },
        error: {
            label: "오류",
            variant: "destructive",
            className: "bg-red-600 text-white hover:bg-red-700"
        },
        idle: {
            label: "대기",
            variant: "secondary",
            className: "bg-gray-600 text-gray-200 hover:bg-gray-700"
        },
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
            <Badge variant="secondary" className="text-xs">
                {status}
            </Badge>
        );
    }

    const Icon = config.icon;
    const isClickable = !!onClick;

    return (
        <Badge
            variant={config.variant}
            onClick={onClick}
            className={cn(
                "gap-1.5 text-xs font-medium whitespace-nowrap",
                config.className,
                isClickable && "cursor-pointer"
            )}
        >
            {showIcon && Icon && <Icon className="w-3 h-3" />}
            {config.label}
        </Badge>
    );
}

export default StatusBadge;
