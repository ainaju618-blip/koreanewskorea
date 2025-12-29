import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Check Ollama status
async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const ollamaRunning = await checkOllamaStatus();

  return NextResponse.json({
    ollamaStatus: ollamaRunning ? 'running' : 'stopped',
    model: 'qwen3:14b'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limit = 10, articleIds } = body as { limit?: number; articleIds?: string[] };

    // Check Ollama first
    const ollamaRunning = await checkOllamaStatus();
    if (!ollamaRunning) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ollama is not running. Please start Ollama first.',
          ollamaStatus: 'stopped'
        },
        { status: 503 }
      );
    }

    // Build command
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'ai_only_processor.py');
    let command = `python "${scriptPath}"`;

    if (articleIds && articleIds.length > 0) {
      command += ` --article-ids "${articleIds.join(',')}"`;
    } else {
      command += ` --limit ${limit}`;
    }

    // Execute with longer timeout for AI processing
    const { stdout, stderr } = await execAsync(command, {
      timeout: 600000, // 10 minutes
      cwd: process.cwd(),
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8'
      }
    });

    // Parse result from stdout
    let result;
    try {
      // Find JSON in output
      const jsonMatch = stdout.match(/RESULT:\s*({[\s\S]*})/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        result = {
          success: true,
          output: stdout,
          logs: stdout.split('\n').filter(Boolean)
        };
      }
    } catch {
      result = {
        success: true,
        output: stdout,
        logs: stdout.split('\n').filter(Boolean)
      };
    }

    if (stderr && !stderr.includes('UserWarning')) {
      result.warnings = stderr;
    }

    return NextResponse.json(result);

  } catch (error) {
    const err = error as Error & { stderr?: string; killed?: boolean };

    if (err.killed) {
      return NextResponse.json(
        { success: false, error: 'Processing timeout (10 min limit)' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: err.stderr || err.message },
      { status: 500 }
    );
  }
}
