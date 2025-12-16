'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import {
    Rocket,
    Star,
    Sparkles,
    ChevronDown,
    Telescope,
    Atom,
    Newspaper,
    Cpu,
    TrendingUp,
    Bot,
    ArrowRight,
    Mail,
    Twitter,
    Github,
    ExternalLink,
    Eye,
    Clock
} from 'lucide-react';

// Dynamic import for 3D scene (client-side only)
const CosmicBackground = dynamic(
    () => import('@/components/landing/CosmicScene').then(mod => mod.CosmicBackground),
    { ssr: false }
);

// Typing animation hook
function useTypingEffect(text: string, speed: number = 50) {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let i = 0;
        setDisplayedText('');
        setIsComplete(false);

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.slice(0, i + 1));
                i++;
            } else {
                setIsComplete(true);
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return { displayedText, isComplete };
}

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [end, duration, isInView]);

    return { count, ref };
}

// Hero Section
function HeroSection() {
    const { displayedText, isComplete } = useTypingEffect('Explore the Universe, One Story at a Time', 40);

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
            {/* Logo */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 1.5, bounce: 0.4 }}
                className="mb-8"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
                    <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
                        <Rocket className="w-12 h-12 md:w-16 md:h-16 text-white" />
                    </div>
                </div>
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-6xl md:text-8xl lg:text-9xl font-black text-center mb-6"
            >
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    COSMIC
                </span>
                <br />
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-reverse">
                    PULSE
                </span>
            </motion.h1>

            {/* Tagline with typing effect */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-xl md:text-2xl text-gray-400 text-center mb-4 h-8"
            >
                {displayedText}
                {!isComplete && <span className="animate-blink">|</span>}
            </motion.p>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="text-lg text-purple-400/80 mb-12"
            >
                SF & Space for Korean Readers
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <Link
                    href="/blog"
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-white text-lg overflow-hidden transition-all hover:shadow-lg hover:shadow-purple-500/50"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        Enter the Cosmos
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <a
                    href="#features"
                    className="px-8 py-4 border-2 border-purple-500/50 rounded-2xl font-bold text-purple-400 text-lg hover:bg-purple-500/10 transition-all"
                >
                    Discover More
                </a>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 0.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex flex-col items-center gap-2 text-gray-500"
                >
                    <span className="text-sm">Scroll to explore</span>
                    <ChevronDown className="w-6 h-6" />
                </motion.div>
            </motion.div>

            {/* Decorative elements */}
            <div className="absolute top-20 left-10 animate-float">
                <Star className="w-6 h-6 text-purple-400/50 fill-purple-400/30" />
            </div>
            <div className="absolute top-40 right-20 animate-float-delayed">
                <Sparkles className="w-8 h-8 text-pink-400/50" />
            </div>
            <div className="absolute bottom-40 left-20 animate-float-slow">
                <Star className="w-4 h-4 text-blue-400/50 fill-blue-400/30" />
            </div>
        </section>
    );
}

// Stats Section
function StatsSection() {
    const stats = [
        { label: 'Articles', value: 500, suffix: '+' },
        { label: 'Categories', value: 6, suffix: '' },
        { label: 'Monthly Views', value: 10, suffix: 'K+' },
        { label: 'AI Generated', value: 100, suffix: '%' }
    ];

    return (
        <section className="py-20 px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => {
                    const { count, ref } = useCounter(stat.value);
                    return (
                        <motion.div
                            key={stat.label}
                            ref={ref}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                {count}{stat.suffix}
                            </div>
                            <div className="text-gray-500 font-medium">{stat.label}</div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}

// Features Section
function FeaturesSection() {
    const features = [
        {
            icon: Telescope,
            title: 'Space Science',
            description: 'Latest discoveries from NASA, ESA, and space agencies worldwide.',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Sparkles,
            title: 'SF Entertainment',
            description: 'Movies, books, games, and the best of science fiction culture.',
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: Atom,
            title: 'Astronomy',
            description: 'Stars, galaxies, black holes, and the mysteries of the cosmos.',
            color: 'from-violet-500 to-purple-500'
        },
        {
            icon: Cpu,
            title: 'Future Tech',
            description: 'Cutting-edge technology shaping our journey to the stars.',
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: TrendingUp,
            title: 'Space Economy',
            description: 'Business, investments, and the commercial space industry.',
            color: 'from-amber-500 to-orange-500'
        },
        {
            icon: Bot,
            title: 'AI Powered',
            description: 'Content curated and generated by advanced AI systems.',
            color: 'from-pink-500 to-rose-500'
        }
    ];

    return (
        <section id="features" className="py-20 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Explore Every Corner of the{' '}
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Universe
                        </span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        From distant galaxies to science fiction worlds, we cover it all.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="group relative p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer"
                        >
                            {/* Glow effect */}
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity`} />

                            <div className="relative">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-500 group-hover:text-gray-400 transition-colors">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Latest Posts Section
function LatestPostsSection() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/blog/posts?status=published&limit=3')
            .then(res => res.json())
            .then(data => {
                setPosts(data.posts || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <section className="py-20 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Latest{' '}
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Transmissions
                        </span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Fresh content from across the cosmos.
                    </p>
                </motion.div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 bg-purple-500/10 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    href={`/blog/${post.slug}`}
                                    className="group block relative rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all"
                                >
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />

                                    <div className="relative bg-black/90 backdrop-blur-md">
                                        {post.thumbnail_url ? (
                                            <div className="aspect-video overflow-hidden">
                                                <img
                                                    src={post.thumbnail_url}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/30 flex items-center justify-center">
                                                <Rocket className="w-12 h-12 text-purple-400/50" />
                                            </div>
                                        )}

                                        <div className="p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                                    {post.category}
                                                </span>
                                                {post.ai_generated && (
                                                    <Sparkles className="w-3 h-3 text-pink-400" />
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
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
                                                    {post.view_count?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Rocket className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
                        <p className="text-gray-500">Content launching soon...</p>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-12"
                >
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-2xl text-purple-300 font-bold transition-all"
                    >
                        View All Posts
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

// CTA Section
function CTASection() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement newsletter subscription
        setSubmitted(true);
    };

    return (
        <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative p-8 md:p-12 rounded-3xl overflow-hidden"
                >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-pink-900/30" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                    {/* Glow effects */}
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-500/20 rounded-full blur-[100px]" />

                    <div className="relative text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                            viewport={{ once: true }}
                            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
                        >
                            <Mail className="w-10 h-10 text-white" />
                        </motion.div>

                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            Join the{' '}
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Cosmic Journey
                            </span>
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                            Subscribe to our newsletter and receive the latest space news, SF reviews, and cosmic discoveries directly in your inbox.
                        </p>

                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="flex-1 px-6 py-4 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/70 transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                                >
                                    Subscribe
                                </button>
                            </form>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-green-400">
                                <Sparkles className="w-5 h-5" />
                                <span>Welcome aboard, space traveler!</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// Footer Section
function FooterSection() {
    return (
        <footer className="py-12 px-4 border-t border-purple-500/20">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            CosmicPulse
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-gray-500">
                        <Link href="/blog" className="hover:text-purple-400 transition-colors">
                            Blog
                        </Link>
                        <Link href="/privacy" className="hover:text-purple-400 transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:text-purple-400 transition-colors">
                            Terms
                        </Link>
                    </div>

                    {/* Social */}
                    <div className="flex items-center gap-4">
                        <a href="#" className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 hover:bg-purple-500/30 transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 hover:bg-purple-500/30 transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-purple-500/10 text-center text-gray-600 text-sm">
                    <p>&copy; {new Date().getFullYear()} CosmicPulse. All rights reserved.</p>
                    <p className="mt-2">
                        Powered by{' '}
                        <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
                            KoreaNews
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}

// Loading fallback
function LoadingFallback() {
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
                <Rocket className="w-12 h-12 text-purple-500" />
            </motion.div>
        </div>
    );
}

// Main Landing Page
export default function CosmosLandingPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <LoadingFallback />;
    }

    return (
        <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
            {/* 3D Background */}
            <Suspense fallback={null}>
                <CosmicBackground />
            </Suspense>

            {/* Content */}
            <div className="relative z-10">
                <HeroSection />
                <StatsSection />
                <FeaturesSection />
                <LatestPostsSection />
                <CTASection />
                <FooterSection />
            </div>

            {/* Custom styles */}
            <style jsx global>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes gradient-reverse {
                    0% { background-position: 100% 50%; }
                    50% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }

                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }

                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(10deg); }
                }

                @keyframes float-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .animate-gradient {
                    animation: gradient 3s ease infinite;
                }

                .animate-gradient-reverse {
                    animation: gradient-reverse 3s ease infinite;
                }

                .animate-blink {
                    animation: blink 1s infinite;
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-float-delayed {
                    animation: float-delayed 4s ease-in-out infinite;
                    animation-delay: 0.5s;
                }

                .animate-float-slow {
                    animation: float-slow 5s ease-in-out infinite;
                    animation-delay: 1s;
                }
            `}</style>
        </div>
    );
}
