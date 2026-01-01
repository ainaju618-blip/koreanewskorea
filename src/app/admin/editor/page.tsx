'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Page list
const PAGES = [
  { path: '/', name: '\ud648', group: '\uacf5\uac1c' },
  { path: '/news', name: '\ub274\uc2a4 \ubaa9\ub85d', group: '\uacf5\uac1c' },
  { path: '/category', name: '\uce74\ud14c\uace0\ub9ac', group: '\uacf5\uac1c' },
  { path: '/admin', name: '\uad00\ub9ac\uc790 \ub300\uc2dc\ubcf4\ub4dc', group: '\uad00\ub9ac\uc790' },
  { path: '/admin/news', name: '\uae30\uc0ac \uad00\ub9ac', group: '\uad00\ub9ac\uc790' },
];

// CSS properties for editing
const CSS_PROPERTIES = [
  { key: 'backgroundColor', label: '\ubc30\uacbd\uc0c9', type: 'color' },
  { key: 'color', label: '\uae00\uc790\uc0c9', type: 'color' },
  { key: 'padding', label: '\uc548\ucabd \uc5ec\ubc31', type: 'text', placeholder: '16px' },
  { key: 'margin', label: '\ubc14\uae65\ucabd \uc5ec\ubc31', type: 'text', placeholder: '8px' },
  { key: 'fontSize', label: '\uae00\uc790 \ud06c\uae30', type: 'text', placeholder: '14px' },
  { key: 'fontWeight', label: '\uae00\uc790 \uad75\uae30', type: 'select', options: ['normal', 'bold', '500', '600', '700'] },
  { key: 'borderRadius', label: '\ubaa8\uc11c\ub9ac \ub465\uae00\uae30', type: 'text', placeholder: '4px' },
  { key: 'width', label: '\ub108\ube44', type: 'text', placeholder: '100%' },
  { key: 'height', label: '\ub192\uc774', type: 'text', placeholder: 'auto' },
];

interface StyleMap {
  [selector: string]: {
    [property: string]: string;
  };
}

export default function LayoutEditor() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [selectedPage, setSelectedPage] = useState('/');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [styles, setStyles] = useState<StyleMap>({});
  const [pendingStyles, setPendingStyles] = useState<StyleMap>({});
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Group pages
  const groupedPages = PAGES.reduce((acc, page) => {
    if (!acc[page.group]) acc[page.group] = [];
    acc[page.group].push(page);
    return acc;
  }, {} as Record<string, typeof PAGES>);

  // Load saved styles
  useEffect(() => {
    const saved = localStorage.getItem('layout-editor-styles');
    if (saved) {
      try {
        setStyles(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved styles');
      }
    }
  }, []);

  // Apply styles to iframe
  const applyStylesToIframe = useCallback(() => {
    if (!iframeRef.current?.contentDocument) return;

    const doc = iframeRef.current.contentDocument;
    let styleEl = doc.getElementById('layout-editor-styles') as HTMLStyleElement;

    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = 'layout-editor-styles';
      doc.head.appendChild(styleEl);
    }

    const allStyles = { ...styles, ...pendingStyles };
    const cssText = Object.entries(allStyles)
      .map(([selector, props]) => {
        const propsStr = Object.entries(props)
          .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v} !important`)
          .join('; ');
        return `${selector} { ${propsStr} }`;
      })
      .join('\n');

    styleEl.textContent = cssText;
  }, [styles, pendingStyles]);

  // Apply pending styles when changed
  useEffect(() => {
    if (iframeLoaded) {
      applyStylesToIframe();
    }
  }, [pendingStyles, iframeLoaded, applyStylesToIframe]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIframeLoaded(true);

    if (!iframeRef.current?.contentDocument) return;

    const doc = iframeRef.current.contentDocument;

    // Add click listener to iframe
    doc.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      if (!target) return;

      // Generate selector
      let selector = target.tagName.toLowerCase();
      if (target.id) {
        selector = `#${target.id}`;
      } else if (target.className && typeof target.className === 'string') {
        const classes = target.className.split(' ').filter(c => c && !c.startsWith('hover:'));
        if (classes.length > 0) {
          selector = `.${classes.slice(0, 2).join('.')}`;
        }
      }

      setSelectedElement(selector);

      // Highlight selected element
      doc.querySelectorAll('[data-editor-selected]').forEach(el => {
        el.removeAttribute('data-editor-selected');
        (el as HTMLElement).style.outline = '';
      });
      target.setAttribute('data-editor-selected', 'true');
      target.style.outline = '2px solid #3b82f6';
    }, true);

    applyStylesToIframe();
  };

  // Update a CSS property
  const updateProperty = (property: string, value: string) => {
    if (!selectedElement) return;

    setPendingStyles(prev => ({
      ...prev,
      [selectedElement]: {
        ...(prev[selectedElement] || {}),
        [property]: value,
      },
    }));
  };

  // Apply pending changes
  const applyChanges = () => {
    setStyles(prev => {
      const newStyles = { ...prev };
      for (const [selector, props] of Object.entries(pendingStyles)) {
        newStyles[selector] = { ...(newStyles[selector] || {}), ...props };
      }
      return newStyles;
    });
    setPendingStyles({});
  };

  // Save to localStorage
  const saveChanges = () => {
    applyChanges();
    localStorage.setItem('layout-editor-styles', JSON.stringify({ ...styles, ...pendingStyles }));
    alert('\uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4!');
  };

  // Discard pending changes
  const discardChanges = () => {
    setPendingStyles({});
    applyStylesToIframe();
  };

  // Reset all styles
  const resetAll = () => {
    if (confirm('\ubaa8\ub4e0 \uc2a4\ud0c0\uc77c\uc744 \ucd08\uae30\ud654\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?')) {
      setStyles({});
      setPendingStyles({});
      localStorage.removeItem('layout-editor-styles');
      applyStylesToIframe();
    }
  };

  const hasPending = Object.keys(pendingStyles).length > 0;
  const currentElementStyles = selectedElement
    ? { ...(styles[selectedElement] || {}), ...(pendingStyles[selectedElement] || {}) }
    : {};

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-gray-800 border-b border-gray-700 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">\ub808\uc774\uc544\uc6c3 \uc5d0\ub514\ud130</h1>
          <span className="text-sm text-gray-400">
            {selectedPage}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasPending && (
            <>
              <button
                onClick={discardChanges}
                className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                \ucde8\uc18c
              </button>
              <button
                onClick={applyChanges}
                className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-500"
              >
                \ubc18\uc601
              </button>
            </>
          )}
          <button
            onClick={saveChanges}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 font-medium"
          >
            \uc800\uc7a5
          </button>
          <button
            onClick={resetAll}
            className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
          >
            \ucd08\uae30\ud654
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            \ub2eb\uae30
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Page list */}
        <aside className="w-56 bg-gray-800 border-r border-gray-700 overflow-y-auto shrink-0">
          <div className="p-3">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">\ud398\uc774\uc9c0 \ubaa9\ub85d</h2>
            {Object.entries(groupedPages).map(([group, pages]) => (
              <div key={group} className="mb-4">
                <div className="text-xs text-gray-500 uppercase mb-1">{group}</div>
                {pages.map(page => (
                  <button
                    key={page.path}
                    onClick={() => {
                      setSelectedPage(page.path);
                      setSelectedElement(null);
                      setIframeLoaded(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded mb-0.5 transition-colors ${
                      selectedPage === page.path
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {page.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Preview */}
        <main className="flex-1 bg-gray-950 relative overflow-hidden">
          <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded">
            \uc694\uc18c\ub97c \ud074\ub9ad\ud558\uc5ec \uc120\ud0dd
          </div>
          <iframe
            ref={iframeRef}
            key={selectedPage}
            src={selectedPage}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
          />
        </main>

        {/* Right: Property panel */}
        <aside className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto shrink-0">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">\uc18d\uc131 \ud3b8\uc9d1</h2>

            {selectedElement ? (
              <>
                <div className="mb-4 p-2 bg-gray-700 rounded text-xs text-gray-300 font-mono break-all">
                  {selectedElement}
                </div>

                <div className="space-y-3">
                  {CSS_PROPERTIES.map(prop => (
                    <div key={prop.key}>
                      <label className="block text-xs text-gray-400 mb-1">
                        {prop.label}
                      </label>
                      {prop.type === 'color' ? (
                        <input
                          type="color"
                          value={currentElementStyles[prop.key] || '#ffffff'}
                          onChange={(e) => updateProperty(prop.key, e.target.value)}
                          className="w-full h-8 rounded border border-gray-600 bg-gray-700 cursor-pointer"
                        />
                      ) : prop.type === 'select' ? (
                        <select
                          value={currentElementStyles[prop.key] || ''}
                          onChange={(e) => updateProperty(prop.key, e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded border border-gray-600 bg-gray-700 text-white"
                        >
                          <option value="">--</option>
                          {prop.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={currentElementStyles[prop.key] || ''}
                          onChange={(e) => updateProperty(prop.key, e.target.value)}
                          placeholder={prop.placeholder}
                          className="w-full px-2 py-1.5 text-sm rounded border border-gray-600 bg-gray-700 text-white placeholder-gray-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                \ubbf8\ub9ac\ubcf4\uae30\uc5d0\uc11c \uc694\uc18c\ub97c \uc120\ud0dd\ud558\uc138\uc694
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Status bar */}
      <footer className="h-8 bg-gray-800 border-t border-gray-700 px-4 flex items-center text-xs text-gray-400 shrink-0">
        <span>
          {hasPending ? `\ub300\uae30 \uc911 ${Object.keys(pendingStyles).length}\uac1c \ubcc0\uacbd` : '\ub300\uae30 \uc911\uc778 \ubcc0\uacbd \uc5c6\uc74c'}
        </span>
        <span className="mx-2">|</span>
        <span>
          \uc800\uc7a5\ub41c \uaddc\uce59 {Object.keys(styles).length}\uac1c
        </span>
      </footer>
    </div>
  );
}
