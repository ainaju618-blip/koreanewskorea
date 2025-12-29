'use client';

interface LogEntry {
  time: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  title?: string;
}

export default function LogViewer({ logs, title = 'Execution Log' }: LogViewerProps) {
  const getLevelClass = (level: string) => {
    switch (level) {
      case 'success': return 'log-success';
      case 'error': return 'log-error';
      case 'warning': return 'text-yellow-500';
      default: return 'log-info';
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="log-viewer">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No logs yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="log-entry">
              <span className="log-time">[{log.time}]</span>
              <span className={getLevelClass(log.level)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
