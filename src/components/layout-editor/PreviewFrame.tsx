'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';
import { ElementInfo } from '@/lib/layout-editor/types';
import { generateCSSFromStyles } from '@/lib/layout-editor/storage';

interface PreviewFrameProps {
  pagePath: string;
  appliedStyles: Record<string, Record<string, string>>;
  onElementSelect: (element: ElementInfo | null) => void;
  onIframeReady: (ref: React.RefObject<HTMLIFrameElement | null>) => void;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_SIZES: Record<ViewportSize, { width: number; label: string }> = {
  desktop: { width: 1280, label: '데스크톱' },
  tablet: { width: 768, label: '태블릿' },
  mobile: { width: 375, label: '모바일' },
};

export default function PreviewFrame({
  pagePath,
  appliedStyles,
  onElementSelect,
  onIframeReady,
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSelector, setSelectedSelector] = useState<string | null>(null);

  // Notify parent when iframe is ready
  useEffect(() => {
    onIframeReady(iframeRef as React.RefObject<HTMLIFrameElement | null>);
  }, [onIframeReady]);

  // Generate unique selector for element
  const generateSelector = useCallback((element: Element): string => {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === element.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        return `${generateSelector(parent)} > ${tagName}:nth-of-type(${index})`;
      }
    }

    return tagName;
  }, []);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);

    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

    // Apply saved styles
    const styleId = 'layout-editor-preview-styles';
    let styleEl = doc.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = styleId;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = generateCSSFromStyles(appliedStyles);

    // Add highlight styles
    const highlightStyleId = 'layout-editor-highlight-styles';
    let highlightStyleEl = doc.getElementById(highlightStyleId) as HTMLStyleElement | null;
    if (!highlightStyleEl) {
      highlightStyleEl = doc.createElement('style');
      highlightStyleEl.id = highlightStyleId;
      highlightStyleEl.textContent = `
        .layout-editor-hover {
          outline: 2px dashed rgba(59, 130, 246, 0.5) !important;
          outline-offset: 2px !important;
        }
        .layout-editor-selected {
          outline: 2px solid rgb(59, 130, 246) !important;
          outline-offset: 2px !important;
        }
      `;
      doc.head.appendChild(highlightStyleEl);
    }

    // Remove previous event listeners by cloning body
    // (This is a simple way to ensure clean state)

    // Add click handler
    doc.body.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as Element;
      if (!target || target === doc.body) return;

      // Remove previous selection
      doc.querySelectorAll('.layout-editor-selected').forEach(el => {
        el.classList.remove('layout-editor-selected');
      });

      // Add selection to clicked element
      target.classList.add('layout-editor-selected');

      const selector = generateSelector(target);
      setSelectedSelector(selector);

      // Get computed styles
      const computedStyle = window.getComputedStyle(target);
      const rect = target.getBoundingClientRect();

      const elementInfo: ElementInfo = {
        selector,
        tagName: target.tagName.toLowerCase(),
        className: typeof target.className === 'string' ? target.className : '',
        id: target.id || '',
        computedStyles: {
          width: computedStyle.width,
          height: computedStyle.height,
          padding: computedStyle.padding,
          paddingTop: computedStyle.paddingTop,
          paddingRight: computedStyle.paddingRight,
          paddingBottom: computedStyle.paddingBottom,
          paddingLeft: computedStyle.paddingLeft,
          margin: computedStyle.margin,
          marginTop: computedStyle.marginTop,
          marginRight: computedStyle.marginRight,
          marginBottom: computedStyle.marginBottom,
          marginLeft: computedStyle.marginLeft,
          display: computedStyle.display,
          position: computedStyle.position,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
          lineHeight: computedStyle.lineHeight,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          borderWidth: computedStyle.borderWidth,
          borderStyle: computedStyle.borderStyle,
          borderColor: computedStyle.borderColor,
          borderRadius: computedStyle.borderRadius,
          flexDirection: computedStyle.flexDirection,
          justifyContent: computedStyle.justifyContent,
          alignItems: computedStyle.alignItems,
          gap: computedStyle.gap,
          opacity: computedStyle.opacity,
          boxShadow: computedStyle.boxShadow,
        },
        boundingRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      };

      onElementSelect(elementInfo);
    });

    // Add hover effect
    doc.body.addEventListener('mouseover', (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target || target === doc.body || target.classList.contains('layout-editor-selected')) return;
      target.classList.add('layout-editor-hover');
    });

    doc.body.addEventListener('mouseout', (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target) return;
      target.classList.remove('layout-editor-hover');
    });
  }, [appliedStyles, generateSelector, onElementSelect]);

  // Refresh iframe
  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    window.open(pagePath, '_blank');
  };

  const viewportWidth = VIEWPORT_SIZES[viewport].width;
  const scaledWidth = (viewportWidth * zoom) / 100;

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#161b22]">
        {/* Viewport Selector */}
        <div className="flex items-center gap-1 bg-[#21262d] rounded-lg p-1">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded ${viewport === 'desktop' ? 'bg-[#30363d] text-blue-400' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
            title="데스크톱"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded ${viewport === 'tablet' ? 'bg-[#30363d] text-blue-400' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
            title="태블릿"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded ${viewport === 'mobile' ? 'bg-[#30363d] text-blue-400' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
            title="모바일"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Page Info */}
        <div className="text-sm text-[#8b949e]">
          <span className="text-[#e6edf3] font-medium">{pagePath}</span>
          <span className="mx-2">|</span>
          <span>{VIEWPORT_SIZES[viewport].label} ({viewportWidth}px)</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-[#21262d] rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1.5 rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
              title="축소"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs text-[#e6edf3] min-w-[40px] text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="p-1.5 rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
              title="확대"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenInNewTab}
            className="p-2 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
            title="새 탭에서 열기"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {selectedSelector && (
        <div className="px-4 py-1.5 text-xs text-[#8b949e] bg-[#161b22] border-b border-[#30363d]">
          <span className="text-[#484f58]">선택됨:</span>{' '}
          <code className="text-blue-400 bg-[#21262d] px-1.5 py-0.5 rounded">{selectedSelector}</code>
        </div>
      )}

      {/* Preview Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-start justify-center p-4"
      >
        <div
          className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-200"
          style={{
            width: `${scaledWidth}px`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-[#0d1117] flex items-center justify-center z-10">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={pagePath}
            className="w-full border-0"
            style={{
              width: `${viewportWidth}px`,
              height: '800px',
            }}
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
}
