'use client';

import { useState, useEffect } from 'react';

interface AIProcessControlProps {
  onLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
}

export default function AIProcessControl({ onLog }: AIProcessControlProps) {
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'running' | 'stopped'>('checking');
  const [model, setModel] = useState('qwen3:14b');
  const [limit, setLimit] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    checkOllamaStatus();
    const interval = setInterval(checkOllamaStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const res = await fetch('/api/ai-process');
      const data = await res.json();
      setOllamaStatus(data.ollamaStatus === 'running' ? 'running' : 'stopped');
      setModel(data.model || 'qwen3:14b');
    } catch {
      setOllamaStatus('stopped');
    }
  };

  const runAIProcess = async () => {
    if (ollamaStatus !== 'running') {
      onLog('Ollama is not running. Please start Ollama first.', 'error');
      return;
    }

    setIsRunning(true);
    setProgress({ current: 0, total: limit });
    onLog(`Starting AI processing (limit: ${limit})...`, 'info');

    try {
      const res = await fetch('/api/ai-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit })
      });

      const data = await res.json();

      if (data.success) {
        onLog(`AI Processing complete: ${data.processed || 0} articles processed`, 'success');

        if (data.logs) {
          data.logs.forEach((log: string) => {
            if (log.includes('[ERROR]') || log.includes('error')) {
              onLog(log, 'error');
            } else if (log.includes('[SUCCESS]') || log.includes('Completed')) {
              onLog(log, 'success');
            } else {
              onLog(log, 'info');
            }
          });
        }
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
      <h2 className="text-xl font-bold mb-4">AI Processing</h2>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Ollama:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            ollamaStatus === 'running' ? 'bg-green-900 text-green-300' :
            ollamaStatus === 'stopped' ? 'bg-red-900 text-red-300' :
            'bg-gray-700 text-gray-300'
          }`}>
            {ollamaStatus === 'checking' ? 'Checking...' :
             ollamaStatus === 'running' ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Model:</span>
          <span className="text-blue-400">{model}</span>
        </div>
        <button
          onClick={checkOllamaStatus}
          className="btn-secondary text-sm ml-auto"
        >
          Refresh Status
        </button>
      </div>

      {ollamaStatus === 'stopped' && (
        <div className="bg-red-900/30 border border-red-700 rounded p-3 mb-4">
          <p className="text-red-300 text-sm">
            Ollama is not running. Start Ollama first:
          </p>
          <code className="text-xs text-gray-400 block mt-1">
            ollama serve
          </code>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2">
          <span className="text-gray-400">Process count:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            disabled={isRunning}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      {isRunning && progress.total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progress.current}/{progress.total}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={runAIProcess}
        disabled={isRunning || ollamaStatus !== 'running'}
        className="btn-primary w-full"
      >
        {isRunning ? 'Processing...' : `Run AI Processing (${limit} articles)`}
      </button>
    </div>
  );
}
