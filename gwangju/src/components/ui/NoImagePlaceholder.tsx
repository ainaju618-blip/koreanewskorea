/**
 * NoImagePlaceholder - 이미지 없는 기사 대체 표시 컴포넌트
 *
 * @example
 * <NoImagePlaceholder regionName="순천시" className="w-full h-48" />
 */

import { ImageOff } from "lucide-react";

interface NoImagePlaceholderProps {
    regionName?: string;
    className?: string;
}

export function NoImagePlaceholder({ regionName, className = "" }: NoImagePlaceholderProps) {
    return (
        <div
            className={`
                flex flex-col items-center justify-center
                bg-gradient-to-br from-gray-100 to-gray-200
                text-gray-400
                ${className}
            `}
        >
            <ImageOff className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-xs font-medium">이미지 없음</span>
            {regionName && (
                <span className="text-[10px] mt-0.5 opacity-70">{regionName}</span>
            )}
        </div>
    );
}

export default NoImagePlaceholder;
