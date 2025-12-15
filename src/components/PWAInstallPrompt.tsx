'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// 공통 PWA 설치 로직 훅
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // iOS 체크
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // 이미 설치되었는지 체크
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Android/Chrome 설치 프롬프트
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS는 항상 설치 가능 표시
    if (isIOSDevice) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return {
    isInstallable,
    isIOS,
    showIOSGuide,
    setShowIOSGuide,
    handleInstallClick,
  };
}

// iOS 가이드 모달 컴포넌트
function IOSGuideModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#0a192f]">홈 화면에 추가</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[#0a192f] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</div>
            <p>Safari 하단의 <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </span> 공유 버튼을 탭하세요</p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[#0a192f] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</div>
            <p><strong>&quot;홈 화면에 추가&quot;</strong>를 선택하세요</p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[#0a192f] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</div>
            <p>오른쪽 상단의 <strong>&quot;추가&quot;</strong>를 탭하세요</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-[#0a192f] hover:bg-[#0a192f]/90 text-white font-medium rounded-xl transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}

// 헤더용 설치 버튼 (PC용)
export function PWAInstallButton() {
  const { isInstallable, showIOSGuide, setShowIOSGuide, handleInstallClick } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#A6121D] hover:bg-[#e02555] text-white text-sm font-medium rounded-full transition-colors shadow-sm"
        title="앱 설치"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">앱 설치</span>
      </button>
      <IOSGuideModal show={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </>
  );
}

// 모바일 메뉴용 설치 버튼 (햄버거 메뉴 내부용) - 항상 표시
export function PWAInstallMenuItem({ onMenuClose }: { onMenuClose?: () => void }) {
  const { isInstallable, isIOS, showIOSGuide, setShowIOSGuide, handleInstallClick } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // 이미 standalone 모드로 실행 중인지 확인
  const [isStandalone, setIsStandalone] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }
  }, []);

  // 이미 앱으로 실행 중이면 숨김
  if (isStandalone) return null;

  const handleClick = () => {
    if (isInstallable) {
      // 설치 가능한 경우 (Android Chrome 등)
      handleInstallClick();
      if (onMenuClose && !isIOS) {
        onMenuClose();
      }
    } else {
      // 설치 불가능한 경우 (iOS Safari 등) - 가이드 표시
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center justify-center gap-2 py-3 bg-[#0a192f] hover:bg-[#0a192f]/90 rounded-xl font-bold text-white border border-[#0a192f] shadow-sm w-full col-span-2 transition-colors"
      >
        <Download className="w-5 h-5" />
        <span>홈 화면에 추가</span>
      </button>
      <IOSGuideModal show={showIOSGuide || showGuide} onClose={() => { setShowIOSGuide(false); setShowGuide(false); }} />
    </>
  );
}

// 모바일 하단 배너
export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 이미 설치되었는지 체크
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // 배너 숨김 상태 체크 (7일간)
    const dismissedTime = localStorage.getItem('pwa-banner-dismissed');
    if (dismissedTime) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedTime) < sevenDays) {
        return;
      }
    }

    // iOS 체크
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // iOS에서는 3초 후 배너 표시
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome 설치 프롬프트
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // 3초 후 배너 표시
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <>
      {/* 모바일 하단 배너 */}
      <div className="fixed bottom-0 left-0 right-0 z-[150] md:hidden animate-slide-up">
        <div className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0a192f] rounded-xl flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#0a192f] text-sm">코리아NEWS 앱 설치</p>
              <p className="text-xs text-slate-500 truncate">홈 화면에 추가하고 빠르게 접속하세요</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDismiss}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-[#A6121D] hover:bg-[#e02555] text-white text-sm font-bold rounded-lg transition-colors"
              >
                설치
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS 설치 가이드 모달 */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4">
          <div className="bg-white rounded-t-2xl max-w-lg w-full p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#0a192f]">홈 화면에 추가하기</h3>
              <button onClick={() => setShowIOSGuide(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-[#0a192f] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <p>Safari 하단의 <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 mx-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </span> 공유 버튼을 탭하세요</p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-[#0a192f] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <p>스크롤 후 <strong>"홈 화면에 추가"</strong>를 선택하세요</p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-[#0a192f] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <p>오른쪽 상단의 <strong>"추가"</strong>를 탭하면 완료!</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-6 py-3 bg-[#0a192f] hover:bg-[#0a192f]/90 text-white font-medium rounded-xl transition-colors"
            >
              확인했어요
            </button>
          </div>
        </div>
      )}
    </>
  );
}
