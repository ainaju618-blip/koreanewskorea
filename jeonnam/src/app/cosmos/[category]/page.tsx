'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Search, Heart, MessageCircle, Share2, User, Folder, Telescope, Sparkles, Atom, Cpu, TrendingUp, Bot, type LucideIcon } from 'lucide-react';
import { CATEGORIES, MOCK_POSTS } from '../constants';
import { CosmosLayout } from '../components/CosmosLayout';
import { MouseGlow } from '../components/MouseGlow';

// Dynamic import for Three.js components (reduces initial bundle by ~1.4MB)
const StarField = dynamic(
    () => import('../components/StarField').then(mod => ({ default: mod.StarField })),
    { ssr: false, loading: () => <div className="fixed inset-0 z-0 bg-black" /> }
);

const iconMap: Record<string, LucideIcon> = {
    Telescope,
    Sparkles,
    Atom,
    Cpu,
    TrendingUp,
    Bot,
};

export default function CategoryPage() {
    const params = useParams();
    const slug = params.category as string;

    // Resolve category info
    const category = CATEGORIES.find(c => c.slug === slug);
    const posts = slug === 'all'
        ? MOCK_POSTS
        : MOCK_POSTS.filter(p => p.categorySlug === slug);

    const IconComponent = category
        ? iconMap[category.iconName] || Folder
        : Folder;

    if (!category && slug !== 'all') {
        return (
            <div className="relative">
                <StarField />
                <MouseGlow />
                <CosmosLayout>
                    <div className="text-white text-center py-20">Category not found</div>
                </CosmosLayout>
            </div>
        );
    }

    return (
        <div className="relative">
            <StarField />
            <MouseGlow />
            <CosmosLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* Left Sidebar (Profile/Nav) */}
                        <aside className="lg:col-span-1 space-y-6">
                            {/* Profile Widget */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] mb-4">
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                            <User className="h-10 w-10 text-gray-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-white font-bold text-lg">Cosmic Editor</h3>
                                    <p className="text-purple-400 text-xs uppercase tracking-wide mb-4">AI Curator</p>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Curating the finest content from across the universe.
                                    </p>
                                    <div className="flex gap-4 text-center w-full border-t border-white/10 pt-4">
                                        <div className="flex-1">
                                            <div className="text-white font-bold">{MOCK_POSTS.length}</div>
                                            <div className="text-xs text-gray-500">Posts</div>
                                        </div>
                                        <div className="flex-1 border-l border-white/10">
                                            <div className="text-white font-bold">12.5k</div>
                                            <div className="text-xs text-gray-500">Views</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Category Nav Widget */}
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                                <div className="p-4 bg-white/5 border-b border-white/10">
                                    <h4 className="text-white font-bold text-sm">Navigation</h4>
                                </div>
                                <div className="p-2">
                                    {CATEGORIES.map(cat => {
                                        const isActive = cat.slug === slug;
                                        return (
                                            <Link
                                                key={cat.id}
                                                href={`/cosmos/${cat.slug}`}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${isActive ? 'bg-purple-600/20 text-purple-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                {/* Using a dot for simple list icon */}
                                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-500' : 'bg-gray-600'}`}></span>
                                                {cat.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Search Widget */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search in category..."
                                    className="w-full bg-black/50 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            </div>
                        </aside>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            {/* Header */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-lg text-white">
                                        {IconComponent && <IconComponent className="h-8 w-8" />}
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-white">
                                            {category ? category.name : 'All Transmissions'}
                                        </h1>
                                        <p className="text-gray-400 mt-1">
                                            {category ? category.description : 'Welcome to the archive.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Posts Grid/List */}
                            <div className="space-y-6">
                                {posts.map((post, idx) => (
                                    <motion.article
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/30 transition-colors group"
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {/* Thumbnail */}
                                            <div className="w-full md:w-64 h-48 md:h-auto relative overflow-hidden">
                                                <Image
                                                    src={post.thumbnailUrl}
                                                    alt={post.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 256px"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                                        <span className="text-purple-400 font-medium">{post.author}</span>
                                                        <span>-</span>
                                                        <span>{post.createdAt}</span>
                                                    </div>
                                                    <Link href={`/blog/${post.slug}`}>
                                                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                                            {post.title}
                                                        </h2>
                                                    </Link>
                                                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                                                        {post.excerpt}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                                                    <div className="flex gap-4">
                                                        <button className="flex items-center gap-1 text-gray-500 hover:text-pink-500 transition-colors text-xs">
                                                            <Heart className="h-4 w-4" /> 24
                                                        </button>
                                                        <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors text-xs">
                                                            <MessageCircle className="h-4 w-4" /> 5
                                                        </button>
                                                    </div>
                                                    <button className="text-gray-500 hover:text-white transition-colors">
                                                        <Share2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}

                                {posts.length === 0 && (
                                    <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10">
                                        <p className="text-gray-500">No signals detected in this sector yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CosmosLayout>
        </div>
    );
}
