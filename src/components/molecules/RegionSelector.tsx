/**
 * RegionSelector Molecule Component
 * Cascading dropdown for selecting sido + sigungu
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  getAllRegions,
  getRegionByCode,
  Region,
  District,
} from '@/lib/national-regions';

export interface RegionSelectorProps {
  value?: {
    sido?: string;
    sigungu?: string;
  };
  onChange?: (value: { sido: string; sigungu?: string }) => void;
  showNational?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

export default function RegionSelector({
  value,
  onChange,
  showNational = false,
  required = false,
  disabled = false,
  error,
  className,
  variant = 'default',
}: RegionSelectorProps) {
  const regions = useMemo(() => getAllRegions(), []);
  const [selectedSido, setSelectedSido] = useState<string>(value?.sido || '');
  const [selectedSigungu, setSelectedSigungu] = useState<string>(value?.sigungu || '');

  // Get districts for selected sido
  const currentRegion = useMemo(() => {
    if (!selectedSido) return null;
    return getRegionByCode(selectedSido);
  }, [selectedSido]);

  const districts = currentRegion?.districts || [];

  // Sync with external value changes
  useEffect(() => {
    if (value?.sido !== selectedSido) {
      setSelectedSido(value?.sido || '');
    }
    if (value?.sigungu !== selectedSigungu) {
      setSelectedSigungu(value?.sigungu || '');
    }
  }, [value?.sido, value?.sigungu]);

  // Handle sido change
  const handleSidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSido = e.target.value;
    setSelectedSido(newSido);
    setSelectedSigungu(''); // Reset sigungu when sido changes

    if (onChange) {
      onChange({ sido: newSido, sigungu: undefined });
    }
  };

  // Handle sigungu change
  const handleSigunguChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSigungu = e.target.value;
    setSelectedSigungu(newSigungu);

    if (onChange) {
      onChange({ sido: selectedSido, sigungu: newSigungu || undefined });
    }
  };

  const selectBaseClasses = cn(
    'w-full px-3 py-2 rounded-lg border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    disabled
      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
      : 'bg-white text-gray-900 hover:border-gray-400',
    error ? 'border-red-500' : 'border-gray-300'
  );

  // Compact variant (single row)
  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-2', className)}>
        <select
          value={selectedSido}
          onChange={handleSidoChange}
          disabled={disabled}
          required={required}
          className={cn(selectBaseClasses, 'flex-1')}
        >
          <option value="">시/도 선택</option>
          {showNational && <option value="national">전국</option>}
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>

        {selectedSido && selectedSido !== 'national' && districts.length > 0 && (
          <select
            value={selectedSigungu}
            onChange={handleSigunguChange}
            disabled={disabled}
            className={cn(selectBaseClasses, 'flex-1')}
          >
            <option value="">시/군/구 선택</option>
            {districts
              .filter((d) => d.isPrimary !== false)
              .map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name}
                </option>
              ))}
          </select>
        )}
      </div>
    );
  }

  // Inline variant (horizontal labels)
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-4 flex-wrap', className)}>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            시/도
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={selectedSido}
            onChange={handleSidoChange}
            disabled={disabled}
            required={required}
            className={cn(selectBaseClasses, 'w-40')}
          >
            <option value="">선택</option>
            {showNational && <option value="national">전국</option>}
            {regions.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSido && selectedSido !== 'national' && districts.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              시/군/구
            </label>
            <select
              value={selectedSigungu}
              onChange={handleSigunguChange}
              disabled={disabled}
              className={cn(selectBaseClasses, 'w-40')}
            >
              <option value="">전체</option>
              {districts
                .filter((d) => d.isPrimary !== false)
                .map((district) => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  // Default variant (stacked)
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          시/도
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          value={selectedSido}
          onChange={handleSidoChange}
          disabled={disabled}
          required={required}
          className={selectBaseClasses}
        >
          <option value="">시/도를 선택하세요</option>
          {showNational && (
            <option value="national">🇰🇷 전국 (정부/부처)</option>
          )}
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSido && selectedSido !== 'national' && districts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            시/군/구
          </label>
          <select
            value={selectedSigungu}
            onChange={handleSigunguChange}
            disabled={disabled}
            className={selectBaseClasses}
          >
            <option value="">시/군/구를 선택하세요 (선택사항)</option>
            {districts
              .filter((d) => d.isPrimary !== false)
              .map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name}
                  {district.mergedWith && ` (${district.mergedWith} 통합)`}
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            * 선택하지 않으면 {currentRegion?.name} 전체에 표시됩니다
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
