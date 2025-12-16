'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Telescope,
    Sparkles,
    Atom,
    Cpu,
    TrendingUp,
    Bot,
    Search,
    Calendar,
    Eye,
    Clock,
    ChevronRight,
    Home,
    Rocket,
    Star,
    ArrowLeft,
    Heart,
    MessageCircle,
    Share2,
    Bookmark,
    type LucideIcon
} from 'lucide-react';

// Category configuration
const categoryConfig: Record<string, { name: string; icon: LucideIcon; color: string; description: string }> = {
    'space-science': { name: 'Space Science', icon: Telescope, color: 'from-blue-500 to-cyan-500', description: 'NASA, ESA news and discoveries' },
    'sf-entertainment': { name: 'SF Entertainment', icon: Sparkles, color: 'from-purple-500 to-pink-500', description: 'Movies, books, games and SF content' },
    'astronomy': { name: 'Astronomy', icon: Atom, color: 'from-violet-500 to-purple-500', description: 'Stars, galaxies, and cosmic mysteries' },
    'future-tech': { name: 'Future Tech', icon: Cpu, color: 'from-emerald-500 to-teal-500', description: 'Cutting-edge technology for space' },
    'space-economy': { name: 'Space Economy', icon: TrendingUp, color: 'from-amber-500 to-orange-500', description: 'Space industry and investment' },
    'ai-content': { name: 'AI Content', icon: Bot, color: 'from-pink-500 to-rose-500', description: 'AI-generated space content' },
};

// Post type
interface Post {
    id: string;
    title: string;
    excerpt: string;
    slug: string;
    thumbnail_url: string | null;
    created_at: string;
    view_count: number;
    category: string;
    author_name?: string;
}

// Sidebar Profile Component
function ProfileSection() {
    return (
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-purple-500/20 p-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse" />
                <div className="absolute inset-1 bg-gray-900 rounded-full flex items-center justify-center">
                    <Rocket className="w-10 h-10 text-purple-400" />
                </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">CosmicPulse</h3>
            <p className="text-gray-400 text-sm mb-4">Exploring the Universe</p>
            <div className="flex justify-center gap-6 text-sm">
                <div>
                    <div className="text-white font-bold">128</div>
                    <div className="text-gray-500">Posts</div>
                </div>
                <div>
                    <div className="text-white font-bold">2.4K</div>
                    <div className="text-gray-500">Followers</div>
                </div>
                <div>
                    <div className="text-white font-bold">18K</div>
                    <div className="text-gray-500">Views</div>
                </div>
            </div>
        </div>
    );
}

// Category Navigation Component
function CategoryNav({ currentSlug }: { currentSlug: string }) {
    return (
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-purple-500/20 p-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Categories</h4>
            <nav className="space-y-1">
                {Object.entries(categoryConfig).map(([slug, config]) => {
                    const Icon = config.icon;
                    const isActive = slug === currentSlug;
                    return (
                        <Link
                            key={slug}
                            href={'/cosmos/' + slug}
                            className={'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ' +
                                (isActive
                                    ? 'bg-gradient-to-r ' + config.color + ' text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5')}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{config.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

// Popular Posts Widget
function PopularPosts({ posts }: { posts: Post[] }) {
    return (
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-purple-500/20 p-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Popular Posts
            </h4>
            <div className="space-y-3">
                {posts.slice(0, 5).map((post, idx) => (
                    <Link
                        key={post.id}
                        href={'/blog/' + post.slug}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-xs font-bold text-purple-400">
                            {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 group-hover:text-white line-clamp-2 transition-colors">
                                {post.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <Eye className="w-3 h-3" />
                                {post.view_count.toLocaleString()}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// Post Card Component (Naver Blog Style)
function PostCard({ post, index }: { post: Post; index: number }) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-gray-900/60 backdrop-blur-md rounded-2xl border border-purple-500/20 hover:border-purple-500/40 overflow-hidden transition-all"
        >
            <Link href={'/blog/' + post.slug} className="block">
                {/* Thumbnail */}
                {post.thumbnail_url && (
                    <div className="aspect-video overflow-hidden">
                        <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="p-5">
                    {/* Category Tag */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full">
                            {post.category}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors mb-2 line-clamp-2">
                        {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                        {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(post.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {post.view_count.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Actions Bar */}
            <div className="flex items-center justify-around border-t border-purple-500/10 py-3 px-4">
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-pink-400 transition-colors text-sm">
                    <Heart className="w-4 h-4" />
                    <span>Like</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 transition-colors text-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span>Comment</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-green-400 transition-colors text-sm">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-amber-400 transition-colors text-sm">
                    <Bookmark className="w-4 h-4" />
                    <span>Save</span>
                </button>
            </div>
        </motion.article>
    );
}

// Main Page Component
export default function CosmosCategoryPage() {
    const params = useParams();
    const categorySlug = params.category as string;
    const config = categoryConfig[categorySlug];

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // Fetch posts for this category
                const res = await fetch('/api/blog/posts?category=' + categorySlug + '&limit=20');
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.posts || []);
                }
            } catch (error) {
                console.error('Failed to fetch posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [categorySlug]);

    if (!config) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Category not found</h1>
                    <Link href="/cosmos" className="text-purple-400 hover:text-purple-300">
                        Back to Cosmos
                    </Link>
                </div>
            </div>
        );
    }

    const Icon = config.icon;

    return (
        <div className="min-h-screen bg-black">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[200px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-purple-500/20">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/cosmos" className="flex items-center gap-2 group">
                        <Rocket className="w-6 h-6 text-purple-400 group-hover:rotate-12 transition-transform" />
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            CosmicPulse
                        </span>
                    </Link>

                    {/* Search */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex items-center gap-4">
                        <Link href="/" className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            <span className="hidden sm:inline">Home</span>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Breadcrumb */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/cosmos" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />
                        CosmicPulse
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-white">{config.name}</span>
                </div>
            </div>

            {/* Category Hero */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8">
                <div className={'bg-gradient-to-r ' + config.color + ' rounded-2xl p-8 flex items-center gap-6'}>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{config.name}</h1>
                        <p className="text-white/80">{config.description}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
                <div className="flex gap-8">
                    {/* Left Sidebar */}
                    <aside className="hidden lg:block w-72 flex-shrink-0 space-y-6">
                        <ProfileSection />
                        <CategoryNav currentSlug={categorySlug} />
                        <PopularPosts posts={posts} />
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1">
                        {/* Posts Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-400" />
                                Latest Posts
                                <span className="text-sm font-normal text-gray-500">({posts.length})</span>
                            </h2>
                        </div>

                        {/* Posts Grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-gray-900/60 rounded-2xl h-80 animate-pulse" />
                                ))}
                            </div>
                        ) : posts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {posts.map((post, index) => (
                                    <PostCard key={post.id} post={post} index={index} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon className="w-10 h-10 text-gray-600" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
                                <p className="text-gray-500 mb-6">Be the first to explore this category!</p>
                                <Link
                                    href="/cosmos"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to CosmicPulse
                                </Link>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
