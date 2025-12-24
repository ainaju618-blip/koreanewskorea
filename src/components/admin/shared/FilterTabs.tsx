/**
 * FilterTabs - Filter tabs component using shadcn Tabs
 *
 * @example
 * <FilterTabs
 *   tabs={[
 *     { key: "all", label: "All" },
 *     { key: "draft", label: "Pending" },
 *     { key: "published", label: "Published" },
 *   ]}
 *   activeTab={filterStatus}
 *   onChange={(key) => setFilterStatus(key)}
 * />
 */

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { cn } from "@/lib/utils";

interface Tab {
    key: string;
    label: string;
    count?: number;
}

interface FilterTabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (key: string) => void;
    variant?: "pills" | "buttons";
}

export function FilterTabs({
    tabs,
    activeTab,
    onChange,
    variant = "pills",
}: FilterTabsProps) {
    if (variant === "buttons") {
        return (
            <div className="flex gap-2">
                {tabs.map((tab) => (
                    <Button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        variant={activeTab === tab.key ? "default" : "secondary"}
                        size="sm"
                        className={cn(
                            "transition-all",
                            activeTab === tab.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <Badge
                                variant="outline"
                                className="ml-1.5 text-xs px-1.5 py-0 h-5 bg-background/20"
                            >
                                {tab.count}
                            </Badge>
                        )}
                    </Button>
                ))}
            </div>
        );
    }

    // Pills variant (default) using shadcn Tabs
    return (
        <Tabs value={activeTab} onValueChange={onChange} className="w-auto">
            <TabsList className="bg-muted/50 border border-border">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        className={cn(
                            "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm",
                            "text-muted-foreground hover:text-foreground transition-all"
                        )}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className="ml-1.5 text-xs opacity-70">
                                ({tab.count})
                            </span>
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}

export default FilterTabs;
