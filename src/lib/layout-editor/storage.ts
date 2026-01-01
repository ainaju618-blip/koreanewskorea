// Layout Editor Storage Utilities

import { LayoutEditorState, PageStyles, StyleMap } from './types';

const STORAGE_KEY = 'layout-editor-styles';
const VERSION = '1.0';

export function getStoredStyles(): LayoutEditorState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as LayoutEditorState;
  } catch {
    return null;
  }
}

export function saveStyles(styles: PageStyles): void {
  if (typeof window === 'undefined') return;

  const state: LayoutEditorState = {
    version: VERSION,
    lastModified: new Date().toISOString(),
    styles,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearStyles(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function exportStyles(): string {
  const stored = getStoredStyles();
  return JSON.stringify(stored, null, 2);
}

export function importStyles(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as LayoutEditorState;
    if (!data.styles || typeof data.styles !== 'object') {
      throw new Error('Invalid format');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// Generate CSS string from style map
export function generateCSSFromStyles(styles: StyleMap): string {
  let css = '';

  for (const [selector, properties] of Object.entries(styles)) {
    const props = Object.entries(properties)
      .map(([prop, value]) => `  ${camelToKebab(prop)}: ${value} !important;`)
      .join('\n');

    if (props) {
      css += `${selector} {\n${props}\n}\n\n`;
    }
  }

  return css;
}

// Convert camelCase to kebab-case
function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Apply styles to document
export function applyStylesToDocument(pagePath: string): void {
  const stored = getStoredStyles();
  if (!stored?.styles?.[pagePath]) return;

  const styleId = 'layout-editor-applied-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = generateCSSFromStyles(stored.styles[pagePath]);
}

// Remove applied styles
export function removeAppliedStyles(): void {
  const styleEl = document.getElementById('layout-editor-applied-styles');
  if (styleEl) {
    styleEl.remove();
  }
}
