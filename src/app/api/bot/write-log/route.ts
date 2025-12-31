import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Log file path: logs/dec30_YYYY-MM-DD.log
function getLogFilePath(): string {
  const logsDir = path.join(process.cwd(), 'logs');

  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const today = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `dec30_${today}.log`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, level, message, timestamp } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const logFilePath = getLogFilePath();

    // Format: [TIMESTAMP] [SOURCE] LEVEL: MESSAGE
    const logLine = `[${timestamp || new Date().toISOString()}] [${source || 'unknown'}] ${(level || 'INFO').toUpperCase()}: ${message}\n`;

    // Append to log file
    fs.appendFileSync(logFilePath, logLine, 'utf-8');

    return NextResponse.json({ success: true, file: logFilePath });
  } catch (error) {
    console.error('[write-log] Error:', error);
    return NextResponse.json(
      { error: 'Failed to write log', details: String(error) },
      { status: 500 }
    );
  }
}
