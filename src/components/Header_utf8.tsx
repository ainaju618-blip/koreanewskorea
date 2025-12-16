'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Menu, X, Search, MapPin, User, FileText, Facebook, Instagram, Twitter, ChevronRight, ChevronDown, Newspaper, Rocket, Telescope, Sparkles, Atom, Cpu, TrendingUp, Bot, Database } from 'lucide-react';
import { PWAInstallButton, PWAInstallMenuItem } from './PWAInstallPrompt';

// Dynamic import for NewsTicker (reduces initial bundle, loads after header)
const NewsTicker = dynamic(() => import('./NewsTicker'), {
    ssr: false,
    loading: () => <div className="h-[45px] bg-slate-50 animate-pulse" />
});

// CosmicPulse categories
const COSMOS_CATEGORIES = [
    { name: 'Space Science', slug: 'space-science', icon: Telescope },
    { name: 'SF Entertainment', slug: 'sf-entertainment', icon: Sparkles },
    { name: 'Astronomy', slug: 'astronomy', icon: Atom },
    { name: 'Future Tech', slug: 'future-tech', icon: Cpu },
    { name: 'Space Economy', slug: 'space-economy', icon: TrendingUp },
    { name: 'AI Content', slug: 'ai-content', icon: Bot },
];

// 移댄뀒怨좊━ ?