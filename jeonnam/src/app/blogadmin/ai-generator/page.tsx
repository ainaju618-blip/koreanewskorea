"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Sparkles,
    Rocket,
    TrendingUp,
    Globe,
    Zap,
    FileText,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Wand2,
    BookOpen,
    Film,
    Microscope,
    Building2
} from 'lucide-react';

const CATEGORIES = [
    { value: 'sf-entertainment', label: 'SF Entertainment', icon: Film, description: 'Movies, dramas, games' },
    { value: 'space-science', label: 'Space Science', icon: Rocket, description: 'NASA, ESA, exploration' },
    { value: 'astronomy', label: 'Astronomy', icon: Globe, description: 'Stars, galaxies, cosmos' },
    { value: 'future-tech', label: 'Future Tech', icon: Microscope, description: 'Space technology' },
    { value: 'space-industry', label: 'Space Industry', icon: Building2, description: 'SpaceX, business' }
];

const WRITING_STYLES = [
    { value: 'informative', label: 'Informative', description: 'Factual and educational' },
    { value: 'entertaining', label: 'Entertaining', description: 'Fun and engaging' },
    { value: 'analytical', label: 'Analytical', description: 'Deep dive analysis' }
];

const CONTENT_LENGTHS = [
    { value: 'short', label: 'Short', description: '~800 words' },
    { value: 'medium', label: 'Medium', description: '~1500 words' },
    { value: 'long', label: 'Long', description: '~2500 words' }
];

interface TrendingTopic {
    id: string;
    topic: string;
    source: string;
    score: number;
    keywords: string[];
}

export default function AIGeneratorPage() {
    const router = useRouter();

    const [topic, setTopic] = useState('');
    const [category, setCategory] = useState('sf-entertainment');
    const [style, setStyle] = useState('entertaining');
    const [length, setLength] = useState('medium');
    const [sourceUrl, setSourceUrl] = useState('');

    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState('');

    const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
    const [loadingTrending, setLoadingTrending] = useState(true);

    // Fetch trending topics
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch('/api/blog/trending');
                if (res.ok) {
                    const data = await res.json();
                    setTrendingTopics(data.topics || []);
                }
            } catch (error) {
                console.error('Failed to fetch trending:', error);
            } finally {
                setLoadingTrending(false);
            }
        };

        fetchTrending();
    }, []);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setGenerating(true);
        setError('');
        setProgress(0);

        // Simulate progress steps
        const progressSteps = [
            { progress: 10, message: 'Analyzing topic...' },
            { progress: 25, message: 'Researching sources...' },
            { progress: 40, message: 'Generating outline...' },
            { progress: 60, message: 'Writing content...' },
            { progress: 80, message: 'Adding SEO optimization...' },
            { progress: 95, message: 'Finalizing post...' }
        ];

        try {
            // Start progress animation
            for (const step of progressSteps) {
                setProgress(step.progress);
                setProgressMessage(step.message);
                await new Promise(r => setTimeout(r, 800));
            }

            const res = await fetch('/api/blog/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    category,
                    style,
                    length,
                    source_url: sourceUrl
                })
            });

            if (res.ok) {
                const data = await res.json();
                setProgress(100);
                setProgressMessage('Post created successfully!');

                // Redirect to edit page
                setTimeout(() => {
                    router.push(`/blogadmin/posts/${data.post.id}`);
                }, 1000);
            } else {
                const errorData = await res.json();
                setError(errorData.error || 'Failed to generate post');
                setProgress(0);
            }
        } catch (error) {
            console.error('Generation error:', error);
            setError('Failed to generate post');
            setProgress(0);
        } finally {
            setGenerating(false);
        }
    };

    const selectTrendingTopic = (t: TrendingTopic) => {
        setTopic(t.topic);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="w-7 h-7 text-purple-400" />
                        AI Content Generator
                    </h1>
                    <p className="text-gray-500 mt-1">Generate SF & Space content with AI</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Topic Input */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-6">
                        <label className="block text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-purple-400" />
                            What should I write about?
                        </label>
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Analyze the science behind the black hole in Interstellar movie..."
                            rows={4}
                            className="w-full px-4 py-3 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                            disabled={generating}
                        />

                        {/* Source URL (optional) */}
                        <div className="mt-4">
                            <label className="block text-sm text-gray-400 mb-2">
                                Reference URL (optional)
                            </label>
                            <input
                                type="url"
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                                placeholder="https://www.space.com/article..."
                                className="w-full px-4 py-2 bg-[#0a0a0f] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                                disabled={generating}
                            />
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-6">
                        <label className="block text-sm font-medium text-purple-300 mb-3">
                            Category
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {CATEGORIES.map(cat => {
                                const Icon = cat.icon;
                                return (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategory(cat.value)}
                                        disabled={generating}
                                        className={`p-4 rounded-lg border text-left transition-all
                                            ${category === cat.value
                                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                                : 'border-purple-500/20 text-gray-400 hover:border-purple-500/40 hover:bg-purple-500/5'}
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 mb-2 ${category === cat.value ? 'text-purple-400' : 'text-gray-500'}`} />
                                        <p className="font-medium text-sm">{cat.label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Style & Length */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Writing Style */}
                        <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-6">
                            <label className="block text-sm font-medium text-purple-300 mb-3">
                                Writing Style
                            </label>
                            <div className="space-y-2">
                                {WRITING_STYLES.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => setStyle(s.value)}
                                        disabled={generating}
                                        className={`w-full p-3 rounded-lg border text-left transition-all
                                            ${style === s.value
                                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                                : 'border-purple-500/20 text-gray-400 hover:border-purple-500/40'}
                                        `}
                                    >
                                        <p className="font-medium text-sm">{s.label}</p>
                                        <p className="text-xs text-gray-500">{s.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Length */}
                        <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-6">
                            <label className="block text-sm font-medium text-purple-300 mb-3">
                                Content Length
                            </label>
                            <div className="space-y-2">
                                {CONTENT_LENGTHS.map(l => (
                                    <button
                                        key={l.value}
                                        onClick={() => setLength(l.value)}
                                        disabled={generating}
                                        className={`w-full p-3 rounded-lg border text-left transition-all
                                            ${length === l.value
                                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                                : 'border-purple-500/20 text-gray-400 hover:border-purple-500/40'}
                                        `}
                                    >
                                        <p className="font-medium text-sm">{l.label}</p>
                                        <p className="text-xs text-gray-500">{l.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {generating && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-purple-300">{progressMessage}</span>
                                    <span className="text-sm text-purple-400">{progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-purple-500/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={generating || !topic.trim()}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? (
                                <>
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6" />
                                    Generate Post
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Sidebar - Trending Topics */}
                <div className="space-y-6">
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-pink-400" />
                            Trending Topics
                        </h2>

                        {loadingTrending ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-16 bg-purple-500/5 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : trendingTopics.length > 0 ? (
                            <div className="space-y-2">
                                {trendingTopics.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => selectTrendingTopic(t)}
                                        className="w-full p-3 rounded-lg border border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-left"
                                    >
                                        <p className="text-sm text-white font-medium line-clamp-2">{t.topic}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-gray-500">{t.source}</span>
                                            <span className="text-xs text-pink-400">Score: {t.score}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No trending topics yet</p>
                                <p className="text-xs mt-1">Topics will appear after crawling</p>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-amber-400" />
                            Tips
                        </h2>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                Be specific about your topic
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                Add reference URLs for accuracy
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                Review and edit before publishing
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                Add your own insights
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
