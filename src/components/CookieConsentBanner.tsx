'use client';

import { useState, useEffect } from 'react';
import { setCookie, getCookie } from 'cookies-next';

export default function CookieConsentBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = getCookie('kn_consent');
        if (!consent) {
            // 약간의 딜레이 후 표시 (페이지 로드 후)
            const timer = setTimeout(() => setShow(true), 1000);
            return () => clearTimeout(timer);
        }

        // 세션 ID 없으면 생성
        if (!getCookie('kn_session')) {
            setCookie('kn_session', crypto.randomUUID(), { maxAge: 365 * 24 * 60 * 60 });
        }
    }, []);

    const handleAccept = (type: 'all' | 'essential') => {
        setCookie('kn_consent', type, { maxAge: 365 * 24 * 60 * 60 });

        // 세션 ID 생성
        if (!getCookie('kn_session')) {
            setCookie('kn_session', crypto.randomUUID(), { maxAge: 365 * 24 * 60 * 60 });
        }

        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 animate-slide-up">
            <div className="max-w-5xl mx-auto px-4 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="font-medium text-gray-800 mb-1 flex items-center gap-2">
                            <span className="text-xl">🍪</span>
                            쿠키 사용 안내
                        </p>
                        <p className="text-sm text-gray-600">
                            코리아NEWS는 맞춤 뉴스 추천과 서비스 개선을 위해 쿠키를 사용합니다.
                            자세한 내용은{' '}
                            <a href="/privacy" className="text-blue-600 hover:underline">
                                개인정보처리방침
                            </a>
                            을 확인해 주세요.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => handleAccept('essential')}
                            className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            필수만 허용
                        </button>
                        <button
                            onClick={() => handleAccept('all')}
                            className="flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            모두 허용
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
