'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { CATEGORIES, STATS, MOCK_POSTS } from './constants';
import { CategoryCard } from './components/CategoryCard';
import { CosmosLayout } from './components/CosmosLayout';
import { StarField } from './components/StarField';
import { MouseGlow } from './components/MouseGlow';

function LandingContent() {
    return (
        <div className="pb-20">
            {/* Hero Section */}
            <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
                {/* Abstract Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse delay-2000"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium tracking-wider uppercase">
                            Welcome to the Future
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400">
                                Explore the Universe
                            </span>
                            <br />
                            <span className="text-4xl md:text-6xl text-white/50">One Pulse at a Time</span>
                        </h1>
                        <p className="text-lg text-purple-300/70 mb-6 font-medium">
                            무한한 우주로, 당신의 호기심이 닿는 곳까지
                        </p>
                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-300 mb-10 leading-relaxed">
                            Your gateway to space science, sci-fi entertainment, and future technology.
                            Powered by artificial intelligence, curated for the cosmos.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/cosmos/space-science" className="group bg-white text-black px-6 py-3 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2">
                                Start Reading
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="px-6 py-3 rounded-full font-semibold text-sm text-white border border-white/20 hover:bg-white/10 transition-colors backdrop-blur-sm">
                                Join Newsletter
                            </button>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
                    >
                        {STATS.map((stat, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-purple-400 text-sm font-medium uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Featured Categories */}
            <section className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">Explore Categories</h2>
                            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {CATEGORIES.map((cat, index) => (
                            <CategoryCard key={cat.id} category={cat} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Latest Posts */}
            <section className="py-20 relative bg-gradient-to-b from-transparent to-purple-900/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl font-bold text-white">Latest Transmissions</h2>
                        <Link href="/cosmos/all" className="text-purple-400 hover:text-white transition-colors flex items-center gap-1">
                            View All <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {MOCK_POSTS.slice(0, 4).map((post, i) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="group relative overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[2/1] border border-white/10"
                            >
                                <img
                                    src={post.thumbnailUrl}
                                    alt={post.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>

                                <div className="absolute bottom-0 left-0 p-8 w-full">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2 py-1 bg-purple-600/80 backdrop-blur-md rounded text-xs font-bold uppercase tracking-wider text-white">
                                            {CATEGORIES.find(c => c.slug === post.categorySlug)?.name}
                                        </span>
                                        <span className="text-xs text-gray-300 flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-current text-yellow-500" /> {post.viewCount.toLocaleString()}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-purple-300 transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-300 line-clamp-2 text-sm">{post.excerpt}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative rounded-3xl overflow-hidden p-12 text-center border border-white/10 bg-white/5 backdrop-blur-lg">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/30 rounded-full blur-[60px]"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/30 rounded-full blur-[60px]"></div>

                        <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Join the Cosmic Voyage</h2>
                        <p className="text-gray-400 mb-8 max-w-lg mx-auto relative z-10">
                            Get the latest space science news, SF reviews, and future tech insights delivered directly to your inbox.
                        </p>

                        <form className="relative z-10 max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-grow bg-black/50 border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            />
                            <button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-shadow">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function CosmosPage() {
    return (
        <div className="relative">
            {/* StarField Background */}
            <StarField />

            {/* Mouse Glow Effect */}
            <MouseGlow />

            {/* Layout with Content */}
            <CosmosLayout>
                <LandingContent />
            </CosmosLayout>
        </div>
    );
}
