'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AdBannerProps {
  imageUrl?: string;
  altText?: string;
  href?: string;
  width?: number;
  height?: number;
  sticky?: boolean;
  stickyTop?: number;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export default function AdBanner({
  imageUrl,
  altText = '광고',
  href,
  width = 300,
  height = 250,
  sticky = false,
  stickyTop = 80,
  label = '광고',
  className = '',
  onClick,
}: AdBannerProps) {
  const containerClasses = `
    bg-gray-100 dark:bg-gray-800
    rounded-2xl overflow-hidden
    shadow-sm border border-gray-200 dark:border-gray-700
    ${sticky ? 'sticky' : ''}
    ${className}
  `.trim();

  const containerStyle = sticky ? { top: `${stickyTop}px` } : undefined;

  const renderContent = () => {
    if (imageUrl) {
      return (
        <Image
          src={imageUrl}
          alt={altText}
          width={width}
          height={height}
          className="w-full h-auto object-cover"
        />
      );
    }

    // Placeholder when no image is provided
    return (
      <div
        className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"
        style={{ width: '100%', height: `${height}px` }}
      >
        <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500 mb-2">
          ad_units
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {width} x {height}
        </span>
      </div>
    );
  };

  const banner = (
    <div className={containerClasses} style={containerStyle}>
      {label && (
        <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
      )}
      <div className="relative" onClick={onClick}>
        {renderContent()}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer sponsored">
        {banner}
      </Link>
    );
  }

  return banner;
}
