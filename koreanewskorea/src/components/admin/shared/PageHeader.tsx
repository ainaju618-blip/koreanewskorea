/**
 * PageHeader - Page header component with shadcn styling
 *
 * @example
 * <PageHeader
 *   title="Article Management"
 *   description="Search and approve/reject articles."
 *   icon={FileEdit}
 *   actions={
 *     <Button>New Article</Button>
 *   }
 * />
 */

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    iconBgColor = "bg-primary",
    actions,
}: PageHeaderProps) {
    return (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    {Icon && (
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            iconBgColor
                        )}>
                            <Icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                    )}
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground mt-2">{description}</p>
                )}
            </div>
            {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
        </header>
    );
}

export default PageHeader;
