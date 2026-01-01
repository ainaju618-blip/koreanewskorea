'use client';

import { useState, useCallback, useEffect } from 'react';
import { StyleMap, PageStyles, ElementInfo, PendingChange } from '@/lib/layout-editor/types';
import { getStoredStyles, saveStyles, generateCSSFromStyles } from '@/lib/layout-editor/storage';

interface UseLayoutEditorReturn {
  // State
  currentPage: string;
  selectedElement: ElementInfo | null;
  appliedStyles: PageStyles;
  pendingChanges: StyleMap;
  savedStyles: PageStyles;
  iframeRef: React.RefObject<HTMLIFrameElement | null> | null;

  // Status
  hasUnsavedChanges: boolean;
  hasPendingChanges: boolean;
  pendingChangesList: PendingChange[];

  // Actions
  setCurrentPage: (path: string) => void;
  setSelectedElement: (element: ElementInfo | null) => void;
  updateProperty: (selector: string, property: string, value: string, oldValue: string) => void;
  applyChanges: () => void;
  saveChanges: () => void;
  discardChanges: () => void;
  discardSingleChange: (selector: string, property: string) => void;
  resetToSaved: () => void;
  setIframeRef: (ref: React.RefObject<HTMLIFrameElement | null>) => void;
}

export function useLayoutEditor(): UseLayoutEditorReturn {
  const [currentPage, setCurrentPage] = useState('/');
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [appliedStyles, setAppliedStyles] = useState<PageStyles>({});
  const [pendingChanges, setPendingChanges] = useState<StyleMap>({});
  const [savedStyles, setSavedStyles] = useState<PageStyles>({});
  const [iframeRef, setIframeRefState] = useState<React.RefObject<HTMLIFrameElement | null> | null>(null);
  const [originalValues, setOriginalValues] = useState<Record<string, Record<string, string>>>({});

  // Load saved styles on mount
  useEffect(() => {
    const stored = getStoredStyles();
    if (stored?.styles) {
      setSavedStyles(stored.styles);
      setAppliedStyles(stored.styles);
    }
  }, []);

  // Reset pending changes when page changes
  useEffect(() => {
    setPendingChanges({});
    setSelectedElement(null);
    setOriginalValues({});
  }, [currentPage]);

  // Calculate status
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const hasUnsavedChanges = JSON.stringify(appliedStyles) !== JSON.stringify(savedStyles);

  // Generate pending changes list for UI
  const pendingChangesList: PendingChange[] = [];
  for (const [selector, props] of Object.entries(pendingChanges)) {
    for (const [property, newValue] of Object.entries(props)) {
      pendingChangesList.push({
        selector,
        property,
        oldValue: originalValues[selector]?.[property] || '',
        newValue,
      });
    }
  }

  // Update a single property (adds to pending, not applied yet)
  const updateProperty = useCallback((
    selector: string,
    property: string,
    value: string,
    oldValue: string
  ) => {
    setPendingChanges(prev => ({
      ...prev,
      [selector]: {
        ...(prev[selector] || {}),
        [property]: value,
      },
    }));

    // Store original value if not already stored
    setOriginalValues(prev => {
      if (prev[selector]?.[property] !== undefined) {
        return prev;
      }
      return {
        ...prev,
        [selector]: {
          ...(prev[selector] || {}),
          [property]: oldValue,
        },
      };
    });
  }, []);

  // Apply pending changes to preview
  const applyChanges = useCallback(() => {
    if (!hasPendingChanges) return;

    // Merge pending changes into applied styles for current page
    setAppliedStyles(prev => {
      const currentPageStyles = prev[currentPage] || {};
      const mergedStyles: StyleMap = { ...currentPageStyles };

      for (const [selector, props] of Object.entries(pendingChanges)) {
        mergedStyles[selector] = {
          ...(mergedStyles[selector] || {}),
          ...props,
        };
      }

      return {
        ...prev,
        [currentPage]: mergedStyles,
      };
    });

    // Apply to iframe
    if (iframeRef?.current?.contentWindow) {
      const iframe = iframeRef.current;
      const styleId = 'layout-editor-preview-styles';
      let styleEl = iframe.contentDocument?.getElementById(styleId) as HTMLStyleElement | null;

      if (!styleEl && iframe.contentDocument) {
        styleEl = iframe.contentDocument.createElement('style');
        styleEl.id = styleId;
        iframe.contentDocument.head.appendChild(styleEl);
      }

      if (styleEl) {
        const currentPageStyles = appliedStyles[currentPage] || {};
        const mergedStyles: StyleMap = { ...currentPageStyles };

        for (const [selector, props] of Object.entries(pendingChanges)) {
          mergedStyles[selector] = {
            ...(mergedStyles[selector] || {}),
            ...props,
          };
        }

        styleEl.textContent = generateCSSFromStyles(mergedStyles);
      }
    }

    // Clear pending changes
    setPendingChanges({});
    setOriginalValues({});
  }, [currentPage, pendingChanges, hasPendingChanges, appliedStyles, iframeRef]);

  // Save to localStorage
  const saveChanges = useCallback(() => {
    saveStyles(appliedStyles);
    setSavedStyles(appliedStyles);
  }, [appliedStyles]);

  // Discard all pending changes
  const discardChanges = useCallback(() => {
    setPendingChanges({});
    setOriginalValues({});
  }, []);

  // Discard a single pending change
  const discardSingleChange = useCallback((selector: string, property: string) => {
    setPendingChanges(prev => {
      const updated = { ...prev };
      if (updated[selector]) {
        const { [property]: _, ...rest } = updated[selector];
        if (Object.keys(rest).length === 0) {
          delete updated[selector];
        } else {
          updated[selector] = rest;
        }
      }
      return updated;
    });

    setOriginalValues(prev => {
      const updated = { ...prev };
      if (updated[selector]) {
        const { [property]: _, ...rest } = updated[selector];
        if (Object.keys(rest).length === 0) {
          delete updated[selector];
        } else {
          updated[selector] = rest;
        }
      }
      return updated;
    });
  }, []);

  // Reset to last saved state
  const resetToSaved = useCallback(() => {
    setAppliedStyles(savedStyles);
    setPendingChanges({});
    setOriginalValues({});

    // Update iframe
    if (iframeRef?.current?.contentWindow) {
      const iframe = iframeRef.current;
      const styleEl = iframe.contentDocument?.getElementById('layout-editor-preview-styles') as HTMLStyleElement | null;

      if (styleEl) {
        const pageStyles = savedStyles[currentPage];
        styleEl.textContent = pageStyles ? generateCSSFromStyles(pageStyles) : '';
      }
    }
  }, [savedStyles, currentPage, iframeRef]);

  const setIframeRef = useCallback((ref: React.RefObject<HTMLIFrameElement | null>) => {
    setIframeRefState(ref);
  }, []);

  return {
    currentPage,
    selectedElement,
    appliedStyles,
    pendingChanges,
    savedStyles,
    iframeRef,
    hasUnsavedChanges,
    hasPendingChanges,
    pendingChangesList,
    setCurrentPage,
    setSelectedElement,
    updateProperty,
    applyChanges,
    saveChanges,
    discardChanges,
    discardSingleChange,
    resetToSaved,
    setIframeRef,
  };
}
