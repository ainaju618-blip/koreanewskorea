'use client';

import { useState } from 'react';
import ModalBackdrop from './ModalBackdrop';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  hoverColor: string;
}

const platforms: SharePlatform[] = [
  {
    id: 'kakao',
    name: '카카오톡',
    icon: 'K',
    bgColor: 'bg-[#FEE500]',
    hoverColor: 'hover:bg-[#E5CF00]',
  },
  {
    id: 'naver',
    name: '네이버',
    icon: 'N',
    bgColor: 'bg-[#03C75A]',
    hoverColor: 'hover:bg-[#02B350]',
  },
  {
    id: 'facebook',
    name: '페이스북',
    icon: 'f',
    bgColor: 'bg-[#1877F2]',
    hoverColor: 'hover:bg-[#166AE0]',
  },
  {
    id: 'twitter',
    name: 'X',
    icon: 'X',
    bgColor: 'bg-black dark:bg-white dark:text-black',
    hoverColor: 'hover:bg-gray-800 dark:hover:bg-gray-200',
  },
];

export default function ShareModal({
  isOpen,
  onClose,
  url,
  title,
  description = '',
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = (platformId: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDesc = encodeURIComponent(description);

    let shareUrl = '';

    switch (platformId) {
      case 'kakao':
        // Kakao SDK 필요 - 여기서는 카카오스토리로 대체
        shareUrl = `https://story.kakao.com/share?url=${encodedUrl}`;
        break;
      case 'naver':
        shareUrl = `https://share.naver.com/web/shareView?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-[360px] flex flex-col bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white text-center">
            공유하기
          </h4>
        </div>

        {/* Share Buttons */}
        <div className="p-5">
          <div className="grid grid-cols-4 gap-4">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform.id)}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`size-14 rounded-full ${platform.bgColor} ${platform.hoverColor} flex items-center justify-center text-xl font-bold text-white transition-colors`}
                >
                  {platform.icon}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {platform.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Link Copy */}
        <div className="p-5 pt-0">
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-[#1a2434] rounded-lg">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="닫기"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </ModalBackdrop>
  );
}
