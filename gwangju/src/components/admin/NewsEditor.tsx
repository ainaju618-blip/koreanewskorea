'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Image as ImageIcon, Heading1, Heading2, Quote, Upload, Loader2, X, Link2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';

interface NewsEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export default function NewsEditor({ content, onChange }: NewsEditorProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showError, showSuccess } = useToast();

    const editor = useEditor({
        immediatelyRender: false, // SSR hydration mismatch 방지
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: '기사 본문을 작성하세요...',
            }),
            Image,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-lg prose-invert max-w-none focus:outline-none min-h-[400px] p-6 text-[#e6edf3] leading-relaxed',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // 파일 업로드 처리
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        // 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            showError('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 검증 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('파일 크기가 5MB를 초과합니다.');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '업로드 실패');
            }

            const data = await res.json();

            // 에디터에 이미지 삽입 후 줄바꿈 추가
            editor.chain().focus().setImage({ src: data.url }).createParagraphNear().run();

        } catch (error) {
            console.error('Upload error:', error);
            showError(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
            // input 초기화 (같은 파일 다시 선택 가능하도록)
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // URL로 이미지 추가
    const handleImageUrl = () => {
        setShowUrlInput(true);
    };

    const submitImageUrl = () => {
        if (imageUrl && editor) {
            editor.chain().focus().setImage({ src: imageUrl }).createParagraphNear().run();
            setImageUrl('');
            setShowUrlInput(false);
            showSuccess('이미지가 추가되었습니다.');
        }
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#161b22] shadow-sm ring-1 ring-[#21262d] focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Toolbar */}
            <div className="bg-[#0d1117] border-b border-[#21262d] p-2 flex flex-wrap gap-1 sticky top-0 z-10">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={Bold}
                    title="굵게"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={Italic}
                    title="기울임"
                />
                <div className="w-px h-6 bg-[#30363d] mx-1 self-center" />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    icon={Heading1}
                    title="제목 1 (H3)"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                    isActive={editor.isActive('heading', { level: 4 })}
                    icon={Heading2}
                    title="제목 2 (H4)"
                />
                <div className="w-px h-6 bg-[#30363d] mx-1 self-center" />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon={List}
                    title="목록"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon={ListOrdered}
                    title="번호 목록"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon={Quote}
                    title="인용구"
                />
                <div className="w-px h-6 bg-[#30363d] mx-1 self-center" />

                {/* 이미지 업로드 버튼 */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`p-2 rounded hover:bg-[#21262d] text-[#8b949e] transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="이미지 업로드"
                    type="button"
                >
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                </button>

                {/* URL로 이미지 추가 */}
                <MenuButton
                    onClick={handleImageUrl}
                    isActive={showUrlInput}
                    icon={ImageIcon}
                    title="이미지 URL"
                />

                {/* 인라인 URL 입력 (window.prompt 대체) */}
                {showUrlInput && (
                    <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-blue-900/30 rounded-lg border border-blue-800/50">
                        <Link2 className="w-4 h-4 text-blue-400" />
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-48 px-2 py-1 text-sm border-none bg-transparent text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && submitImageUrl()}
                            autoFocus
                        />
                        <button
                            onClick={submitImageUrl}
                            className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                            type="button"
                        >
                            추가
                        </button>
                        <button
                            onClick={() => { setShowUrlInput(false); setImageUrl(''); }}
                            className="p-1 text-[#6e7681] hover:text-[#c9d1d9]"
                            type="button"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Editor Area */}
            <EditorContent editor={editor} />
        </div>
    );
}

function MenuButton({ onClick, isActive, icon: Icon, title }: any) {
    return (
        <button
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`p-2 rounded hover:bg-[#21262d] text-[#8b949e] transition-colors ${isActive ? 'bg-[#21262d] text-[#e6edf3] font-bold shadow-inner' : ''
                }`}
            title={title}
            type="button"
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}
