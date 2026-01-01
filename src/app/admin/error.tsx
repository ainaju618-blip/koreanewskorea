'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        \uc624\ub958 \ubc1c\uc0dd
      </h2>
      <p className="text-gray-500 mb-6">{error.message}</p>
      <div className="space-x-4">
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          \ub2e4\uc2dc \uc2dc\ub3c4
        </button>
        <a
          href="/admin"
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 inline-block"
        >
          \uad00\ub9ac\uc790 \ud648\uc73c\ub85c
        </a>
      </div>
    </div>
  );
}
