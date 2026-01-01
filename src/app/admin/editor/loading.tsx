export default function EditorLoading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">\uc5d0\ub514\ud130 \ub85c\ub529 \uc911...</p>
      </div>
    </div>
  );
}
