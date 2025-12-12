/**
 * FilterTabs - 필터 탭 컴포넌트
 *
 * @example
 * <FilterTabs
 *   tabs={[
 *     { key: "all", label: "전체" },
 *     { key: "draft", label: "승인 대기" },
 *     { key: "published", label: "발행됨" },
 *   ]}
 *   activeTab={filterStatus}
 *   onChange={(key) => setFilterStatus(key)}
 * />
 */

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
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            activeTab === tab.key
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className="ml-1.5 text-xs opacity-75">({tab.count})</span>
                        )}
                    </button>
                ))}
            </div>
        );
    }

    // Pills variant (default)
    return (
        <div className="flex bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        activeTab === tab.key
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className="ml-1 text-xs opacity-60">({tab.count})</span>
                    )}
                </button>
            ))}
        </div>
    );
}

export default FilterTabs;
