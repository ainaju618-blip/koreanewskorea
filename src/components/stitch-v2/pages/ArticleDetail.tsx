'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// ============================================================================
// Type Definitions
// ============================================================================

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt?: string;
  imageUrl?: string;
  imageCaption?: string;
  likeCount: number;
  commentCount: number;
}

interface RelatedArticle {
  id: string;
  title: string;
  category: string;
  imageUrl?: string;
  timeAgo: string;
}

interface Comment {
  id: string;
  authorName: string;
  authorInitials?: string;
  content: string;
  timeAgo: string;
  likes: number;
  replies: number;
}

interface ArticleDetailProps {
  article: Article;
  relatedArticles?: RelatedArticle[];
  comments?: Comment[];
  onBookmark?: () => void;
  onShare?: () => void;
  onLike?: () => void;
  onCommentSubmit?: (text: string) => void;
  isBookmarked?: boolean;
}

// ============================================================================
// Sub Components
// ============================================================================

// 1. ArticleHeader - Back button, title, bookmark, share buttons
interface ArticleHeaderProps {
  title?: string;
  onBack?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  isBookmarked?: boolean;
}

function ArticleHeader({
  title = '전국판 뉴스',
  onBack,
  onBookmark,
  onShare,
  isBookmarked = false,
}: ArticleHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-surface-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 border-b border-gray-100 dark:border-gray-800">
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white"
      >
        <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
      </button>
      <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center truncate px-2">
        {title}
      </h2>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onBookmark}
          aria-label="Bookmark"
          className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isBookmarked ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
        <button
          onClick={handleShare}
          aria-label="Share"
          className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white"
        >
          <span className="material-symbols-outlined text-[24px]">share</span>
        </button>
      </div>
    </header>
  );
}

// 2. CategoryChips - Category badges
interface CategoryChipsProps {
  category: string;
  subCategories?: string[];
}

function CategoryChips({ category, subCategories = [] }: CategoryChipsProps) {
  return (
    <div className="flex gap-3 px-5 pt-6 pb-2 flex-wrap">
      <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/10 dark:bg-primary/20 px-3 border border-primary/20">
        <span className="text-primary text-sm font-bold leading-normal">{category}</span>
      </div>
      {subCategories.map((sub, index) => (
        <div
          key={index}
          className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-100 dark:bg-gray-800 px-3"
        >
          <span className="text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">
            {sub}
          </span>
        </div>
      ))}
    </div>
  );
}

// 3. Headline - Large title
interface HeadlineProps {
  title: string;
}

function Headline({ title }: HeadlineProps) {
  return (
    <h1 className="text-[#111418] dark:text-white tracking-tight text-[26px] sm:text-[28px] font-bold leading-[1.3] px-5 pb-3 pt-2 break-keep">
      {title}
    </h1>
  );
}

// 4. MetaInfo - Author, date, listen/text size buttons
interface MetaInfoProps {
  author: string;
  publishedAt: string;
  updatedAt?: string;
  onListenClick?: () => void;
  onTextSizeClick?: () => void;
}

function MetaInfo({
  author,
  publishedAt,
  updatedAt,
  onListenClick,
  onTextSizeClick,
}: MetaInfoProps) {
  const dateDisplay = updatedAt
    ? `${publishedAt} | 수정 ${updatedAt}`
    : publishedAt;

  return (
    <div className="flex flex-col gap-3 px-5 pb-6 border-b border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">
            {author} 기자
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs font-normal leading-normal mt-1">
            {dateDisplay}
          </p>
        </div>
      </div>
      <div className="flex justify-start pt-2">
        <button
          onClick={onListenClick}
          className="flex items-center justify-center overflow-hidden rounded-lg h-9 px-3 bg-gray-100 dark:bg-gray-800 text-[#111418] dark:text-gray-200 gap-2 text-sm font-bold leading-normal transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span className="material-symbols-outlined text-[18px]">volume_up</span>
          <span className="truncate">기사 듣기</span>
        </button>
        <button
          onClick={onTextSizeClick}
          className="flex items-center justify-center overflow-hidden rounded-lg h-9 px-3 ml-2 bg-gray-100 dark:bg-gray-800 text-[#111418] dark:text-gray-200 gap-2 text-sm font-bold leading-normal transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span className="material-symbols-outlined text-[18px]">text_increase</span>
          <span className="truncate">글자 크기</span>
        </button>
      </div>
    </div>
  );
}

// 5. ArticleBody - Main content with figure, blockquote, ad, subheading
interface ArticleBodyProps {
  content: string;
  imageUrl?: string;
  imageCaption?: string;
  quote?: {
    text: string;
    author: string;
  };
  showAd?: boolean;
}

function ArticleBody({ content, imageUrl, imageCaption, quote, showAd = false }: ArticleBodyProps) {
  // Split content by double newlines for paragraphs
  const paragraphs = content.split('\n\n').filter((p) => p.trim());

  // Check for subheadings (lines starting with ##)
  const renderContent = () => {
    return paragraphs.map((paragraph, index) => {
      // Check if it's a subheading
      if (paragraph.startsWith('## ')) {
        return (
          <h3 key={index} className="text-xl font-bold mt-8 mb-4 text-[#111418] dark:text-white">
            {paragraph.replace('## ', '')}
          </h3>
        );
      }
      return (
        <p
          key={index}
          className="text-[17px] leading-[1.8] mb-6 font-normal text-gray-800 dark:text-gray-200"
        >
          {paragraph}
        </p>
      );
    });
  };

  return (
    <article className="px-5 py-6">
      {/* Lead Image */}
      {imageUrl && (
        <figure className="mb-8">
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm relative group">
            <Image
              src={imageUrl}
              alt="Article image"
              fill
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          {imageCaption && (
            <figcaption className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {imageCaption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Paragraphs */}
      <div className="prose prose-lg dark:prose-invert prose-p:text-[#111418] dark:prose-p:text-gray-200 prose-headings:text-[#111418] dark:prose-headings:text-white max-w-none">
        {renderContent()}

        {/* Quote Block */}
        {quote && (
          <div className="border-l-4 border-primary bg-blue-50 dark:bg-blue-900/20 p-5 rounded-r-lg mb-8">
            <p className="text-lg font-bold text-gray-900 dark:text-white italic mb-2">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium text-right">
              - {quote.author}
            </p>
          </div>
        )}

        {/* Native Ad Section */}
        {showAd && (
          <div className="my-8 py-5 border-y border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1">
                AD
              </span>
              <span className="text-xs text-gray-500">스폰서 콘텐츠</span>
            </div>
            <div className="flex gap-4 items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="size-20 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base text-gray-900 dark:text-white leading-tight mb-1 truncate">
                  광고 제목
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  광고 설명 텍스트가 여기에 표시됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// 6. TagList - Hashtags
interface TagListProps {
  tags: string[];
}

function TagList({ tags }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-5 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
      {tags.map((tag, index) => (
        <Link
          key={index}
          href={`/search?tag=${encodeURIComponent(tag)}`}
          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}

// 7. ReactionBar - "Was this article helpful?" + like button
interface ReactionBarProps {
  likeCount: number;
  onLike?: () => void;
}

function ReactionBar({ likeCount, onLike }: ReactionBarProps) {
  const [liked, setLiked] = useState(false);
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

  return (
    <div className="px-5 pb-8">
      <div className="flex items-center justify-between bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            이 기사가 도움이 되었나요?
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              liked
                ? 'bg-red-100 dark:bg-red-900/40 text-red-500'
                : 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${liked ? 'filled' : ''}`}>
              favorite
            </span>
            <span className="text-sm font-bold">{likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 8. RelatedNews - Related news card list
interface RelatedNewsProps {
  items: RelatedArticle[];
}

function RelatedNews({ items }: RelatedNewsProps) {
  if (!items || items.length === 0) return null;

  return (
    <>
      {/* Divider */}
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-900" />

      <section className="py-8 px-5 bg-white dark:bg-background-dark">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#111418] dark:text-white">관련 뉴스</h3>
          <Link
            href="#"
            className="text-sm text-primary font-medium flex items-center"
          >
            더보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <Link key={item.id} href={`/news/${item.id}`} className="flex gap-4 group">
              <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <span className="material-symbols-outlined text-gray-400 text-[32px]">
                      article
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center py-0.5">
                <span className="text-xs text-primary font-bold mb-1">{item.category}</span>
                <h4 className="text-[15px] font-bold text-[#111418] dark:text-white leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <span className="text-xs text-gray-400">{item.timeAgo}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

// 9. CommentPreview - Best comment + view all button
interface CommentPreviewProps {
  comments: Comment[];
  totalCount: number;
}

function CommentPreview({ comments, totalCount }: CommentPreviewProps) {
  if (!comments || comments.length === 0) return null;

  const bestComment = comments[0];

  return (
    <section className="px-5 pt-2 pb-8 bg-white dark:bg-background-dark">
      <div className="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-[#111418] dark:text-white">
          댓글 <span className="text-primary">{totalCount}</span>
        </h3>
      </div>

      {/* Single Best Comment */}
      <div className="bg-gray-50 dark:bg-surface-dark p-4 rounded-xl mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600">
              {bestComment.authorInitials || bestComment.authorName.slice(0, 2)}
            </div>
            <span className="text-xs font-bold text-gray-900 dark:text-gray-200">
              {bestComment.authorName}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">{bestComment.timeAgo}</span>
        </div>
        <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed mb-3">
          {bestComment.content}
        </p>
        <div className="flex gap-3">
          <button className="flex items-center gap-1 text-xs text-gray-500">
            <span className="material-symbols-outlined text-[14px]">thumb_up</span>{' '}
            {bestComment.likes}
          </button>
          <button className="flex items-center gap-1 text-xs text-gray-500">
            <span className="material-symbols-outlined text-[14px]">chat_bubble</span>{' '}
            {bestComment.replies}
          </button>
        </div>
      </div>

      <button className="w-full py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        댓글 전체보기
      </button>
    </section>
  );
}

// 10. BottomEngagementBar - Fixed bottom bar with comment input + like/comment counts
interface BottomEngagementBarProps {
  likeCount: number;
  commentCount: number;
  onCommentSubmit?: (text: string) => void;
}

function BottomEngagementBar({ likeCount, commentCount, onCommentSubmit }: BottomEngagementBarProps) {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    onCommentSubmit?.(commentText);
    setCommentText('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 p-3 pb-6 sm:pb-3 flex items-center gap-3 z-50">
      <div className="relative flex-1">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full h-10 pl-4 pr-10 rounded-full bg-gray-100 dark:bg-gray-800 text-sm border-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 text-gray-900 dark:text-white"
          placeholder="댓글을 입력하세요..."
        />
        <button
          onClick={handleSubmit}
          className="absolute right-1 top-1 size-8 flex items-center justify-center text-primary rounded-full hover:bg-primary/10"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
      <div className="flex gap-1 shrink-0">
        <button className="flex flex-col items-center justify-center w-10 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors gap-0.5">
          <span className="material-symbols-outlined text-[24px]">favorite</span>
          <span className="text-[10px]">{likeCount}</span>
        </button>
        <button className="flex flex-col items-center justify-center w-10 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors gap-0.5">
          <span className="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
          <span className="text-[10px]">{commentCount}</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main ArticleDetail Component
// ============================================================================

export default function ArticleDetail({
  article,
  relatedArticles = [],
  comments = [],
  onBookmark,
  onShare,
  onLike,
  onCommentSubmit,
  isBookmarked = false,
}: ArticleDetailProps) {
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: article.title,
        url: window.location.href,
      });
    }
  };

  // Extract sub-categories from tags (first 1-2 tags as sub-categories)
  const subCategories = article.tags.slice(0, 1);
  const remainingTags = article.tags.slice(1);

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-surface-light dark:bg-background-dark shadow-xl overflow-x-hidden">
      {/* 1. ArticleHeader */}
      <ArticleHeader
        title="전국판 뉴스"
        onBookmark={onBookmark}
        onShare={handleShare}
        isBookmarked={isBookmarked}
      />

      {/* Main Scrollable Content */}
      <main className="flex-1 pb-24">
        {/* 2. CategoryChips */}
        <CategoryChips category={article.category} subCategories={subCategories} />

        {/* 3. Headline */}
        <Headline title={article.title} />

        {/* 4. MetaInfo */}
        <MetaInfo
          author={article.author}
          publishedAt={article.publishedAt}
          updatedAt={article.updatedAt}
        />

        {/* 5. ArticleBody */}
        <ArticleBody
          content={article.content}
          imageUrl={article.imageUrl}
          imageCaption={article.imageCaption}
        />

        {/* 6. TagList */}
        <TagList tags={remainingTags} />

        {/* 7. ReactionBar */}
        <div className="mt-8">
          <ReactionBar likeCount={article.likeCount} onLike={onLike} />
        </div>

        {/* 8. RelatedNews */}
        <RelatedNews items={relatedArticles} />

        {/* 9. CommentPreview */}
        <CommentPreview comments={comments} totalCount={article.commentCount} />
      </main>

      {/* 10. BottomEngagementBar */}
      <BottomEngagementBar
        likeCount={article.likeCount}
        commentCount={article.commentCount}
        onCommentSubmit={onCommentSubmit}
      />
    </div>
  );
}

// ============================================================================
// Export Sub Components for Individual Use
// ============================================================================

export {
  ArticleHeader,
  CategoryChips,
  Headline,
  MetaInfo,
  ArticleBody,
  TagList,
  ReactionBar,
  RelatedNews,
  CommentPreview,
  BottomEngagementBar,
};

export type { Article, RelatedArticle, Comment, ArticleDetailProps };
