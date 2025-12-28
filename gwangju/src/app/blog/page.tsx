import { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { BlogPost } from '@/types/blog';
import {
    Rocket,
    Clock,
    Eye,
    ArrowRight,
    Sparkles,
    Tag,
    Star
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'CosmicPulse - SF & Space Blog',
    description: 'Explore the universe through science fiction and space science. Korean content for space enthusiasts.',
    openGraph: {
        title: 'CosmicPulse - SF & Space Blog',
        description: 'Explore the universe through science fiction and space science.',
        type: 'website'
    }
};

export const revalidate = 60;

async function getPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Failed to fetch posts:', error);
        return [];
    }

    return data || [];
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Animated Stars Background Component
function StarsBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#0d0d20] to-[#0a0a1a]" />

            {/* Nebula effects */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Stars layer 1 - small */}
            <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(1px 1px at 20px 30px, white, transparent),
                                  radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), transparent),
                                  radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.6), transparent),
                                  radial-gradient(1px 1px at 90px 40px, white, transparent),
                                  radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.7), transparent),
                                  radial-gradient(1px 1px at 160px 120px, white, transparent)`,
                backgroundSize: '200px 200px',
                animation: 'twinkle 4s ease-in-out infinite'
            }} />

            {/* Stars layer 2 - medium */}
            <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(2px 2px at 100px 50px, rgba(168,85,247,0.8), transparent),
                                  radial-gradient(2px 2px at 200px 150px, rgba(236,72,153,0.6), transparent),
                                  radial-gradient(2px 2px at 300px 100px, rgba(59,130,246,0.7), transparent),
                                  radial-gradient(1.5px 1.5px at 400px 200px, white, transparent),
                                  radial-gradient(2px 2px at 500px 50px, rgba(168,85,247,0.5), transparent)`,
                backgroundSize: '600px 300px',
                animation: 'twinkle 6s ease-in-out infinite',
                animationDelay: '1s'
            }} />

            {/* Shooting star effect */}
            <div className="absolute top-20 left-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0 animate-shooting-star" />
        </div>
    );
}

// Featured Post Card
function FeaturedPostCard({ post }: { post: BlogPost }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group relative block rounded-2xl overflow-hidden border border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 backdrop-blur-sm"
        >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-gradient-to-br from-purple-900/40 via-[#12121a]/90 to-pink-900/30 backdrop-blur-md">
                {post.thumbnail_url && (
                    <div className="absolute inset-0">
                        <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/80 to-transparent" />
                    </div>
                )}
                <div className="relative p-8 md:p-12">
                    {/* Floating particles */}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full animate-cosmic-float opacity-60" />
                    <div className="absolute top-12 right-12 w-1 h-1 bg-pink-400 rounded-full animate-cosmic-float opacity-40" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-cosmic-float opacity-50" style={{ animationDelay: '1s' }} />

                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-purple-500/30 text-purple-300 text-sm rounded-full border border-purple-500/30 backdrop-blur-sm">
                            {post.category}
                        </span>
                        {post.ai_generated && (
                            <span className="px-3 py-1 bg-pink-500/30 text-pink-300 text-sm rounded-full border border-pink-500/30 backdrop-blur-sm flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-300">
                        {post.title}
                    </h2>
                    <p className="text-gray-400 text-lg mb-6 line-clamp-2">
                        {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(post.published_at || post.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {post.view_count.toLocaleString()}
                            </span>
                        </div>
                        <span className="flex items-center gap-2 text-purple-400 group-hover:text-pink-400 transition-colors">
                            Explore
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// Regular Post Card
function PostCard({ post }: { post: BlogPost }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group block relative rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-sm"
        >
            {/* Hover glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/0 via-purple-600/20 to-pink-600/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />

            <div className="relative bg-[#12121a]/80 backdrop-blur-md h-full">
                {post.thumbnail_url ? (
                    <div className="aspect-video bg-purple-500/10 overflow-hidden">
                        <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                ) : (
                    <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/30 flex items-center justify-center relative overflow-hidden">
                        {/* Mini stars */}
                        <div className="absolute inset-0" style={{
                            backgroundImage: `radial-gradient(1px 1px at 20px 20px, rgba(255,255,255,0.5), transparent),
                                              radial-gradient(1px 1px at 60px 40px, rgba(168,85,247,0.5), transparent),
                                              radial-gradient(1px 1px at 100px 60px, rgba(236,72,153,0.4), transparent)`,
                            backgroundSize: '120px 80px'
                        }} />
                        <Rocket className="w-12 h-12 text-purple-400/50 group-hover:text-purple-300/70 transition-colors relative z-10" />
                    </div>
                )}
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/20">
                            {post.category}
                        </span>
                        {post.ai_generated && (
                            <Sparkles className="w-3 h-3 text-pink-400" />
                        )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                        {post.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(post.published_at || post.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.view_count.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default async function BlogPage() {
    const posts = await getPosts();
    const [featuredPost, ...remainingPosts] = posts;

    return (
        <div className="min-h-screen relative">
            {/* Animated background */}
            <StarsBackground />

            {/* Content */}
            <div className="relative z-10">
                {/* Hero Header */}
                <header className="border-b border-purple-500/20 backdrop-blur-md bg-[#0a0a1a]/50">
                    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                        {/* Logo */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
                                <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
                                    <Rocket className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl font-black mb-4">
                            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-cosmic-gradient">
                                CosmicPulse
                            </span>
                        </h1>

                        {/* Tagline */}
                        <p className="text-xl text-gray-400 mb-2">
                            SF & Space for Korean Readers
                        </p>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Exploring the Universe, One Story at a Time
                        </p>

                        {/* Decorative stars */}
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Star className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" />
                            <Star className="w-3 h-3 text-pink-400 fill-pink-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
                            <Star className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-6xl mx-auto px-4 py-12">
                    {posts.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                                <Rocket className="relative w-20 h-20 text-purple-400/50" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">
                                Launching Soon
                            </h2>
                            <p className="text-gray-500 text-lg">
                                Preparing to explore the cosmos...
                            </p>
                            <p className="text-gray-600 mt-2">
                                First content coming soon
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Featured Post */}
                            {featuredPost && (
                                <section className="mb-16">
                                    <FeaturedPostCard post={featuredPost} />
                                </section>
                            )}

                            {/* Post Grid */}
                            {remainingPosts.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg flex items-center justify-center border border-purple-500/30">
                                            <Tag className="w-4 h-4 text-purple-400" />
                                        </div>
                                        Latest Transmissions
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {remainingPosts.map(post => (
                                            <PostCard key={post.id} post={post} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-purple-500/20 py-12 mt-12 backdrop-blur-md bg-[#0a0a1a]/50">
                    <div className="max-w-6xl mx-auto px-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Rocket className="w-5 h-5 text-purple-400" />
                            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                CosmicPulse
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-2">
                            &copy; {new Date().getFullYear()} CosmicPulse. All rights reserved.
                        </p>
                        <p className="text-gray-600 text-sm">
                            Powered by{' '}
                            <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
                                KoreaNews
                            </Link>
                        </p>
                    </div>
                </footer>
            </div>

        </div>
    );
}
