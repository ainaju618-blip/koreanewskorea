"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface ArticleSearchBarProps {
    authorSlug: string;
    currentTab: string;
    initialQuery?: string;
}

/**
 * Search bar for filtering articles within author page
 *
 * Allows users to search through a reporter's articles by title
 */
export default function ArticleSearchBar({
    authorSlug,
    currentTab,
    initialQuery = ""
}: ArticleSearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
            params.set("q", query.trim());
            params.set("page", "1"); // Reset to first page on new search
        } else {
            params.delete("q");
        }

        router.push(`${pathname}?${params.toString()}`);
    }, [query, router, pathname, searchParams]);

    const handleClear = useCallback(() => {
        setQuery("");
        const params = new URLSearchParams(searchParams.toString());
        params.delete("q");
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams]);

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <div className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white transition-all
                ${isFocused
                    ? "border-blue-400 ring-2 ring-blue-100 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }
            `}>
                <Search className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isFocused ? "text-blue-500" : "text-gray-400"
                }`} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search articles by title..."
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            {/* Hidden submit button for form functionality */}
            <button type="submit" className="sr-only">Search</button>
        </form>
    );
}
