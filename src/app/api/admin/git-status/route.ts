import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Project root directory
const PROJECT_ROOT = process.cwd();

interface GitSummary {
    currentBranch: string;
    totalCommits: number;
    changedFiles: number;
    uncommittedChanges: number;
    branchCount: number;
    lastCommit: {
        hash: string;
        date: string;
        author: string;
        message: string;
    } | null;
    lastActivity: string;
}

interface GitCommit {
    hash: string;
    date: string;
    author: string;
    message: string;
    filesChanged: number;
    status: 'success' | 'merge' | 'revert' | 'normal';
}

interface GitFileStatus {
    filename: string;
    status: string;
    statusKo: string;
    additions: number;
    deletions: number;
}

async function runGitCommand(command: string): Promise<string> {
    try {
        const { stdout } = await execAsync(command, {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        return stdout.trim();
    } catch (error: any) {
        console.error(`Git command failed: ${command}`, error);
        return '';
    }
}

// GET: Fetch git status based on tab type
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'summary';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const hash = searchParams.get('hash');

    try {
        switch (tab) {
            case 'summary':
                return NextResponse.json(await getSummary());
            case 'commits':
                return NextResponse.json(await getRecentCommits(page, limit));
            case 'status':
                return NextResponse.json(await getCurrentStatus());
            case 'commit-detail':
                if (!hash) {
                    return NextResponse.json({ error: 'Hash is required' }, { status: 400 });
                }
                return NextResponse.json(await getCommitDetail(hash));
            default:
                return NextResponse.json({ error: 'Invalid tab type' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Git status error:', error);
        return NextResponse.json({
            error: 'Git status check failed',
            message: error.message
        }, { status: 500 });
    }
}

async function getSummary(): Promise<{ data: GitSummary; error: string | null }> {
    try {
        // Run all commands in parallel
        const [
            currentBranch,
            totalCommits,
            statusOutput,
            branchList,
            lastCommitInfo
        ] = await Promise.all([
            runGitCommand('git branch --show-current'),
            runGitCommand('git rev-list --count HEAD'),
            runGitCommand('git status --porcelain'),
            runGitCommand('git branch --list'),
            runGitCommand('git log -1 --pretty=format:"%h|%ad|%an|%s" --date=format:"%Y-%m-%d %H:%M"')
        ]);

        // Parse status output
        const statusLines = statusOutput.split('\n').filter(Boolean);
        const changedFiles = statusLines.length;
        const uncommittedChanges = statusLines.filter(line =>
            line.startsWith(' M') || line.startsWith('M ') || line.startsWith('??') ||
            line.startsWith('A ') || line.startsWith('D ')
        ).length;

        // Parse branch count
        const branches = branchList.split('\n').filter(Boolean);
        const branchCount = branches.length;

        // Parse last commit
        let lastCommit = null;
        if (lastCommitInfo) {
            const [hash, date, author, message] = lastCommitInfo.split('|');
            lastCommit = { hash, date, author, message };
        }

        // Calculate last activity
        const lastActivityOutput = await runGitCommand('git log -1 --pretty=format:"%ar"');
        const lastActivity = lastActivityOutput || 'Unknown';

        return {
            data: {
                currentBranch: currentBranch || 'Unknown',
                totalCommits: parseInt(totalCommits) || 0,
                changedFiles,
                uncommittedChanges,
                branchCount,
                lastCommit,
                lastActivity
            },
            error: null
        };
    } catch (error: any) {
        return {
            data: {
                currentBranch: 'Error',
                totalCommits: 0,
                changedFiles: 0,
                uncommittedChanges: 0,
                branchCount: 0,
                lastCommit: null,
                lastActivity: 'Error'
            },
            error: error.message
        };
    }
}

async function getRecentCommits(page: number = 1, limit: number = 30): Promise<{
    data: GitCommit[];
    totalCount: number;
    page: number;
    totalPages: number;
    error: string | null
}> {
    try {
        // Get total commit count
        const totalCountOutput = await runGitCommand('git rev-list --count HEAD');
        const totalCount = parseInt(totalCountOutput) || 0;
        const totalPages = Math.ceil(totalCount / limit);

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Get commits with pagination
        const logOutput = await runGitCommand(
            `git log --skip=${skip} -${limit} --pretty=format:"%h|%ad|%an|%s" --date=format:"%Y-%m-%d %H:%M"`
        );

        if (!logOutput) {
            return { data: [], totalCount, page, totalPages, error: null };
        }

        const commits: GitCommit[] = [];
        const lines = logOutput.split('\n').filter(Boolean);

        for (const line of lines) {
            const [hash, date, author, message] = line.split('|');

            // Get files changed count for this commit (Windows compatible)
            const filesChangedOutput = await runGitCommand(
                `git diff-tree --no-commit-id --name-only -r ${hash}`
            );
            const filesChanged = filesChangedOutput ? filesChangedOutput.split('\n').filter(Boolean).length : 0;

            // Determine commit status based on message
            let status: 'success' | 'merge' | 'revert' | 'normal' = 'normal';
            const msgLower = message?.toLowerCase() || '';
            if (msgLower.includes('merge')) {
                status = 'merge';
            } else if (msgLower.includes('revert')) {
                status = 'revert';
            } else if (msgLower.includes('fix') || msgLower.includes('feat') || msgLower.includes('add')) {
                status = 'success';
            }

            commits.push({
                hash: hash || '',
                date: date || '',
                author: author || '',
                message: message || '',
                filesChanged,
                status
            });
        }

        return { data: commits, totalCount, page, totalPages, error: null };
    } catch (error: any) {
        return { data: [], totalCount: 0, page: 1, totalPages: 0, error: error.message };
    }
}

// Get detailed info for a specific commit
async function getCommitDetail(hash: string): Promise<{ data: any; error: string | null }> {
    try {
        // Get commit info
        const [commitInfo, diffStat, diffContent, parentHashes] = await Promise.all([
            runGitCommand(`git log -1 --pretty=format:"%H|%h|%ad|%an|%ae|%s|%b" --date=format:"%Y-%m-%d %H:%M:%S" ${hash}`),
            runGitCommand(`git diff-tree --no-commit-id --numstat -r ${hash}`),
            runGitCommand(`git diff-tree --no-commit-id -p ${hash}`),
            runGitCommand(`git log -1 --pretty=format:"%P" ${hash}`)
        ]);

        if (!commitInfo) {
            return { data: null, error: 'Commit not found' };
        }

        const parts = commitInfo.split('|');
        const fullHash = parts[0] || '';
        const shortHash = parts[1] || '';
        const date = parts[2] || '';
        const author = parts[3] || '';
        const email = parts[4] || '';
        const subject = parts[5] || '';
        const body = parts.slice(6).join('|') || '';

        // Parse file changes
        const fileChanges: Array<{
            filename: string;
            additions: number;
            deletions: number;
            binary: boolean;
        }> = [];

        if (diffStat) {
            const statLines = diffStat.split('\n').filter(Boolean);
            for (const line of statLines) {
                const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
                if (match) {
                    const isBinary = match[1] === '-' || match[2] === '-';
                    fileChanges.push({
                        filename: match[3],
                        additions: isBinary ? 0 : parseInt(match[1]) || 0,
                        deletions: isBinary ? 0 : parseInt(match[2]) || 0,
                        binary: isBinary
                    });
                }
            }
        }

        // Calculate totals
        const totalAdditions = fileChanges.reduce((sum, f) => sum + f.additions, 0);
        const totalDeletions = fileChanges.reduce((sum, f) => sum + f.deletions, 0);

        return {
            data: {
                hash: fullHash,
                shortHash,
                date,
                author,
                email,
                subject,
                body: body.trim(),
                parents: parentHashes ? parentHashes.split(' ').filter(Boolean) : [],
                fileChanges,
                totalAdditions,
                totalDeletions,
                totalFiles: fileChanges.length,
                diff: diffContent
            },
            error: null
        };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

async function getCurrentStatus(): Promise<{ data: GitFileStatus[]; error: string | null }> {
    try {
        // Get porcelain status
        const statusOutput = await runGitCommand('git status --porcelain');

        if (!statusOutput) {
            return { data: [], error: null };
        }

        const files: GitFileStatus[] = [];
        const lines = statusOutput.split('\n').filter(Boolean);

        for (const line of lines) {
            const statusCode = line.substring(0, 2);
            const filename = line.substring(3);

            // Get diff stat for modified files
            let additions = 0;
            let deletions = 0;

            if (statusCode.includes('M')) {
                try {
                    const diffOutput = await runGitCommand(`git diff --numstat "${filename}"`);
                    if (diffOutput) {
                        const parts = diffOutput.split('\t');
                        additions = parseInt(parts[0]) || 0;
                        deletions = parseInt(parts[1]) || 0;
                    }
                } catch {
                    // Ignore diff errors
                }
            } else if (statusCode === '??') {
                // For new untracked files, count lines using Node.js fs
                try {
                    const fs = await import('fs/promises');
                    const filePath = path.join(PROJECT_ROOT, filename);
                    const content = await fs.readFile(filePath, 'utf8');
                    additions = content.split('\n').length;
                } catch {
                    additions = 0;
                }
            }

            // Map status codes to descriptions
            const statusMap: Record<string, { status: string; statusKo: string }> = {
                '??': { status: 'untracked', statusKo: 'Untracked (new file)' },
                'A ': { status: 'added', statusKo: 'Staged (new)' },
                'M ': { status: 'modified-staged', statusKo: 'Staged (modified)' },
                ' M': { status: 'modified', statusKo: 'Modified' },
                'MM': { status: 'modified-both', statusKo: 'Modified (staged + unstaged)' },
                'D ': { status: 'deleted-staged', statusKo: 'Staged (deleted)' },
                ' D': { status: 'deleted', statusKo: 'Deleted' },
                'R ': { status: 'renamed', statusKo: 'Renamed' },
                'C ': { status: 'copied', statusKo: 'Copied' },
                'UU': { status: 'conflict', statusKo: 'Conflict' },
            };

            const statusInfo = statusMap[statusCode] || { status: 'unknown', statusKo: 'Unknown' };

            files.push({
                filename,
                status: statusInfo.status,
                statusKo: statusInfo.statusKo,
                additions,
                deletions
            });
        }

        return { data: files, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}
