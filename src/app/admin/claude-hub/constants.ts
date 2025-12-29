import { Globe, Layers, Box } from 'lucide-react';
import React from 'react';

// Scope labels and icons
export const SCOPE_LABELS: Record<string, string> = {
    global: '(Global)',
    stack: '(Stack)',
    project: '(Project)'
};

export const SCOPE_ICONS: Record<string, React.ReactNode> = {
    global: React.createElement(Globe, { className: "w-4 h-4" }),
    stack: React.createElement(Layers, { className: "w-4 h-4" }),
    project: React.createElement(Box, { className: "w-4 h-4" })
};

// Topic labels
export const TOPIC_LABELS: Record<string, string> = {
    prompting: 'Prompting',
    development: 'Development',
    troubleshooting: 'Troubleshooting',
    workflow: 'Workflow',
    reference: 'Reference',
    general: 'General'
};

// Source types
export const SOURCE_TYPES = [
    { value: 'manual', label: 'Manual Input' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'document', label: 'Document' },
    { value: 'article', label: 'Article/Blog' },
    { value: 'code', label: 'Code' },
    { value: 'session', label: 'Session Log' },
    { value: 'other', label: 'Other' }
];

// Initial form states
export const INITIAL_KNOWLEDGE: {
    title: string;
    scope: string;
    topic: string;
    summary: string;
    content: string;
    tags: string;
    source_type: string;
    project_codes: string[];
} = {
    title: '',
    scope: 'global',
    topic: 'general',
    summary: '',
    content: '',
    tags: '',
    source_type: 'manual',
    project_codes: []
};

export const INITIAL_PROJECT = {
    code: '',
    name: '',
    description: '',
    git_email: '',
    git_name: '',
    git_repo: '',
    tech_stack: ''
};

export const INITIAL_USAGE_LOG = {
    context: '',
    outcome: '',
    project_code: ''
};

export const INITIAL_SESSION = {
    project_code: '',
    summary: '',
    tasks_completed: '',
    decisions_made: '',
    issues_found: '',
    knowledge_ids: [] as string[]
};

export const INITIAL_RAW_CONTENT = {
    title: '',
    content: '',
    source_url: '',
    source_type: 'manual',
    project_code: ''
};
