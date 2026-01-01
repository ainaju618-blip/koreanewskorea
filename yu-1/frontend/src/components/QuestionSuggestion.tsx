'use client';

import { useState, useEffect, useCallback } from 'react';

interface SuggestedQuestion {
  id: string;
  text: string;
  category: string;
  score: number;
}

interface QuestionSuggestionProps {
  categoryId?: number;
  userInput?: string;
  onSelect: (question: SuggestedQuestion) => void;
}

export default function QuestionSuggestion({
  categoryId,
  userInput,
  onSelect
}: QuestionSuggestionProps) {
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!userInput || userInput.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        text: userInput,
        limit: '5'
      });

      const res = await fetch(
        `http://localhost:8000/api/questions/suggest?${params}`
      );

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Suggestion fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, [userInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300); // 디바운스

    return () => clearTimeout(timer);
  }, [fetchSuggestions]);

  if (!userInput || userInput.length < 2) {
    return null;
  }

  if (suggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 rounded-xl p-4 mt-4 border border-gray-700/50">
      <h3 className="text-amber-400 text-sm font-medium mb-3 flex items-center">
        <span className="mr-2">&#x2728;</span>
        이런 질문은 어떠세요?
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelect(q)}
              className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50
                         rounded-lg transition-colors text-gray-200 text-sm
                         border border-transparent hover:border-amber-500/30"
            >
              <span className="text-amber-400 mr-2">&#x2726;</span>
              {q.text}
              {q.category && (
                <span className="text-gray-500 text-xs ml-2">
                  ({q.category})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
