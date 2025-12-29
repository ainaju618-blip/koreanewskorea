/**
 * Korea NEWS - Permission System
 * RBAC (Role-Based Access Control) utilities
 */

// Role hierarchy levels
export const ROLE_LEVELS = {
    super_admin: 100,
    admin: 80,
    editor: 60,
    reporter: 40,
    contributor: 20,
} as const;

export type Role = keyof typeof ROLE_LEVELS;

// Permission constants
export const PERMISSIONS = {
    // Article
    ARTICLE_VIEW: 'article:view',
    ARTICLE_CREATE: 'article:create',
    ARTICLE_EDIT_OWN: 'article:edit:own',
    ARTICLE_EDIT_ALL: 'article:edit:all',
    ARTICLE_DELETE: 'article:delete',
    ARTICLE_PUBLISH: 'article:publish',
    ARTICLE_FOCUS: 'article:focus',

    // Bot
    BOT_LOG_VIEW: 'bot:log:view',
    BOT_RUN: 'bot:run',
    BOT_SCHEDULE: 'bot:schedule',
    BOT_SOURCE: 'bot:source',

    // User
    USER_VIEW: 'user:view',
    USER_MANAGE: 'user:manage',
    USER_DELETE: 'user:delete',
    USER_ROLE: 'user:role',

    // System
    SYSTEM_SETTINGS: 'system:settings',
    SYSTEM_API_KEYS: 'system:api_keys',
    SYSTEM_LAYOUT: 'system:layout',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permission mapping
const ROLE_PERMISSIONS: Record<Role, string[]> = {
    super_admin: ['*'], // All permissions
    admin: [
        'article:*',
        'bot:*',
        'user:view',
        'user:manage',
        'system:settings',
        'system:layout',
    ],
    editor: [
        'article:*',
        'bot:log:view',
        'user:view',
    ],
    reporter: [
        'article:view',
        'article:create',
        'article:edit:own',
        'bot:log:view',
    ],
    contributor: [
        'article:view',
        'article:create',
    ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(userRole: string | null | undefined, permission: string): boolean {
    if (!userRole) return false;

    const role = userRole as Role;
    const permissions = ROLE_PERMISSIONS[role];

    if (!permissions) return false;

    // Wildcard check - all permissions
    if (permissions.includes('*')) return true;

    // Direct match
    if (permissions.includes(permission)) return true;

    // Category wildcard check (e.g., article:* matches article:view)
    const [category] = permission.split(':');
    if (permissions.includes(`${category}:*`)) return true;

    return false;
}

/**
 * Check if a role has at least a certain access level
 */
export function hasMinAccessLevel(userRole: string | null | undefined, minLevel: number): boolean {
    if (!userRole) return false;

    const role = userRole as Role;
    const level = ROLE_LEVELS[role];

    return level !== undefined && level >= minLevel;
}

/**
 * Check if a role can manage another role
 * (Higher level can manage lower level)
 */
export function canManageRole(managerRole: string | null | undefined, targetRole: string): boolean {
    if (!managerRole) return false;

    const managerLevel = ROLE_LEVELS[managerRole as Role];
    const targetLevel = ROLE_LEVELS[targetRole as Role];

    if (managerLevel === undefined || targetLevel === undefined) return false;

    // Only higher level can manage lower level
    return managerLevel > targetLevel;
}

/**
 * Check if user can edit a specific article
 */
export function canEditArticle(
    userRole: string | null | undefined,
    userId: string | null | undefined,
    articleAuthorId: string | null | undefined
): boolean {
    if (!userRole) return false;

    // Can edit all articles
    if (hasPermission(userRole, PERMISSIONS.ARTICLE_EDIT_ALL)) {
        return true;
    }

    // Can edit own articles only
    if (hasPermission(userRole, PERMISSIONS.ARTICLE_EDIT_OWN)) {
        return userId === articleAuthorId;
    }

    return false;
}

/**
 * Get role display name in Korean
 */
export function getRoleDisplayName(role: string): string {
    const names: Record<string, string> = {
        super_admin: 'Super Admin',
        admin: 'Admin',
        editor: 'Editor',
        reporter: 'Reporter',
        contributor: 'Contributor',
    };
    return names[role] || role;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role as Role] || [];
}

/**
 * Check if role can approve/publish articles
 */
export function canPublishArticle(userRole: string | null | undefined): boolean {
    return hasPermission(userRole, PERMISSIONS.ARTICLE_PUBLISH);
}

/**
 * Check if role can run bot
 */
export function canRunBot(userRole: string | null | undefined): boolean {
    return hasPermission(userRole, PERMISSIONS.BOT_RUN);
}

/**
 * Check if role can manage users
 */
export function canManageUsers(userRole: string | null | undefined): boolean {
    return hasPermission(userRole, PERMISSIONS.USER_MANAGE);
}

/**
 * Check if user is a "global" role (can be assigned to any region's articles)
 * Editor and above are considered global
 */
export function isGlobalRole(userRole: string | null | undefined): boolean {
    return hasMinAccessLevel(userRole, ROLE_LEVELS.editor);
}
