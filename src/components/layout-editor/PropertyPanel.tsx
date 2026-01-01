'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { ElementInfo, EDITABLE_PROPERTIES, PendingChange, PropertyDef, SECTION_LABELS } from '@/lib/layout-editor/types';

interface PropertyPanelProps {
  selectedElement: ElementInfo | null;
  pendingChanges: PendingChange[];
  onPropertyChange: (selector: string, property: string, value: string, oldValue: string) => void;
  onDiscardChange: (selector: string, property: string) => void;
}

export default function PropertyPanel({
  selectedElement,
  pendingChanges,
  onPropertyChange,
  onDiscardChange,
}: PropertyPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'layout',
    'typography',
    'background',
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleValueChange = (property: string, newValue: string) => {
    if (!selectedElement) return;
    const oldValue = selectedElement.computedStyles[property] || '';
    onPropertyChange(selectedElement.selector, property, newValue, oldValue);
  };

  // Get pending value for a property
  const getPendingValue = (property: string): string | undefined => {
    if (!selectedElement) return undefined;
    const pending = pendingChanges.find(
      c => c.selector === selectedElement.selector && c.property === property
    );
    return pending?.newValue;
  };

  // Check if property has pending change
  const hasPendingChange = (property: string): boolean => {
    if (!selectedElement) return false;
    return pendingChanges.some(
      c => c.selector === selectedElement.selector && c.property === property
    );
  };

  if (!selectedElement) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-[#21262d] rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">👆</span>
        </div>
        <h3 className="text-[#e6edf3] font-medium mb-2">선택된 요소 없음</h3>
        <p className="text-sm text-[#8b949e]">
          프리뷰에서 요소를 클릭하여 스타일을 편집하세요
        </p>
      </div>
    );
  }

  const renderPropertyInput = (prop: PropertyDef) => {
    const currentValue = getPendingValue(prop.key) ?? selectedElement.computedStyles[prop.key] ?? '';
    const isPending = hasPendingChange(prop.key);

    const inputClass = `w-full px-2 py-1.5 bg-[#0d1117] border rounded text-sm text-[#e6edf3] focus:ring-2 focus:ring-blue-500 focus:outline-none ${
      isPending ? 'border-yellow-500' : 'border-[#30363d]'
    }`;

    switch (prop.type) {
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={e => handleValueChange(prop.key, e.target.value)}
            className={inputClass}
          >
            <option value="">--</option>
            {prop.options?.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'color':
        return (
          <div className="flex gap-2">
            <input
              type="color"
              value={rgbToHex(currentValue)}
              onChange={e => handleValueChange(prop.key, e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-[#30363d]"
            />
            <input
              type="text"
              value={currentValue}
              onChange={e => handleValueChange(prop.key, e.target.value)}
              className={`flex-1 ${inputClass}`}
              placeholder="#000000"
            />
          </div>
        );

      case 'range':
        return (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={prop.min ?? 0}
              max={prop.max ?? 1}
              step={prop.step ?? 0.1}
              value={parseFloat(currentValue) || 0}
              onChange={e => handleValueChange(prop.key, e.target.value)}
              className="flex-1"
            />
            <span className="text-xs text-[#8b949e] w-12 text-right">
              {currentValue}
            </span>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={e => handleValueChange(prop.key, e.target.value)}
            className={inputClass}
            placeholder={prop.label}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Element Info Header */}
      <div className="p-4 border-b border-[#30363d] bg-[#21262d]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[#8b949e] uppercase">선택된 요소</span>
        </div>
        <code className="block text-sm text-blue-400 bg-[#0d1117] px-3 py-2 rounded-lg break-all">
          {selectedElement.selector}
        </code>
        <div className="mt-2 text-xs text-[#8b949e]">
          <span className="text-[#e6edf3]">{selectedElement.tagName}</span>
          {selectedElement.id && (
            <span className="ml-2">#{selectedElement.id}</span>
          )}
          {selectedElement.className && (
            <span className="ml-2 truncate block">.{selectedElement.className.split(' ')[0]}</span>
          )}
        </div>
      </div>

      {/* Pending Changes Notice */}
      {pendingChanges.length > 0 && (
        <div className="px-4 py-3 bg-yellow-900/20 border-b border-yellow-800/50">
          <div className="flex items-center justify-between text-yellow-400 text-sm mb-2">
            <span className="font-medium">대기 중인 변경: {pendingChanges.length}건</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {pendingChanges.map((change, i) => (
              <div
                key={`${change.selector}-${change.property}-${i}`}
                className="flex items-center justify-between text-xs bg-[#0d1117] rounded px-2 py-1"
              >
                <div className="flex-1 truncate">
                  <span className="text-[#8b949e]">{change.property}:</span>{' '}
                  <span className="text-yellow-400">{change.newValue}</span>
                </div>
                <button
                  onClick={() => onDiscardChange(change.selector, change.property)}
                  className="ml-2 p-0.5 text-[#8b949e] hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Property Sections */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(EDITABLE_PROPERTIES).map(([section, properties]) => (
          <div key={section} className="border-b border-[#30363d]">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[#e6edf3] hover:bg-[#21262d] transition"
            >
              <span>{SECTION_LABELS[section] || section}</span>
              {expandedSections.includes(section) ? (
                <ChevronDown className="w-4 h-4 text-[#8b949e]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#8b949e]" />
              )}
            </button>

            {/* Properties */}
            {expandedSections.includes(section) && (
              <div className="px-4 pb-4 space-y-3">
                {properties.map(prop => (
                  <div key={prop.key}>
                    <label className="flex items-center gap-2 text-xs text-[#8b949e] mb-1">
                      {prop.label}
                      {hasPendingChange(prop.key) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      )}
                    </label>
                    {renderPropertyInput(prop)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dimensions Display */}
      <div className="p-4 border-t border-[#30363d] bg-[#21262d]">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[#8b949e]">너비:</span>{' '}
            <span className="text-[#e6edf3]">{Math.round(selectedElement.boundingRect.width)}px</span>
          </div>
          <div>
            <span className="text-[#8b949e]">높이:</span>{' '}
            <span className="text-[#e6edf3]">{Math.round(selectedElement.boundingRect.height)}px</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to convert rgb to hex
function rgbToHex(rgb: string): string {
  if (rgb.startsWith('#')) return rgb;
  if (rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';

  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';

  const [, r, g, b] = match;
  return `#${[r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}`;
}
