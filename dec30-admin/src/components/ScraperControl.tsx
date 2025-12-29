'use client';

import { useState, useEffect } from 'react';

interface Region {
  id: string;
  name: string;
  nameKo: string;
}

interface ScraperControlProps {
  onLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
}

export default function ScraperControl({ onLog }: ScraperControlProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const res = await fetch('/api/scraper');
      const data = await res.json();
      setRegions(data.regions || []);
    } catch (error) {
      onLog('Failed to fetch regions', 'error');
    }
  };

  const toggleRegion = (regionId: string) => {
    const newSelected = new Set(selectedRegions);
    if (newSelected.has(regionId)) {
      newSelected.delete(regionId);
    } else {
      newSelected.add(regionId);
    }
    setSelectedRegions(newSelected);
  };

  const selectAll = () => {
    setSelectedRegions(new Set(regions.map(r => r.id)));
  };

  const selectNone = () => {
    setSelectedRegions(new Set());
  };

  const runScraper = async () => {
    if (selectedRegions.size === 0) {
      onLog('Please select at least one region', 'warning');
      return;
    }

    setIsRunning(true);
    setProgress({ current: 0, total: selectedRegions.size });
    onLog(`Starting scraping for ${selectedRegions.size} regions...`, 'info');

    try {
      const res = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regions: Array.from(selectedRegions) })
      });

      const data = await res.json();

      if (data.success) {
        onLog(`Completed: ${data.processed}/${data.total} regions successful`, 'success');

        data.results?.forEach((result: { region: string; success: boolean; message: string }) => {
          const region = regions.find(r => r.id === result.region);
          const name = region?.nameKo || result.region;
          if (result.success) {
            onLog(`  ${name}: OK`, 'success');
          } else {
            onLog(`  ${name}: Failed - ${result.message}`, 'error');
          }
        });
      } else {
        onLog(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      onLog(`Request failed: ${error}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Manual Scraping</h2>

      <div className="flex gap-2 mb-4">
        <button onClick={selectAll} className="btn-secondary text-sm">
          Select All
        </button>
        <button onClick={selectNone} className="btn-secondary text-sm">
          Deselect All
        </button>
        <span className="text-gray-400 ml-auto">
          Selected: {selectedRegions.size} / {regions.length}
        </span>
      </div>

      <div className="checkbox-grid mb-4">
        {regions.map(region => (
          <label key={region.id} className="checkbox-item cursor-pointer hover:bg-gray-800 rounded">
            <input
              type="checkbox"
              checked={selectedRegions.has(region.id)}
              onChange={() => toggleRegion(region.id)}
              disabled={isRunning}
            />
            <span>{region.nameKo}</span>
          </label>
        ))}
      </div>

      <button
        onClick={runScraper}
        disabled={isRunning || selectedRegions.size === 0}
        className="btn-primary w-full"
      >
        {isRunning ? 'Running...' : `Run Scraper (${selectedRegions.size} regions)`}
      </button>
    </div>
  );
}
