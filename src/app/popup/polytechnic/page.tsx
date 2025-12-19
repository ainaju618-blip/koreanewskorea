'use client';

import { useState } from 'react';
import Image from 'next/image';

type TabType = 'image' | 'recruitment' | 'video' | 'application';

export default function PolytechnicPopup() {
    const [activeTab, setActiveTab] = useState<TabType>('image');

    const handleTabClick = (tab: TabType) => {
        if (tab === 'application') {
            window.open('https://ipsi.kopo.ac.kr/poly/wonseo/wonseoSearch.do?daehag_cd=3320000&gwajeong_gb=34', '_blank');
            return;
        }
        setActiveTab(tab);
    };

    const renderImageContent = () => (
        <div className="flex-1 relative w-full h-full">
            <Image
                src="/images/ads/hi02.png"
                alt="Korea Polytechnic Naju Campus"
                fill
                className="object-contain"
                priority
            />
        </div>
    );

    const renderRecruitmentContent = () => (
        <div className="flex-1 overflow-auto bg-gray-100">
            <div className="flex flex-col items-center gap-4 p-4">
                <Image
                    src="/images/ads/mojib_01.png"
                    alt="Recruitment Guide Page 1"
                    width={1191}
                    height={1701}
                    className="max-w-full h-auto shadow-lg"
                    priority
                />
                <Image
                    src="/images/ads/mojib_02.png"
                    alt="Recruitment Guide Page 2"
                    width={1191}
                    height={1701}
                    className="max-w-full h-auto shadow-lg"
                />
            </div>
        </div>
    );

    const renderVideoContent = () => (
        <div className="flex-1 flex items-center justify-center bg-black">
            <video
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
            >
                <source src="/videos/mov02.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );

    return (
        <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
            {/* Main Container - fills entire popup window */}
            <div className="w-full h-full flex flex-col">
                {/* Tab Navigation - Static, Left-aligned, Mobile Responsive */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                        <button
                            onClick={() => handleTabClick('image')}
                            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                                activeTab === 'image'
                                    ? 'bg-white text-blue-700 shadow-md'
                                    : 'text-white/90 hover:bg-white/20'
                            }`}
                        >
                            이미지
                        </button>
                        <button
                            onClick={() => handleTabClick('recruitment')}
                            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                                activeTab === 'recruitment'
                                    ? 'bg-white text-blue-700 shadow-md'
                                    : 'text-white/90 hover:bg-white/20'
                            }`}
                        >
                            모집요강
                        </button>
                        <button
                            onClick={() => handleTabClick('video')}
                            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                                activeTab === 'video'
                                    ? 'bg-white text-blue-700 shadow-md'
                                    : 'text-white/90 hover:bg-white/20'
                            }`}
                        >
                            영상보기
                        </button>
                        <button
                            onClick={() => handleTabClick('application')}
                            className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-md"
                        >
                            원서접수
                        </button>

                        {/* Close button on the right */}
                        <button
                            onClick={() => window.close()}
                            className="ml-auto p-1.5 sm:p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                            aria-label="Close popup"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content Area - fills remaining space */}
                {activeTab === 'image' && renderImageContent()}
                {activeTab === 'recruitment' && renderRecruitmentContent()}
                {activeTab === 'video' && renderVideoContent()}
            </div>
        </div>
    );
}
