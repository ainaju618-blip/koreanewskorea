import Image from 'next/image';

interface ArticleBodyProps {
  content: string;
  leadImage?: {
    src: string;
    alt: string;
    caption?: string;
  };
  tags?: string[];
}

export default function ArticleBody({
  content,
  leadImage,
  tags = [],
}: ArticleBodyProps) {
  return (
    <article className="px-5 py-6">
      {/* Lead Image */}
      {leadImage && (
        <figure className="mb-8">
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm relative group">
            <Image
              src={leadImage.src}
              alt={leadImage.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          {leadImage.caption && (
            <figcaption className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {leadImage.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Article Content */}
      <div
        className="prose prose-lg dark:prose-invert prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-white max-w-none
          [&_p]:text-[17px] [&_p]:leading-[1.8] [&_p]:mb-6 [&_p]:font-normal
          [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Tag List */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
