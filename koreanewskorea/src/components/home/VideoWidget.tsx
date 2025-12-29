import { Play } from 'lucide-react';

export default function VideoWidget() {
    return (
        <div className="bg-slate-900 text-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-white">코리아NEWS</span>
                    <span className="px-1.5 py-0.5 bg-red-600 text-xs font-bold rounded">TV</span>
                </div>
                <span className="text-xs text-slate-400 cursor-pointer hover:text-white">자세히보기 &gt;</span>
            </div>

            {/* Main Video Area */}
            <div className="relative aspect-video bg-black group cursor-pointer">
                <img
                    src="https://images.unsplash.com/photo-1593784991095-a205069470b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                    alt="Video Thumbnail"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center pl-1 group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-sm font-bold truncate">
                        [영상] 국내 최초 탄광 버라이어티 예능
                    </p>
                </div>
            </div>
        </div>
    );
}
