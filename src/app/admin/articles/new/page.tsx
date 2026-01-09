'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Save, Send, Upload, X, Loader2,
  ImageIcon, AlertCircle, CheckCircle, Eye
} from 'lucide-react';

interface Reporter {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_image: string | null;
}

const categories = [
  { value: 'government', label: '나주시소식', color: 'emerald' },
  { value: 'council', label: '의회소식', color: 'blue' },
  { value: 'education', label: '교육소식', color: 'indigo' },
  { value: 'fire', label: '소방서소식', color: 'red' },
  { value: 'business', label: '기업소식', color: 'amber' },
  { value: 'opinion', label: '오피니언', color: 'purple' },
];

export default function NewArticlePage() {
  const router = useRouter();
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoSaved, setAutoSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 폼 데이터
  const [form, setForm] = useState({
    category: '',
    title: '',
    subtitle: '',
    content: '',
    thumbnail_url: '',
    reporter_id: '',
  });

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 기자 목록 로드
  useEffect(() => {
    const fetchReporters = async () => {
      try {
        const res = await fetch('/api/admin/reporters');
        const data = await res.json();
        if (res.ok) {
          setReporters(data.reporters);
        }
      } catch (error) {
        console.error('Failed to fetch reporters:', error);
      }
    };
    fetchReporters();
  }, []);

  // 자동저장 (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem('draft_article');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm(parsed);
      } catch {}
    }
  }, []);

  // 자동저장 - 3초 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.title || form.content) {
        localStorage.setItem('draft_article', JSON.stringify(form));
        setAutoSaved(new Date());
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [form]);

  // 입력 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setForm((prev) => ({ ...prev, thumbnail_url: data.url }));
      } else {
        alert(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, thumbnail_url: '' }));
  };

  // 유효성 검사
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.category) newErrors.category = '카테고리를 선택해주세요.';
    if (!form.title.trim()) newErrors.title = '제목을 입력해주세요.';
    if (!form.content.trim()) newErrors.content = '본문을 입력해주세요.';
    if (!form.reporter_id) newErrors.reporter_id = '기자를 선택해주세요.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 (임시저장 or 게시)
  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem('draft_article');
        alert(data.message);
        router.push('/admin/articles');
      } else {
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/articles"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">새 기사 작성</h1>
            {autoSaved && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                자동저장: {autoSaved.toLocaleTimeString('ko-KR')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            미리보기
          </button>
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            임시저장
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            게시하기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 폼 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 카테고리 & 기자 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">카테고리 선택</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기자 <span className="text-red-500">*</span>
              </label>
              <select
                name="reporter_id"
                value={form.reporter_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reporter_id ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">기자 선택</option>
                {reporters.map((reporter) => (
                  <option key={reporter.id} value={reporter.id}>
                    {reporter.name} ({reporter.email})
                  </option>
                ))}
              </select>
              {errors.reporter_id && (
                <p className="text-red-500 text-sm mt-1">{errors.reporter_id}</p>
              )}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-2">
                ({form.title.length}/100)
              </span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              placeholder="기사 제목을 입력하세요"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* 부제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              부제목 (선택)
              <span className="text-gray-400 font-normal ml-2">
                ({form.subtitle.length}/200)
              </span>
            </label>
            <input
              type="text"
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              maxLength={200}
              placeholder="기사 요약을 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 본문 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              본문 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-2">
                ({form.content.length}자)
              </span>
            </label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={15}
              placeholder="기사 본문을 입력하세요. 빈 줄은 문단 구분으로 처리됩니다."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.content ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              💡 빈 줄(Enter 두 번)은 문단 구분으로 처리됩니다.
            </p>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 대표 이미지 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              대표 이미지
            </label>
            {form.thumbnail_url ? (
              <div className="relative">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={form.thumbnail_url}
                    alt="썸네일"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block">
                <div className="aspect-video border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">클릭하여 이미지 선택</p>
                      <p className="text-xs text-gray-400 mt-1">가로 800px로 리사이즈</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* 작성 가이드 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="font-medium text-blue-900 mb-2">📝 작성 가이드</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 제목은 핵심 키워드를 앞에 배치</li>
              <li>• 첫 문단에 육하원칙 포함</li>
              <li>• 인용문은 큰따옴표("") 사용</li>
              <li>• 이미지는 16:9 비율 권장</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 미리보기 모달 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <h2 className="font-bold text-lg">미리보기</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {form.thumbnail_url && (
                <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                  <Image
                    src={form.thumbnail_url}
                    alt="썸네일"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full mb-3">
                {categories.find((c) => c.value === form.category)?.label || '카테고리'}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {form.title || '제목을 입력하세요'}
              </h1>
              {form.subtitle && (
                <p className="text-gray-600 mb-4">{form.subtitle}</p>
              )}
              <div className="prose prose-sm max-w-none">
                {form.content.split(/\n\n+/).map((p, i) => (
                  <p key={i} className="mb-4">
                    {p.split('\n').map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < p.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
