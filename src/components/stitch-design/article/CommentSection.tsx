'use client';

import Link from 'next/link';

interface Comment {
  id: string;
  author: string;
  content: string;
  timeAgo: string;
  likes: number;
  replies: number;
}

interface CommentSectionProps {
  comments: Comment[];
  totalCount: number;
  articleId: string;
}

export default function CommentSection({
  comments,
  totalCount,
  articleId,
}: CommentSectionProps) {
  return (
    <section className="px-5 pt-2 pb-8 bg-white dark:bg-[#101722]">
      <div className="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          댓글 <span className="text-primary">{totalCount}</span>
        </h3>
      </div>

      {/* Best Comment Preview */}
      {comments.slice(0, 1).map((comment) => (
        <div
          key={comment.id}
          className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600">
                {comment.author.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-200">
                {comment.author}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">{comment.timeAgo}</span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed mb-3">
            {comment.content}
          </p>
          <div className="flex gap-3">
            <button className="flex items-center gap-1 text-xs text-gray-500">
              <span className="material-symbols-outlined text-[14px]">thumb_up</span>
              {comment.likes}
            </button>
            <button className="flex items-center gap-1 text-xs text-gray-500">
              <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
              {comment.replies}
            </button>
          </div>
        </div>
      ))}

      <Link
        href={`/news/${articleId}/comments`}
        className="w-full py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
      >
        댓글 전체보기
      </Link>
    </section>
  );
}
