"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  { name: "HOME", href: "/", className: "" },
  { name: "NEWS", href: "/news", className: "" },
  { name: "POLICY", href: "/policy", className: "policy" },
  { name: "TOUR", href: "/tour", className: "tour" },
  { name: "CATEGORY", href: "/category", className: "" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header>
      {/* Top Bar */}
      <div className="hq-topbar">
        <div className="container-hq flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <span>{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">LOGIN</Link>
            <span>|</span>
            <Link href="/register">REGISTER</Link>
          </div>
        </div>
      </div>

      {/* Logo Area */}
      <div className="hq-logo-area">
        <div className="container-hq">
          <div className="hq-logo">
            <Link href="/">
              <span className="hq-logo-text">KOREANEWS</span>
            </Link>
            <p className="hq-logo-subtitle">All of Korea, All the News</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="hq-nav">
        <div className="container-hq h-full">
          {/* Desktop Navigation */}
          <ul className="hq-nav-list hidden md:flex">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link href={item.href} className={`hq-nav-item ${item.className}`}>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center justify-between h-full px-4">
            <Link href="/" className="text-white font-bold text-lg">
              KOREANEWS
            </Link>
            <button
              type="button"
              className="p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-3 px-4 text-gray-800 border-b border-gray-100 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
