'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface SearchResult {
  id: string;
  text: string;
  major_category_name: string;
  sub_category: string;
  score?: number;
}

interface QuestionSearchProps {
  onSelect: (question: SearchResult) => void;
  placeholder?: string;
  categoryFilter?: number;
}

export default function QuestionSearch({
  onSelect,
  placeholder = "질문을 검색하세요...",
  categoryFilter
}: QuestionSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 디바운스된 검색
  const searchQuestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '10'
      });

      if (categoryFilter) {
        params.append('category_id', categoryFilter.toString());
      }

      const res = await fetch(
        `http://localhost:8000/api/questions/search?${params}`
      );

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  // 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // 디바운스
    const timer = setTimeout(() => {
      searchQuestions(value);
    }, 300);

    return () => clearTimeout(timer);
  };

  // 질문 선택
  const handleSelect = (question: SearchResult) => {
    setQuery(question.text);
    setIsOpen(false);
    onSelect(question);
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 검색 입력 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-600
                     rounded-xl text-white placeholder-gray-400
                     focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                     transition-colors"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
          &#x1F50D;
        </span>
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-400" />
          </span>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700
                        rounded-xl shadow-xl max-h-80 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-gray-800
                         border-b border-gray-800 last:border-0 transition-colors"
            >
              <div className="text-gray-200 text-sm line-clamp-2">{result.text}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">
                  {result.major_category_name}
                </span>
                {result.sub_category && (
                  <span className="bg-gray-700/50 px-2 py-0.5 rounded text-xs text-gray-400">
                    {result.sub_category}
                  </span>
                )}
                {result.score && (
                  <span className="text-amber-400 text-xs ml-auto">
                    {Math.round(result.score * 100)}% match
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700
                        rounded-xl shadow-xl p-4 text-center text-gray-400">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}
