"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Globe,
    Clock,
    Sparkles,
    MoreVertical,
    CheckCircle,
    XCircle,
    RefreshCw
} from 'lucide-react';
import { BlogPost, BlogPostStatus } from '@/types/blog';

// Status badge component
function StatusBadge({ status }: { status: BlogPostStatus }) {
    const styles: Record<BlogPostStatus, string> = {
        draft: 'bg-amber-500/20 text-amber-400',
        review: 'bg-blue-500/20 text-blue-400',
        published: 'bg-green-500/20 text-green-400',
        archived: 'bg-gray-500/20 text-gray-400',
        trash: 'bg-red-500/20 text-red-400'
    };

    const labels: Record<BlogPostStatus, string> = {
        draft: 'Draft',
        review: 'Review',
        published: 'Published',
        archived: 'Archived',
        trash: 'Trash'
    };

    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}

// Post row component
function PostRow({
    post,
    onStatusChange,
    onDelete
}: {
    post: BlogPost;
    onStatusChange: (id: string, status: BlogPostStatus) => void;
    onDelete: (id: string) => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <tr className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors">
            <td className="py-4 px-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        {post.ai_generated ? (
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        ) : (
                            <FileText className="w-5 h-5 text-purple-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={`/blogadmin/posts/${post.id}`}
                            className="font-medium text-white hover:text-purple-300 transition-colors line-clamp-1"
                        >
                            {post.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded">
                                {post.category}
                            </span>
                            {post.ai_generated && (
                                <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-300 rounded flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    AI
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="py-4 px-4">
                <StatusBadge status={post.status} />
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Eye className="w-4 h-4" />
                    {post.view_count.toLocaleString()}
                </div>
            </td>
            <td className="py-4 px-4">
                <div className="text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(post.created_at)}
                    </div>
                    {post.published_at && (
                        <div className="flex items-center gap-1 text-green-400/70 mt-0.5">
                            <Globe className="w-3.5 h-3.5" />
                            {formatDate(post.published_at)}
                        </div>
                    )}
                </div>
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    <Link
                        href={`/blogadmin/posts/${post.id}`}
                        className="p-2 rounded-lg hover:bg-purple-500/20 text-gray-400 hover:text-purple-300 transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-2 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-300 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-lg hover:bg-gray-500/20 text-gray-400 hover:text-white transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a24] border border-purple-500/20 rounded-lg shadow-xl z-20 py-1">
                                    {post.status !== 'published' && (
                                        <button
                                            onClick={() => {
                                                onStatusChange(post.id, 'published');
                                                setShowMenu(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:bg-green-500/10"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Publish
                                        </button>
                                    )}
                                    {post.status === 'published' && (
                                        <button
                                            onClick={() => {
                                                onStatusChange(post.id, 'draft');
                                                setShowMenu(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Unpublish
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            onDelete(post.id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}

export default function BlogPostsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const status = searchParams.get('status') || '';

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                sort: 'created_at:desc'
            });

            if (status) params.set('status', status);
            if (search) params.set('search', search);

            const res = await fetch(`/api/blog/posts?${params}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts || []);
                setTotalCount(data.totalCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    }, [page, status, search]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleStatusChange = async (id: string, newStatus: BlogPostStatus) => {
        try {
            const res = await fetch(`/api/blog/posts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchPosts();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const res = await fetch(`/api/blog/posts/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchPosts();
            }
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    };

    const statusFilters: { label: string; value: string }[] = [
        { label: 'All', value: '' },
        { label: 'Published', value: 'published' },
        { label: 'Drafts', value: 'draft' },
        { label: 'Archived', value: 'archived' },
        { label: 'Trash', value: 'trash' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-7 h-7 text-purple-400" />
                        Posts
                    </h1>
                    <p className="text-gray-500 mt-1">{totalCount} total posts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchPosts}
                        className="p-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link
                        href="/blogadmin/posts/new"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30"
                    >
                        <Plus className="w-4 h-4" />
                        New Post
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-[#12121a] border border-purple-500/20 rounded-lg p-1">
                    {statusFilters.map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                if (filter.value) {
                                    params.set('status', filter.value);
                                } else {
                                    params.delete('status');
                                }
                                router.push(`/blogadmin/posts?${params}`);
                            }}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                ${status === filter.value
                                    ? 'bg-purple-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-purple-500/20'}
                            `}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
                            className="w-full pl-10 pr-4 py-2 bg-[#12121a] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>
                </div>
            </div>

            {/* Posts Table */}
            <div className="bg-[#12121a] border border-purple-500/20 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-purple-500/20 bg-purple-500/5">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">Title</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">Views</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-purple-500/10">
                                    <td colSpan={5} className="py-4 px-4">
                                        <div className="h-10 bg-purple-500/5 rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : posts.length > 0 ? (
                            posts.map(post => (
                                <PostRow
                                    key={post.id}
                                    post={post}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No posts found</p>
                                    <Link
                                        href="/blogadmin/posts/new"
                                        className="text-purple-400 hover:underline text-sm"
                                    >
                                        Create your first post
                                    </Link>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalCount > 20 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-gray-400">
                        Page {page} of {Math.ceil(totalCount / 20)}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= Math.ceil(totalCount / 20)}
                        className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
