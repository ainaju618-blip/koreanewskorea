'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../constants';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/cosmos" className="flex items-center space-x-2 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-600 blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <Rocket className="h-8 w-8 text-white relative z-10 transform group-hover:-rotate-45 transition-transform duration-300" />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            CosmicPulse
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {CATEGORIES.slice(0, 4).map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/cosmos/${cat.slug}`}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        pathname.includes(cat.slug)
                                            ? 'text-white bg-white/10'
                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <Search className="h-5 w-5" />
                        </button>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.7)]">
                            Subscribe
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-400 hover:text-white p-2"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-black/90 border-b border-white/10 backdrop-blur-xl"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {CATEGORIES.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/cosmos/${cat.slug}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/10"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 py-12 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/cosmos" className="flex items-center space-x-2 mb-4">
                            <Rocket className="h-6 w-6 text-purple-500" />
                            <span className="text-xl font-bold text-white">CosmicPulse</span>
                        </Link>
                        <p className="text-gray-400 max-w-sm">
                            Exploring the infinite possibilities of space, science fiction, and future technology.
                            Join us on a journey through the stars.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-4">Categories</h3>
                        <ul className="space-y-2">
                            {CATEGORIES.slice(0, 4).map(cat => (
                                <li key={cat.id}>
                                    <Link href={`/cosmos/${cat.slug}`} className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-4">Connect</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">Twitter / X</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">Discord</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">Newsletter</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
                    &copy; 2025 CosmicPulse. Generated by AI. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

export function CosmosLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16 relative z-10">
                {children}
            </main>
            <Footer />
        </div>
    );
}
