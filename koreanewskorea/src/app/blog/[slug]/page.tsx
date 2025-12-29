import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { BlogPost } from '@/types/blog';
import {
    Rocket,
    Clock,
    Eye,
    ArrowLeft,
    Share2,
    Tag,
    Sparkles,
    User,
    ExternalLink
} from 'lucide-react';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Revalidate every 60 seconds
export const revalidate = 60;

async function getPost(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (error || !data) {
        return null;
    }

    // Increment view count
    await supabaseAdmin.rpc('increment_blog_view', { post_id: data.id });

    return data;
}

async function getRelatedPosts(category: string, currentId: string): Promise<BlogPost[]> {
    const { data } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('category', category)
        .neq('id', currentId)
        .order('published_at', { ascending: false })
        .limit(3);

    return data || [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        return {
            title: 'Post Not Found - CosmicPulse'
        };
    }

    return {
        title: post.seo_title || post.title,
        description: post.seo_description || post.excerpt,
        keywords: post.seo_keywords?.join(', '),
        openGraph: {
            title: post.title,
            description: post.excerpt || '',
            type: 'article',
            publishedTime: post.published_at || undefined,
            authors: [post.author_name],
            images: post.thumbnail_url ? [post.thumbnail_url] : []
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt || '',
            images: post.thumbnail_url ? [post.thumbnail_url] : []
        }
    };
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Simple markdown renderer
function renderContent(content: string) {
    // Convert markdown-like syntax to HTML
    let html = content
        // Headers
        .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold text-white mt-8 mb-4">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-white mt-10 mb-4">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-white mt-10 mb-6">$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-400 hover:underline" target="_blank" rel="noopener">$1</a>')
        // Lists
        .replace(/^- (.*$)/gm, '<li class="ml-4 text-gray-300">$1</li>')
        // Paragraphs
        .replace(/\n\n/g, '</p><p class="text-gray-300 leading-relaxed mb-4">')
        .replace(/\n/g, '<br />');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
        html = `<p class="text-gray-300 leading-relaxed mb-4">${html}</p>`;
    }

    return html;
}

// Related Post Card
function RelatedPostCard({ post }: { post: BlogPost }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="block bg-[#12121a] border border-purple-500/20 rounded-lg overflow-hidden hover:border-purple-500/40 transition-all"
        >
            {post.thumbnail_url ? (
                <div className="aspect-video bg-purple-500/10 overflow-hidden">
                    <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Rocket className="w-8 h-8 text-purple-400/50" />
                </div>
            )}
            <div className="p-4">
                <h3 className="text-sm font-medium text-white line-clamp-2 hover:text-purple-300">
                    {post.title}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                    {formatDate(post.published_at || post.created_at)}
                </p>
            </div>
        </Link>
    );
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = await getRelatedPosts(post.category, post.id);

    // Schema.org structured data
    const schemaData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.thumbnail_url,
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: {
            '@type': 'Person',
            name: post.author_name
        },
        publisher: {
            '@type': 'Organization',
            name: 'CosmicPulse',
            logo: {
                '@type': 'ImageObject',
                url: 'https://www.gwangju.koreanewsone.com/logo.png'
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            {/* Schema.org */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />

            {/* Header */}
            <header className="border-b border-purple-500/20">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/blog"
                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <div className="flex items-center gap-2">
                                <Rocket className="w-5 h-5" />
                                <span className="font-semibold">CosmicPulse</span>
                            </div>
                        </Link>
                        <button className="p-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Article */}
            <article className="max-w-4xl mx-auto px-4 py-12">
                {/* Hero Image */}
                {post.thumbnail_url && (
                    <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-purple-500/10">
                        <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                        {post.category}
                    </span>
                    {post.ai_generated && (
                        <span className="px-3 py-1 bg-pink-500/20 text-pink-300 text-sm rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Generated
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <Clock className="w-4 h-4" />
                        {formatDate(post.published_at || post.created_at)}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <Eye className="w-4 h-4" />
                        {post.view_count.toLocaleString()} views
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                    {post.title}
                </h1>

                {/* Author */}
                <div className="flex items-center gap-3 mb-8 pb-8 border-b border-purple-500/20">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-medium">{post.author_name}</p>
                        <p className="text-gray-500 text-sm">CosmicPulse Writer</p>
                    </div>
                </div>

                {/* Content */}
                <div
                    className="prose prose-invert prose-purple max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
                />

                {/* Source */}
                {post.source_url && (
                    <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Reference Source:</p>
                        <a
                            href={post.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-purple-400 hover:underline"
                        >
                            <ExternalLink className="w-4 h-4" />
                            {post.source_url}
                        </a>
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-8 flex flex-wrap items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-500" />
                        {post.tags.map((tag, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 bg-purple-500/10 text-purple-300 text-sm rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="max-w-4xl mx-auto px-4 py-12 border-t border-purple-500/20">
                    <h2 className="text-xl font-bold text-white mb-6">Related Posts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {relatedPosts.map(p => (
                            <RelatedPostCard key={p.id} post={p} />
                        ))}
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="border-t border-purple-500/20 py-8">
                <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} CosmicPulse. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
