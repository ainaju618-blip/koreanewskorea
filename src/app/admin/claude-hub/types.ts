// Claude Hub Types - Extracted for code splitting

export interface Project {
    id: string;
    code: string;
    name: string;
    description?: string;
    path?: string;
    git_email: string;
    git_name: string;
    git_repo?: string;
    vercel_project?: string;
    tech_stack?: string[];
    status: string;
    created_at: string;
}

export interface UsageLog {
    id: string;
    knowledge_id: string;
    used_at: string;
    context: string;
    outcome?: string;
    project_code?: string;
}

export interface KnowledgeEntry {
    id: string;
    scope: string;
    project_code?: string;
    project_codes?: string[];
    topic: string;
    title: string;
    summary: string;
    content?: string;
    tags?: string[];
    source_type?: string;
    created_at: string;
    usage_count?: number;
}

export interface Stats {
    projects: number;
    knowledge: number;
    sessions: number;
    recentKnowledge: KnowledgeEntry[];
    topicCounts: Record<string, number>;
}

export interface NewKnowledge {
    title: string;
    scope: string;
    topic: string;
    summary: string;
    content: string;
    tags: string;
    source_type: string;
    project_codes: string[];
}

export interface NewProject {
    code: string;
    name: string;
    description: string;
    git_email: string;
    git_name: string;
    git_repo: string;
    tech_stack: string;
}

export interface NewUsageLog {
    context: string;
    outcome: string;
    project_code: string;
}

export interface Session {
    id: string;
    project_code?: string;
    session_date: string;
    summary: string;
    tasks_completed: string[];
    decisions_made: string[];
    issues_found: string[];
    knowledge_ids: string[];
    created_at: string;
}

export interface RawContent {
    id: string;
    title: string;
    content: string;
    source_url?: string;
    source_type: string;
    project_code?: string;
    status: 'pending' | 'processed' | 'archived';
    created_at: string;
    processed_at?: string;
}

export interface NewRawContent {
    title: string;
    content: string;
    source_url: string;
    source_type: string;
    project_code: string;
}

export interface NewSession {
    project_code: string;
    summary: string;
    tasks_completed: string;
    decisions_made: string;
    issues_found: string;
    knowledge_ids: string[];
}

export type TabType = 'dashboard' | 'projects' | 'knowledge' | 'sessions' | 'rawContent';
export type ModalType = 'none' | 'addKnowledge' | 'addProject' | 'addUsage' | 'viewUsage' | 'addSession' | 'viewSession' | 'createKnowledgeFromSession' | 'addRawContent' | 'viewRawContent';
