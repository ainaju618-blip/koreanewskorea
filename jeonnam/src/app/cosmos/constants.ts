import { type LucideIcon } from 'lucide-react';

export interface Category {
    id: string;
    name: string;
    slug: string;
    iconName: 'Telescope' | 'Sparkles' | 'Atom' | 'Cpu' | 'TrendingUp' | 'Bot';
    color: string;
    description: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    thumbnailUrl: string;
    categorySlug: string;
    author: string;
    viewCount: number;
    createdAt: string;
    tags: string[];
}

export interface Stat {
    label: string;
    value: string;
    iconName: 'FileText' | 'Eye' | 'Users';
}

export const CATEGORIES: Category[] = [
    {
        id: '1',
        name: 'Space Science',
        slug: 'space-science',
        iconName: 'Telescope',
        color: 'blue-500',
        description: 'Latest discoveries in astrophysics and planetary science.'
    },
    {
        id: '2',
        name: 'SF Entertainment',
        slug: 'sf-entertainment',
        iconName: 'Sparkles',
        color: 'purple-500',
        description: 'Reviews and news on Sci-Fi movies, books, and games.'
    },
    {
        id: '3',
        name: 'Astronomy',
        slug: 'astronomy',
        iconName: 'Atom',
        color: 'violet-500',
        description: 'Stargazing guides and celestial events.'
    },
    {
        id: '4',
        name: 'Future Tech',
        slug: 'future-tech',
        iconName: 'Cpu',
        color: 'emerald-500',
        description: 'Emerging technologies shaping our future among the stars.'
    },
    {
        id: '5',
        name: 'Space Economy',
        slug: 'space-economy',
        iconName: 'TrendingUp',
        color: 'amber-500',
        description: 'The business of space exploration and colonization.'
    },
    {
        id: '6',
        name: 'AI Content',
        slug: 'ai-content',
        iconName: 'Bot',
        color: 'pink-500',
        description: 'AI-generated theories and stories about the cosmos.'
    }
];

export const MOCK_POSTS: BlogPost[] = [
    {
        id: '101',
        title: "The Great Silence: Why Haven't We Found Them?",
        slug: 'great-silence-fermi-paradox',
        excerpt: 'Exploring the Fermi Paradox and the chilling possibility that we might be alone in the universe, or worse, ignored.',
        content: 'Full content would go here...',
        thumbnailUrl: 'https://picsum.photos/seed/space1/800/600',
        categorySlug: 'space-science',
        author: 'Dr. Astra',
        viewCount: 1240,
        createdAt: '2025-12-15',
        tags: ['Aliens', 'Fermi Paradox', 'Space']
    },
    {
        id: '102',
        title: 'Dune: Part Two - A Cinematic Masterpiece',
        slug: 'dune-part-two-review',
        excerpt: 'An in-depth look at how Villeneuve brought Arrakis to life with stunning visuals and sound design.',
        content: 'Full content...',
        thumbnailUrl: 'https://picsum.photos/seed/dune/800/600',
        categorySlug: 'sf-entertainment',
        author: 'CineBot',
        viewCount: 8902,
        createdAt: '2025-12-14',
        tags: ['Movies', 'Dune', 'Review']
    },
    {
        id: '103',
        title: 'SpaceX Starship: The Road to Mars',
        slug: 'spacex-starship-update',
        excerpt: 'The latest test flight data suggests we are closer to the Red Planet than ever before.',
        content: 'Full content...',
        thumbnailUrl: 'https://picsum.photos/seed/rocket/800/600',
        categorySlug: 'future-tech',
        author: 'Elon Fan',
        viewCount: 5600,
        createdAt: '2025-12-10',
        tags: ['SpaceX', 'Mars', 'Rockets']
    },
    {
        id: '104',
        title: 'Mining the Asteroid Belt',
        slug: 'mining-asteroid-belt',
        excerpt: 'Trillions of dollars in rare earth metals are floating above us. Who will get there first?',
        content: 'Full content...',
        thumbnailUrl: 'https://picsum.photos/seed/mining/800/600',
        categorySlug: 'space-economy',
        author: 'EcoStonk',
        viewCount: 3200,
        createdAt: '2025-12-08',
        tags: ['Economy', 'Mining', 'Future']
    },
    {
        id: '105',
        title: 'AI Dreamt of Electric Sheep',
        slug: 'ai-dreamt-electric-sheep',
        excerpt: 'Analyzing the intersection of artificial intelligence hallucination and creative writing.',
        content: 'Full content...',
        thumbnailUrl: 'https://picsum.photos/seed/aiart/800/600',
        categorySlug: 'ai-content',
        author: 'Claude',
        viewCount: 1500,
        createdAt: '2025-12-01',
        tags: ['AI', 'Philosophy', 'Tech']
    },
    {
        id: '106',
        title: 'Geminid Meteor Shower 2025: When and Where to Watch',
        slug: 'geminid-meteor-shower-2025',
        excerpt: 'The annual Geminid meteor shower peaks this week. Here is your complete guide to catching the celestial fireworks.',
        content: 'Full content...',
        thumbnailUrl: 'https://picsum.photos/seed/meteor/800/600',
        categorySlug: 'astronomy',
        author: 'StarGazer',
        viewCount: 4520,
        createdAt: '2025-12-13',
        tags: ['Meteor Shower', 'Stargazing', 'Events']
    },
    {
        id: '107',
        title: 'Black Holes: The Universe\'s Ultimate Mystery',
        slug: 'black-holes-ultimate-mystery',
        excerpt: 'From event horizons to singularities, diving deep into the most enigmatic objects in the cosmos.',
        content: 'Full content...',
        thumbnailUrl: 'https://picsum.photos/seed/blackhole/800/600',
        categorySlug: 'astronomy',
        author: 'Dr. Hawking Fan',
        viewCount: 7830,
        createdAt: '2025-12-11',
        tags: ['Black Holes', 'Physics', 'Space']
    },
    {
        id: '108',
        title: 'James Webb Captures New Exoplanet Images',
        slug: 'jwst-exoplanet-images',
        excerpt: 'The James Webb Space Telescope reveals stunning details of planets orbiting distant stars.',
        content: 'Full content...',
        thumbnailUrl: 'https://picsum.photos/seed/jwst/800/600',
        categorySlug: 'astronomy',
        author: 'NASA Watcher',
        viewCount: 6100,
        createdAt: '2025-12-09',
        tags: ['JWST', 'Exoplanets', 'NASA']
    }
];

export const STATS: Stat[] = [
    { label: 'Total Posts', value: '1,024', iconName: 'FileText' },
    { label: 'Monthly Views', value: '45.2K', iconName: 'Eye' },
    { label: 'Subscribers', value: '8,900', iconName: 'Users' }
];
