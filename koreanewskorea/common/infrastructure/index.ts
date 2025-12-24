/**
 * Infrastructure Layer - Barrel Export
 * 
 * The infrastructure layer contains:
 * - Supabase: Database client
 * - Repositories: Data access layer (ArticleRepository, RegionRepository)
 * 
 * This layer handles all external dependencies (DB, API, etc.)
 */

export * from './supabase';
export * from './repositories';
