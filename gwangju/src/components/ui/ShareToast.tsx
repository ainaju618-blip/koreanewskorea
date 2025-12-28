"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    Link2,
    MessageCircle,
    Facebook,
    Twitter,
    Check
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ShareToastProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title: string;
    autoCloseDelay?: number; // ms, 0이면 자동 닫힘 비활성화
}

export default function ShareToast({
    isOpen,
    onClose,
    url,
    title,
    autoCloseDelay = 5000
}: ShareToastProps) {
    const [copied, setCopied] = useState(false);
    const { showSuccess, showError } = useToast();

    // 자동 닫힘
    useEffect(() => {
        if (isOpen && autoCloseDelay > 0) {
            const timer = setTimeout(onClose, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoCloseDelay, onClose]);

    // 복사 상태 초기화
    useEffect(() => {
        if (!isOpen) {
            setCopied(false);
        }
    }, [isOpen]);

    // URL 복사
    const handleCopyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('복사 실패:', err);
        }
    }, [url]);

    // 카카오톡 공유 (클립보드 복사 + 안내)
    const handleKakao = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(url);
            showSuccess('클립보드에 복사되었습니다.\n카카오톡 대화창에서 붙여넣기 하세요.');
            onClose(); // 드롭다운 닫기
        } catch (err) {
            console.error('복사 실패:', err);
            showError('복사에 실패했습니다. 다시 시도해주세요.');
        }
    }, [url, showSuccess, showError, onClose]);

    // 페이스북 공유
    const handleFacebook = useCallback(() => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
    }, [url]);

    // 트위터(X) 공유
    const handleTwitter = useCallback(() => {
        const tweetUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        window.open(tweetUrl, '_blank', 'width=600,height=400');
    }, [url, title]);

    if (!isOpen) return null;

    return (
        <>
            {/* 배경 오버레이 (클릭 시 닫기) */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* 드롭다운 - 아이콘만 */}
            <div
                className="absolute top-full right-0 mt-2 z-50
                           bg-white rounded-full shadow-lg border border-gray-200
                           px-2 py-1.5 flex items-center gap-3
                           animate-fade-in"
            >
                {/* URL 복사 */}
                <button
                    onClick={handleCopyLink}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title={copied ? '복사됨!' : 'URL 복사'}
                >
                    {copied ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                        <Link2 className="w-5 h-5" />
                    )}
                </button>

                {/* 카카오톡 */}
                <button
                    onClick={handleKakao}
                    className="text-yellow-500 hover:text-yellow-600 transition-colors"
                    title="카카오톡 공유"
                >
                    <MessageCircle className="w-5 h-5 fill-current" />
                </button>

                {/* 페이스북 */}
                <button
                    onClick={handleFacebook}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    title="페이스북 공유"
                >
                    <Facebook className="w-5 h-5 fill-current" />
                </button>

                {/* 트위터(X) */}
                <button
                    onClick={handleTwitter}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                    title="X(트위터) 공유"
                >
                    <Twitter className="w-5 h-5" />
                </button>
            </div>
        </>
    );
}
