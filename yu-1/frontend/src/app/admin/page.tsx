'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LAYOUT_STYLES, LAYOUT_STYLE_STORAGE_KEY, type HeroLayoutStyle } from '@/types/layoutStyles';

// 점술 방식 타입
type DivinationType = 'coin' | 'shicho' | '384';

// 미디어 파일 타입
interface MediaFile {
  filename: string;
  type: string;
  size: number;
  size_mb: number;
  path: string;
}

// API 기본 URL
const API_BASE = 'http://localhost:8000';

interface DivinationMethod {
  id: DivinationType;
  name: string;
  nameEn: string;
  emoji: string;
  description: string;
  details: string[];
  color: string;
  borderColor: string;
}

const DIVINATION_METHODS: DivinationMethod[] = [
  {
    id: 'coin',
    name: '동전점',
    nameEn: 'Coin Divination',
    emoji: '🪙',
    description: '동전 3개를 6번 던져 괘를 구성',
    details: [
      '동전 3개 × 6회 = 18번 던지기',
      '앞/뒤 조합으로 음효/양효 결정',
      '변효 확률: 양 3:1 음',
      '소요시간: 약 5분',
    ],
    color: 'from-amber-500/20 to-yellow-600/10',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 'shicho',
    name: '시초점',
    nameEn: 'Yarrow Stalk',
    emoji: '🌿',
    description: '50개 서죽으로 18번 조작하는 정통 방식',
    details: [
      '49개 서죽 사용 (1개는 태극)',
      '3변 × 6효 = 18번 조작',
      '전통 확률분포 (노양 18.75%)',
      '소요시간: 약 20분',
    ],
    color: 'from-green-500/20 to-emerald-600/10',
    borderColor: 'border-green-500/30',
  },
  {
    id: '384',
    name: '정통 384효',
    nameEn: 'Traditional 384',
    emoji: '🔮',
    description: '조주역학회 방식으로 384효 중 1개 직접 선택',
    details: [
      '49개 서죽으로 3번 조작',
      '하괘 → 상괘 → 효 순서 결정',
      '균등 확률 (1/384)',
      '소요시간: 약 3분',
    ],
    color: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/30',
  },
];

export default function AdminPage() {
  const [selectedMethod, setSelectedMethod] = useState<DivinationType>('coin');
  const [selectedLayout, setSelectedLayout] = useState<string>('classic-mystical');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'divination' | 'layout' | 'video'>('video');

  // 영상 관리 상태
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 저장된 설정 불러오기
  useEffect(() => {
    const savedMethod = localStorage.getItem('divinationMethod');
    if (savedMethod && ['coin', 'shicho', '384'].includes(savedMethod)) {
      setSelectedMethod(savedMethod as DivinationType);
    }

    const savedLayout = localStorage.getItem(LAYOUT_STYLE_STORAGE_KEY);
    if (savedLayout) {
      setSelectedLayout(savedLayout);
    }

    // 영상 목록 및 설정 로드
    loadVideos();
    loadVideoSettings();
  }, []);

  // 영상 목록 로드
  const loadVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/media/list`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('영상 목록 로드 실패:', error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // 영상 설정 로드
  const loadVideoSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/hero-video`);
      if (res.ok) {
        const data = await res.json();
        setSelectedVideo(data.video || '');
      }
    } catch (error) {
      console.error('영상 설정 로드 실패:', error);
    }
  };

  // 영상 업로드
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('파일 크기는 50MB 이하만 가능합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/api/settings/media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await loadVideos();
        setSaveMessage('✅ 영상이 업로드되었습니다!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const error = await res.json();
        alert(`업로드 실패: ${error.detail}`);
      }
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 영상 삭제
  const handleDeleteVideo = async (filename: string) => {
    if (!confirm(`'${filename}' 영상을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/settings/media/file/${filename}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadVideos();
        if (selectedVideo === filename) {
          setSelectedVideo('');
        }
        setSaveMessage('✅ 영상이 삭제되었습니다.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // 영상 선택 저장
  const handleSaveVideo = async () => {
    if (!selectedVideo) {
      alert('영상을 선택해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/hero-video`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_video: selectedVideo }),
      });

      if (res.ok) {
        // localStorage에도 저장 (프론트엔드 캐시용)
        localStorage.setItem('heroVideo', selectedVideo);
        setSaveMessage('✅ 영상이 적용되었습니다! 홈 화면에서 확인하세요.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 설정 저장
  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('divinationMethod', selectedMethod);
    localStorage.setItem(LAYOUT_STYLE_STORAGE_KEY, selectedLayout);

    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('✅ 저장되었습니다! 홈 화면에서 확인하세요.');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 500);
  };

  const getSelectedLayoutStyle = (): HeroLayoutStyle => {
    return LAYOUT_STYLES.find(s => s.id === selectedLayout) || LAYOUT_STYLES[0];
  };

  return (
    <div className="min-h-screen bg-dark-stars">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              <span className="font-bold text-lg text-white">관리자 설정</span>
            </div>
            <Link
              href="/"
              className="text-sm text-amber-400 hover:text-amber-300 transition"
            >
              ← 홈으로
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 탭 네비게이션 */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-sm text-amber-300 shadow-lg border border-amber-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🎬</span>
            <span>영상</span>
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'layout'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-sm text-amber-300 shadow-lg border border-amber-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🎨</span>
            <span>레이아웃</span>
          </button>
          <button
            onClick={() => setActiveTab('divination')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'divination'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-sm text-amber-300 shadow-lg border border-amber-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🎲</span>
            <span>점술</span>
          </button>
        </div>

        {/* 영상 관리 탭 */}
        {activeTab === 'video' && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎬</span>
              <h2 className="text-xl font-bold text-white">히어로 영상 관리</h2>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              홈 화면 상단에 표시될 배경 영상을 선택하거나 업로드하세요.
            </p>

            {/* 업로드 영역 */}
            <div className="backdrop-blur-md bg-white/[0.02] border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer block">
                <div className="text-4xl mb-3">{isUploading ? '⏳' : '📤'}</div>
                <p className="text-white font-medium mb-1">
                  {isUploading ? '업로드 중...' : '영상 파일 업로드'}
                </p>
                <p className="text-gray-500 text-sm">
                  MP4, WebM, MOV 형식 (최대 50MB)
                </p>
              </label>
            </div>

            {/* 영상 목록 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <span>📁</span>
                <span>저장된 영상 ({videos.length}개)</span>
              </h3>

              {isLoadingVideos ? (
                <div className="text-center py-8">
                  <span className="text-4xl animate-spin inline-block">☯️</span>
                  <p className="text-gray-400 mt-2">로딩 중...</p>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>업로드된 영상이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {videos.map((video) => (
                    <div
                      key={video.filename}
                      className={`
                        p-4 rounded-xl transition-all duration-300
                        backdrop-blur-md border-2 cursor-pointer
                        ${selectedVideo === video.filename
                          ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/50'
                          : 'bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20'
                        }
                      `}
                      onClick={() => setSelectedVideo(video.filename)}
                    >
                      <div className="flex items-center gap-4">
                        {/* 미리보기 썸네일 */}
                        <div className="relative w-24 h-16 bg-black/50 rounded-lg overflow-hidden flex-shrink-0">
                          <video
                            src={`${API_BASE}${video.path}`}
                            className="w-full h-full object-cover"
                            muted
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xl">▶</span>
                          </div>
                        </div>

                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{video.filename}</p>
                          <p className="text-gray-500 text-sm">{video.size_mb} MB</p>
                        </div>

                        {/* 액션 버튼들 */}
                        <div className="flex items-center gap-2">
                          {/* 미리보기 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewVideo(`${API_BASE}${video.path}`);
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
                            title="미리보기"
                          >
                            👁️
                          </button>

                          {/* 삭제 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVideo(video.filename);
                            }}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                            title="삭제"
                          >
                            🗑️
                          </button>

                          {/* 선택 표시 */}
                          <div className={`
                            w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${selectedVideo === video.filename
                              ? 'border-amber-400 bg-amber-400'
                              : 'border-gray-500'
                            }
                          `}>
                            {selectedVideo === video.filename && (
                              <div className="w-2 h-2 rounded-full bg-black" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 현재 선택된 영상 */}
            {selectedVideo && (
              <div className="backdrop-blur-md bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-3">현재 선택된 영상</h3>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 bg-black/50 rounded-lg overflow-hidden">
                    <video
                      src={`${API_BASE}/api/settings/media/file/${selectedVideo}`}
                      className="w-full h-full object-cover"
                      muted
                      autoPlay
                      loop
                    />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-400 truncate max-w-[200px]">
                      {selectedVideo}
                    </p>
                    <p className="text-sm text-gray-400">
                      홈 화면에 적용됨
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 저장 버튼 */}
            <button
              onClick={handleSaveVideo}
              disabled={isSaving || !selectedVideo}
              className={`
                w-full py-4 rounded-xl font-medium text-lg
                transition-all duration-300
                ${isSaving || !selectedVideo
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 backdrop-blur-sm text-amber-300 shadow-lg shadow-amber-500/10 hover:scale-[1.02] border border-amber-500/30'
                }
              `}
            >
              {isSaving ? '저장 중...' : '🎬 영상 적용하기'}
            </button>

            {saveMessage && (
              <p className="text-green-400 text-sm text-center animate-pulse">{saveMessage}</p>
            )}
          </section>
        )}

        {/* 미리보기 모달 */}
        {previewVideo && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPreviewVideo(null)}
          >
            <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setPreviewVideo(null)}
                className="absolute -top-12 right-0 text-white text-2xl hover:text-amber-400 transition"
              >
                ✕ 닫기
              </button>
              <video
                src={previewVideo}
                className="w-full rounded-2xl"
                controls
                autoPlay
                loop
              />
            </div>
          </div>
        )}

        {/* 레이아웃 스타일 탭 */}
        {activeTab === 'layout' && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎨</span>
              <h2 className="text-xl font-bold text-white">레이아웃 스타일</h2>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              홈 화면의 히어로 섹션 스타일을 선택하세요. 저장 후 홈 화면에서 확인할 수 있습니다.
            </p>

            {/* 스타일 카드들 */}
            <div className="space-y-4">
              {LAYOUT_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedLayout(style.id)}
                  className={`
                    w-full text-left p-5 rounded-2xl transition-all duration-300
                    backdrop-blur-md border-2
                    ${selectedLayout === style.id
                      ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/50 scale-[1.02] shadow-lg shadow-amber-500/10'
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* 미리보기 아이콘 */}
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                        style.id === 'classic-mystical' ? 'bg-gradient-to-br from-amber-600/30 to-amber-700/20' :
                        style.id === 'modern-minimal' ? 'bg-gradient-to-br from-slate-600/30 to-slate-700/20' :
                        'bg-gradient-to-br from-amber-600/30 to-orange-700/20'
                      }`}>
                        <span className={style.logo.iconSize}>☯️</span>
                      </div>
                      {selectedLayout === style.id && (
                        <span className="absolute -top-1 -right-1 text-lg bg-amber-500/80 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">✓</span>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{style.name}</h3>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{style.description}</p>

                      {/* 스타일 상세 */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
                          <span className="text-amber-400">•</span>
                          괘 크기: {style.hexagram.symbolSize.replace('text-[', '').replace(']', '')}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <span className="text-amber-400">•</span>
                          제목: {style.logo.titleSize.replace('text-', '')}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <span className="text-amber-400">•</span>
                          효점: {style.yaoDot.size.replace('text-[', '').replace(']', '')}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <span className="text-amber-400">•</span>
                          간격: {style.hexagram.gap}
                        </div>
                      </div>
                    </div>

                    {/* 라디오 표시 */}
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${selectedLayout === style.id
                        ? 'border-amber-400 bg-amber-400'
                        : 'border-gray-500'
                      }
                    `}>
                      {selectedLayout === style.id && (
                        <div className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>
                  </div>

                  {/* 부제 미리보기 */}
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-1">부제 문구:</p>
                    <p className="text-sm text-amber-400 italic">&ldquo;{style.logo.subtitle}&rdquo;</p>
                  </div>
                </button>
              ))}
            </div>

            {/* 현재 선택된 스타일 요약 */}
            <div className="backdrop-blur-md bg-white/[0.02] border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-400 mb-2">현재 선택된 스타일</h3>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedLayout === 'classic-mystical' ? 'bg-gradient-to-br from-amber-600/30 to-amber-700/20' :
                  selectedLayout === 'modern-minimal' ? 'bg-gradient-to-br from-slate-600/30 to-slate-700/20' :
                  'bg-gradient-to-br from-amber-600/30 to-orange-700/20'
                }`}>
                  <span className="text-2xl">☯️</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400">
                    {getSelectedLayoutStyle().name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {getSelectedLayoutStyle().description}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 점술 방식 탭 */}
        {activeTab === 'divination' && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎲</span>
              <h2 className="text-xl font-bold text-white">점술 방식 선택</h2>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              사용자가 점을 볼 때 사용할 기본 점술 방식을 선택하세요.
            </p>

            {/* 방식 카드들 */}
            <div className="space-y-4">
              {DIVINATION_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`
                    w-full text-left p-5 rounded-2xl transition-all duration-300
                    backdrop-blur-md border-2
                    ${selectedMethod === method.id
                      ? `bg-gradient-to-br ${method.color} ${method.borderColor} scale-[1.02] shadow-lg`
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* 이모지 & 체크 */}
                    <div className="relative">
                      <span className="text-4xl">{method.emoji}</span>
                      {selectedMethod === method.id && (
                        <span className="absolute -top-1 -right-1 text-lg">✓</span>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{method.name}</h3>
                        <span className="text-xs text-gray-400">({method.nameEn})</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{method.description}</p>

                      {/* 상세 정보 */}
                      <ul className="space-y-1">
                        {method.details.map((detail, idx) => (
                          <li key={idx} className="text-xs text-gray-400 flex items-center gap-2">
                            <span className="text-amber-400">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 라디오 표시 */}
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${selectedMethod === method.id
                        ? 'border-amber-400 bg-amber-400'
                        : 'border-gray-500'
                      }
                    `}>
                      {selectedMethod === method.id && (
                        <div className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 현재 선택된 방식 요약 */}
            <div className="backdrop-blur-md bg-white/[0.02] border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-400 mb-2">현재 선택된 방식</h3>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {DIVINATION_METHODS.find(m => m.id === selectedMethod)?.emoji}
                </span>
                <div>
                  <p className="text-lg font-bold text-amber-400">
                    {DIVINATION_METHODS.find(m => m.id === selectedMethod)?.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {DIVINATION_METHODS.find(m => m.id === selectedMethod)?.description}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 저장 버튼 */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              w-full py-4 rounded-xl font-medium text-lg
              transition-all duration-300
              ${isSaving
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 backdrop-blur-sm text-amber-300 shadow-lg shadow-amber-500/10 hover:scale-[1.02] border border-amber-500/30'
              }
            `}
          >
            {isSaving ? '저장 중...' : '💾 설정 저장 및 적용'}
          </button>

          {saveMessage && (
            <p className="text-green-400 text-sm animate-pulse">{saveMessage}</p>
          )}
        </div>

        {/* 추가 설정 영역 */}
        <section className="backdrop-blur-md bg-white/[0.02] border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>추가 설정</span>
          </h3>

          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span>변효 해석 표시</span>
              <span className="text-amber-400">활성화</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span>심리 분석</span>
              <span className="text-amber-400">활성화</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>애니메이션 배경</span>
              <span className="text-amber-400">활성화</span>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="text-center text-xs text-gray-500 py-4">
          <p>주역점 관리자 설정 v1.1</p>
        </footer>
      </main>
    </div>
  );
}
