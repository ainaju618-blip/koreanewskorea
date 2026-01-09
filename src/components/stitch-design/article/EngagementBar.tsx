'use client';

import { useState } from 'react';

interface EngagementBarProps {
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: (text: string) => void;
}

export default function EngagementBar({
  likeCount,
  commentCount,
  isLiked = false,
  onLike,
  onComment,
}: EngagementBarProps) {
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);

  const handleLike = () => {
    if (liked) {
      setLikes((prev) => prev - 1);
    } else {
      setLikes((prev) => prev + 1);
    }
    setLiked(!liked);
    onLike?.();
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onComment?.(commentText);
    setCommentText('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 p-3 pb-6 sm:pb-3 flex items-center gap-3 z-50">
      {/* Comment Input */}
      <div className="relative flex-1">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
          className="w-full h-10 pl-4 pr-10 rounded-full bg-gray-100 dark:bg-gray-700 text-sm border-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 text-gray-900 dark:text-white"
          placeholder="댓글을 입력하세요..."
        />
        <button
          onClick={handleSubmitComment}
          className="absolute right-1 top-1 size-8 flex items-center justify-center text-primary rounded-full hover:bg-primary/10"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 shrink-0">
        <button
          onClick={handleLike}
          className={`flex flex-col items-center justify-center w-10 transition-colors gap-0.5 ${
            liked
              ? 'text-red-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
          }`}
        >
          <span className={`material-symbols-outlined text-[24px] ${liked ? 'filled' : ''}`}>
            favorite
          </span>
          <span className="text-[10px]">{likes}</span>
        </button>
        <button className="flex flex-col items-center justify-center w-10 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors gap-0.5">
          <span className="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
          <span className="text-[10px]">{commentCount}</span>
        </button>
      </div>
    </div>
  );
}
