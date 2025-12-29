'use client';

// Region Selector Component
// Dropdown for selecting user's region

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { REGIONS, getRegionsByType, RegionCode } from '@/lib/location';

interface RegionSelectorProps {
    value: RegionCode;
    onChange: (code: RegionCode) => void;
    isLoading?: boolean;
}

export default function RegionSelector({ value, onChange, isLoading }: RegionSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const grouped = getRegionsByType();

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleSelect = (code: RegionCode) => {
        onChange(code);
        setIsOpen(false);
    };

    const currentRegionName = REGIONS[value]?.name || value;

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-md
          text-sm font-medium text-slate-700
          bg-slate-100 hover:bg-slate-200
          border border-slate-200
          transition-colors duration-150
          ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
                aria-label="Select region"
                aria-expanded={isOpen}
            >
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="max-w-[100px] truncate">{currentRegionName}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-80 overflow-y-auto">
                    {/* Metro */}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">
                        Metropolitan
                    </div>
                    {grouped.metro.map((code) => (
                        <button
                            key={code}
                            onClick={() => handleSelect(code)}
                            className={`
                w-full text-left px-3 py-2 text-sm
                hover:bg-slate-50 transition-colors
                ${value === code ? 'bg-red-50 text-red-700 font-medium' : 'text-slate-700'}
              `}
                        >
                            {REGIONS[code as RegionCode].name}
                        </button>
                    ))}

                    {/* Cities */}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-t border-b border-slate-100">
                        Cities
                    </div>
                    {grouped.city.map((code) => (
                        <button
                            key={code}
                            onClick={() => handleSelect(code)}
                            className={`
                w-full text-left px-3 py-2 text-sm
                hover:bg-slate-50 transition-colors
                ${value === code ? 'bg-red-50 text-red-700 font-medium' : 'text-slate-700'}
              `}
                        >
                            {REGIONS[code as RegionCode].name}
                        </button>
                    ))}

                    {/* Counties */}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-t border-b border-slate-100">
                        Counties
                    </div>
                    {grouped.county
                        .sort((a, b) => REGIONS[a as RegionCode].name.localeCompare(REGIONS[b as RegionCode].name, 'ko'))
                        .map((code) => (
                            <button
                                key={code}
                                onClick={() => handleSelect(code)}
                                className={`
                  w-full text-left px-3 py-2 text-sm
                  hover:bg-slate-50 transition-colors
                  ${value === code ? 'bg-red-50 text-red-700 font-medium' : 'text-slate-700'}
                `}
                            >
                                {REGIONS[code as RegionCode].name}
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
