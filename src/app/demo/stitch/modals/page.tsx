'use client';
import { useState } from 'react';
import {
  ConfirmModal,
  ShareModal,
  InfoModal,
  FormModal,
  ImageLightbox,
} from '@/components/stitch-v2';

export default function ModalsDemo() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const sampleImages = [
    { src: 'https://picsum.photos/800/600?random=1', alt: '샘플 이미지 1' },
    { src: 'https://picsum.photos/800/600?random=2', alt: '샘플 이미지 2' },
    { src: 'https://picsum.photos/800/600?random=3', alt: '샘플 이미지 3' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">모달 시스템 데모</h1>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setConfirmOpen(true)}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
          >
            확인 모달 (Danger)
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            공유 모달
          </button>
          <button
            onClick={() => setInfoOpen(true)}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
          >
            정보 모달
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600"
          >
            폼 모달
          </button>
          <button
            onClick={() => setLightboxOpen(true)}
            className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 col-span-2"
          >
            이미지 라이트박스
          </button>
        </div>

        <ConfirmModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => { alert('확인됨!'); setConfirmOpen(false); }}
          title="삭제 확인"
          message="정말로 이 항목을 삭제하시겠습니까?"
          variant="danger"
        />

        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          url="https://koreanewskorea.com/news/123"
          title="뉴스 기사 제목"
        />

        <InfoModal
          isOpen={infoOpen}
          onClose={() => setInfoOpen(false)}
          title="이용약관"
        >
          <p>여기에 약관 내용이 들어갑니다.</p>
          <p className="mt-4">Lorem ipsum dolor sit amet...</p>
        </InfoModal>

        <FormModal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={(e) => { e.preventDefault(); alert('제출됨!'); setFormOpen(false); }}
          title="문의하기"
        >
          <div className="space-y-4">
            <input type="text" placeholder="이름" className="w-full px-4 py-2 border rounded-lg" />
            <input type="email" placeholder="이메일" className="w-full px-4 py-2 border rounded-lg" />
            <textarea placeholder="문의 내용" rows={4} className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </FormModal>

        <ImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={sampleImages}
          initialIndex={0}
        />
      </div>
    </div>
  );
}
