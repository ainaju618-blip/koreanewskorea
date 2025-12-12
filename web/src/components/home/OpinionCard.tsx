import Link from 'next/link';

export default function OpinionCard() {
    return (
        <div className="flex gap-4 items-center group cursor-pointer border-b border-slate-100 py-4 last:border-0">
            <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div className="flex-1">
                <span className="text-[11px] font-bold text-blue-600 block mb-0.5">[내성봉 칼럼]</span>
                <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:underline">
                    국민공천제를 전면 도입하자
                </h4>
            </div>
        </div>
    );
}
