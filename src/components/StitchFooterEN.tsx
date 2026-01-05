'use client';

import Link from 'next/link';
import { Newspaper, Mail, Phone, MapPin, Globe, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function StitchFooterEN() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/en" className="flex items-center gap-2 mb-4">
              <Newspaper className="w-7 h-7 text-cyan-400" />
              <span className="text-xl font-black">Korea<span className="text-cyan-400">NEWS</span></span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Your trusted source for local and national news from across South Korea.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-cyan-500 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-cyan-500 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-cyan-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-cyan-500 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/en" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/en/map" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">News Map</Link>
              </li>
              <li>
                <Link href="/en/region/naju" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Local News</Link>
              </li>
              <li>
                <Link href="/en/category/travel" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Travel</Link>
              </li>
              <li>
                <Link href="/en/category/food" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Food</Link>
              </li>
              <li>
                <Link href="/en/category/business" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Business</Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-white mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Newsletter</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Mobile App</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Advertising</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Submit News</Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Korean Version
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h3 className="font-bold text-white mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Bitgaram-dong, Naju-si, Jeollanam-do, South Korea</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+82-61-XXX-XXXX</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 shrink-0" />
                <span>contact@koreanews.com</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <ul className="flex flex-wrap gap-3 text-xs text-gray-500">
                <li><Link href="#" className="hover:text-gray-300">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-gray-300">Terms of Use</Link></li>
                <li><Link href="#" className="hover:text-gray-300">Corrections</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} KoreaNEWS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
