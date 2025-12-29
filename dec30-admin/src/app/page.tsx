'use client';

import { useState, useCallback } from 'react';
import ScraperControl from '@/components/ScraperControl';
import AIProcessControl from '@/components/AIProcessControl';
import LogViewer from '@/components/LogViewer';

interface LogEntry {
  time: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const time = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    setLogs(prev => [...prev, { time, level, message }]);
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">12월30일버젼</h1>
          <p className="text-gray-400">Manual Scraping & AI Processing Control Panel</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Scraper Control */}
          <ScraperControl onLog={addLog} />

          {/* AI Process Control */}
          <AIProcessControl onLog={addLog} />
        </div>

        {/* Log Viewer */}
        <div className="relative">
          <button
            onClick={clearLogs}
            className="absolute top-4 right-4 btn-secondary text-sm z-10"
          >
            Clear Logs
          </button>
          <LogViewer logs={logs} title="Execution Log" />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Korea NEWS Bot Control Panel</p>
          <p className="mt-1">
            Scrapers: <code className="text-gray-400">scrapers/</code> |
            AI Processor: <code className="text-gray-400">dec30-admin/scripts/ai_only_processor.py</code>
          </p>
        </div>
      </div>
    </main>
  );
}
