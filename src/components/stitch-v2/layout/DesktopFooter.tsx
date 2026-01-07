'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  icon: string;
  href: string;
  label: string;
}

interface DesktopFooterProps {
  /** Site logo/brand name */
  brandName?: string;
  /** Site description */
  description?: string;
  /** Footer link sections */
  sections?: FooterSection[];
  /** Social media links */
  socialLinks?: SocialLink[];
  /** Newsletter placeholder text */
  newsletterPlaceholder?: string;
  /** Newsletter button text */
  newsletterButtonText?: string;
  /** Copyright text */
  copyright?: string;
  /** Callback when newsletter is submitted */
  onNewsletterSubmit?: (email: string) => void;
  /** Additional CSS classes */
  className?: string;
}

const defaultSections: FooterSection[] = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

const defaultSocialLinks: SocialLink[] = [
  { icon: 'language', href: '#', label: 'Website' },
  { icon: 'mail', href: '#', label: 'Email' },
];

export default function DesktopFooter({
  brandName = 'Korea NEWS',
  description = 'Delivering the latest news from across Korea. Stay informed with comprehensive coverage of politics, economy, society, culture, and more.',
  sections = defaultSections,
  socialLinks = defaultSocialLinks,
  newsletterPlaceholder = 'Enter your email',
  newsletterButtonText = 'Subscribe',
  copyright = '2023 Korea NEWS. All rights reserved.',
  onNewsletterSubmit,
  className = '',
}: DesktopFooterProps) {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onNewsletterSubmit && email.trim()) {
      onNewsletterSubmit(email.trim());
      setEmail('');
    }
  };

  return (
    <footer className={`bg-[#111418] text-white py-12 mt-auto ${className}`}>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">newspaper</span>
              </div>
              <span className="text-lg font-bold">{brandName}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Link Sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4 text-gray-200">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-200">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get the latest news delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={newsletterPlaceholder}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {newsletterButtonText}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">&copy; {copyright}</p>

          {/* Social Links */}
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="material-symbols-outlined text-xl">
                  {social.icon}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
