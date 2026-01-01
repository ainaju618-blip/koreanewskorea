'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { PAGE_LIST } from '@/lib/layout-editor/types';

interface PageListProps {
  currentPage: string;
  onSelectPage: (path: string) => void;
}

export default function PageList({ currentPage, onSelectPage }: PageListProps) {
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Public', 'Admin', 'Category']);

  // Group pages
  const groupedPages = PAGE_LIST.reduce((acc, page) => {
    if (!acc[page.group]) {
      acc[page.group] = [];
    }
    acc[page.group].push(page);
    return acc;
  }, {} as Record<string, typeof PAGE_LIST[number][]>);

  // Filter pages
  const filteredGroups = Object.entries(groupedPages).reduce((acc, [group, pages]) => {
    const filtered = pages.filter(
      page =>
        page.name.toLowerCase().includes(search.toLowerCase()) ||
        page.path.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof PAGE_LIST[number][]>);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-[#30363d]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            placeholder="페이지 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Page List */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(filteredGroups).map(([group, pages]) => (
          <div key={group} className="mb-2">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-[#8b949e] uppercase tracking-wider hover:text-[#e6edf3] transition"
            >
              {expandedGroups.includes(group) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {group}
              <span className="ml-auto text-[#484f58]">{pages.length}</span>
            </button>

            {/* Pages */}
            {expandedGroups.includes(group) && (
              <div className="mt-1 space-y-0.5">
                {pages.map(page => (
                  <button
                    key={page.path}
                    onClick={() => onSelectPage(page.path)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                      currentPage === page.path
                        ? 'bg-blue-900/50 text-blue-400'
                        : 'text-[#c9d1d9] hover:bg-[#21262d]'
                    }`}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{page.name}</div>
                      <div className="text-xs text-[#8b949e] truncate">{page.path}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom URL Input */}
      <div className="p-3 border-t border-[#30363d]">
        <label className="block text-xs font-medium text-[#8b949e] mb-1">직접 입력</label>
        <input
          type="text"
          placeholder="/경로/입력"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSelectPage((e.target as HTMLInputElement).value);
            }
          }}
          className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
