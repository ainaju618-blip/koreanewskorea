'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  ChevronRight,
  LogOut,
  FileText,
  CheckCircle,
  Trash2,
  PenTool,
  StickyNote,
  ExternalLink,
  Globe,
  Image,
} from 'lucide-react';

interface AdminSidebarLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
  submenu?: {
    label: string;
    icon: React.ReactNode;
    items: MenuItem[];
  };
}

export default function AdminSidebarLayout({ children }: AdminSidebarLayoutProps) {
  const pathname = usePathname();
  const [articlesOpen, setArticlesOpen] = useState(true);

  const menuGroups: MenuGroup[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      title: 'Contents',
      items: [],
      submenu: {
        label: 'Articles',
        icon: <Newspaper size={18} />,
        items: [
          { label: 'All Articles', href: '/admin/news', icon: <FileText size={16} /> },
          { label: 'Drafts', href: '/admin/drafts', icon: <StickyNote size={16} /> },
          { label: 'Pending', href: '/admin/news/pending', icon: <FileText size={16} /> },
          { label: 'Published', href: '/admin/news/published', icon: <CheckCircle size={16} /> },
          { label: 'Trash', href: '/admin/news/trash', icon: <Trash2 size={16} /> },
          { label: 'Write', href: '/admin/news/write', icon: <PenTool size={16} /> },
        ],
      },
    },
    {
      title: 'Settings',
      items: [
        { label: 'Hero Slider', href: '/admin/settings/hero-slider', icon: <Image size={18} /> },
      ],
    },
    {
      title: 'Quick Links',
      items: [
        { label: 'Gwangju Homepage', href: '/', icon: <Globe size={18} /> },
        { label: 'Main Admin', href: 'https://koreanewsone.com/admin', icon: <ExternalLink size={18} />, external: true },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const getLinkClassName = (href: string) => {
    const baseClasses = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors';
    if (isActive(href)) {
      return baseClasses + ' bg-blue-600/20 text-blue-400';
    }
    return baseClasses + ' text-gray-300 hover:bg-gray-800 hover:text-white';
  };

  const getSubLinkClassName = (href: string) => {
    const baseClasses = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors';
    if (isActive(href)) {
      return baseClasses + ' bg-blue-600/20 text-blue-400';
    }
    return baseClasses + ' text-gray-400 hover:bg-gray-800 hover:text-white';
  };

  const getChevronClassName = () => {
    const baseClasses = 'ml-auto transition-transform';
    if (articlesOpen) {
      return baseClasses + ' rotate-90';
    }
    return baseClasses;
  };

  return (
    <div className="flex min-h-screen bg-[#0d1117]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d1117] border-r border-gray-800 overflow-y-auto">
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GJ</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Korea NEWS</p>
              <p className="text-gray-400 text-xs">Gwangju Admin</p>
            </div>
          </div>
        </div>

        {/* Menu Groups */}
        <nav className="p-3">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider px-3 mb-2">
                {group.title}
              </p>

              {/* Regular Menu Items */}
              {group.items.map((item, itemIndex) => (
                <Link
                  key={itemIndex}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className={getLinkClassName(item.href)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.external && <ExternalLink size={12} className="ml-auto text-gray-500" />}
                </Link>
              ))}

              {/* Submenu (Articles) */}
              {group.submenu && (
                <div>
                  <button
                    onClick={() => setArticlesOpen(!articlesOpen)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    {group.submenu.icon}
                    <span>{group.submenu.label}</span>
                    <ChevronRight
                      size={16}
                      className={getChevronClassName()}
                    />
                  </button>

                  {articlesOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {group.submenu.items.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={getSubLinkClassName(subItem.href)}
                        >
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
