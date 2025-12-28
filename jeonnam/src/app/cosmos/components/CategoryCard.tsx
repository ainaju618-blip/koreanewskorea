'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Telescope, Sparkles, Atom, Cpu, TrendingUp, Bot, type LucideIcon } from 'lucide-react';
import { Category } from '../constants';

const iconMap: Record<string, LucideIcon> = {
    Telescope,
    Sparkles,
    Atom,
    Cpu,
    TrendingUp,
    Bot,
};

interface Props {
    category: Category;
    index: number;
}

export function CategoryCard({ category, index }: Props) {
    const IconComponent = iconMap[category.iconName];

    const colorMap: Record<string, string> = {
        'blue-500': 'group-hover:border-blue-500 group-hover:shadow-blue-500/50',
        'purple-500': 'group-hover:border-purple-500 group-hover:shadow-purple-500/50',
        'violet-500': 'group-hover:border-violet-500 group-hover:shadow-violet-500/50',
        'emerald-500': 'group-hover:border-emerald-500 group-hover:shadow-emerald-500/50',
        'amber-500': 'group-hover:border-amber-500 group-hover:shadow-amber-500/50',
        'pink-500': 'group-hover:border-pink-500 group-hover:shadow-pink-500/50',
    };

    const iconColorMap: Record<string, string> = {
        'blue-500': 'text-blue-500',
        'purple-500': 'text-purple-500',
        'violet-500': 'text-violet-500',
        'emerald-500': 'text-emerald-500',
        'amber-500': 'text-amber-500',
        'pink-500': 'text-pink-500',
    };

    const glowClass = colorMap[category.color] || 'group-hover:border-white group-hover:shadow-white/20';
    const iconClass = iconColorMap[category.color] || 'text-white';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Link href={`/cosmos/${category.slug}`} className="block h-full">
                <div className={`group relative h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg ${glowClass}`}>
                    <div className="flex flex-col h-full">
                        <div className={`p-3 bg-white/5 rounded-lg w-fit mb-4 ${iconClass} group-hover:scale-110 transition-transform duration-300`}>
                            {IconComponent && <IconComponent className="h-8 w-8" />}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400">
                            {category.name}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {category.description}
                        </p>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
