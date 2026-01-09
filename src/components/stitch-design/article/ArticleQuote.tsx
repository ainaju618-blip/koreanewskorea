interface ArticleQuoteProps {
  quote: string;
  author?: string;
}

export default function ArticleQuote({ quote, author }: ArticleQuoteProps) {
  return (
    <div className="border-l-4 border-primary bg-blue-50 dark:bg-blue-900/20 p-5 rounded-r-lg my-8">
      <p className="text-lg font-bold text-gray-900 dark:text-white italic mb-2">
        "{quote}"
      </p>
      {author && (
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium text-right">
          - {author}
        </p>
      )}
    </div>
  );
}
