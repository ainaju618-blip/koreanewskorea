import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function NoticeBar() {
    return (
        <div className="flex items-center border border-slate-200 rounded-sm bg-white p-3 md:px-5 md:py-3 gap-4 mb-8 text-sm">
            <span className="px-3 py-1 bg-blue-500 text-white font-bold text-xs rounded-full shrink-0">
                알립니다
            </span>
            <div className="flex-1 truncate text-slate-600 cursor-pointer hover:underline">
                [알립니다] 2025 코리아NEWS 사장배 전국 아마추어 골프대회
            </div>
            <div className="flex items-center border border-slate-200 rounded overflow-hidden shrink-0">
                <button className="p-1 hover:bg-slate-50 border-r border-slate-200">
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <button className="p-1 hover:bg-slate-50">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    );
}
