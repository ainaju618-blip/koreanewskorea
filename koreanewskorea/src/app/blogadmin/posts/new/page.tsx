"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    Eye,
    Globe,
    FileText,
    Image as ImageIcon,
    Tag,
    Sparkles
} from 'lucide-react';
import { BlogPostStatus } from '@/types/blog';

const CATEGORIES = [
    { value: 'sf-entertainment', label: 'SF Entertainment' },
    { value: 'space-science', label: 'Space Science' },
    { value: 'astronomy', label: 'Astronomy' },
    { value: 'future-tech', label: 'Future Tech' },
    { value: 'space-industry', label: 'Space Industry' }
];

export default function NewBlogPostPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category: 'sf-entertainment',
        tags: '',
        thumbnail_url: '',
        seo_title: '',
        seo_description: '',
        status: 'draft' as BlogPostStatus
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (status: BlogPostStatus) => {
        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Title and content are required');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/blog/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                })
            });

            if (res.ok) {
                const post = await res.json();
                router.push(`/blogadmin/posts/${post.id}`);
            } else {
                alert('Failed to create post');
            }
        } catch (error) {
            console.error('Failed to create post:', error);
            alert('Failed to create post');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/blogadmin/posts"
                        className="p-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <FileText className="w-7 h-7 text-purple-400" />
                            New Post
                        </h1>
                        <p className="text-gray-500 mt-1">Create a new blog post</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSubmit('draft')}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 border border-purple-500/30 text-purple-400 rounded-lg font-medium hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSubmit('published')}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50"
                    >
                        <Globe className="w-4 h-4" />
                        Publish
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter post title..."
                            className="w-full px-4 py-3 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-lg"
                        />
                    </div>

                    {/* Content */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                            Content
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Write your post content here..."
                            rows={20}
                            className="w-full px-4 py-3 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 font-mono text-sm resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Supports Markdown formatting
                        </p>
                    </div>

                    {/* Excerpt */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                            Excerpt
                        </label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            placeholder="Short description for previews..."
                            rows={3}
                            className="w-full px-4 py-3 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Category */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Category
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                            Tags
                        </label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="space, nasa, mars..."
                            className="w-full px-4 py-2 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Separate with commas
                        </p>
                    </div>

                    {/* Thumbnail */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Thumbnail URL
                        </label>
                        <input
                            type="text"
                            name="thumbnail_url"
                            value={formData.thumbnail_url}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full px-4 py-2 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                        />
                        {formData.thumbnail_url && (
                            <div className="mt-3 aspect-video bg-[#0a0a0f] rounded-lg overflow-hidden">
                                <img
                                    src={formData.thumbnail_url}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* SEO */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <label className="block text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            SEO Settings
                        </label>
                        <div className="space-y-3">
                            <input
                                type="text"
                                name="seo_title"
                                value={formData.seo_title}
                                onChange={handleChange}
                                placeholder="SEO Title (optional)"
                                className="w-full px-4 py-2 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                            />
                            <textarea
                                name="seo_description"
                                value={formData.seo_description}
                                onChange={handleChange}
                                placeholder="SEO Description (optional)"
                                rows={3}
                                className="w-full px-4 py-2 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* AI Generate Button */}
                    <Link
                        href="/blogadmin/ai-generator"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 rounded-xl font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                    >
                        <Sparkles className="w-5 h-5" />
                        Generate with AI instead
                    </Link>
                </div>
            </div>
        </div>
    );
}
