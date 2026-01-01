'use client';

import { useState, useEffect } from 'react';

interface PopularQuestion {
  id: string;
  text: string;
  category: string;
  sub_category: string;
  popularity_score: number;
}

interface PopularQuestionsProps {
  categoryId: number;
  categoryName: string;
  onSelect: (question: PopularQuestion) => void;
}

export default function PopularQuestions({
  categoryId,
  categoryName,
  onSelect
}: PopularQuestionsProps) {
  const [questions, setQuestions] = useState<PopularQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) return;

    const fetchPopular = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api/questions/popular?category_id=${categoryId}&limit=5`
        );

        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
        }
      } catch (error) {
        console.error('Popular questions fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopular();
  }, [categoryId]);

  if (!categoryId || questions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30
                    rounded-xl p-4 border border-purple-500/20 mt-4">
      <h3 className="text-purple-300 text-sm font-medium mb-3 flex items-center">
        <span className="mr-2">&#x1F525;</span>
        {categoryName} 인기 질문
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => onSelect(q)}
              className="w-full text-left p-3 bg-black/20 hover:bg-black/40
                         rounded-lg transition-colors group"
            >
              <div className="flex items-center">
                <span className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 flex-shrink-0
                  ${idx === 0 ? 'bg-yellow-500 text-black font-bold' :
                    idx === 1 ? 'bg-gray-400 text-black' :
                    idx === 2 ? 'bg-amber-600 text-black' :
                    'bg-gray-700 text-gray-300'}
                `}>
                  {idx + 1}
                </span>
                <span className="text-gray-200 text-sm group-hover:text-white line-clamp-2">
                  {q.text}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
