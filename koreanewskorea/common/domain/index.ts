/**
 * Domain Layer - Barrel Export
 * 
 * The domain layer contains:
 * - Entities: Core types and interfaces (Article, Region)
 * - Use Cases: Pure business logic (SmartFill algorithm)
 * 
 * This layer has NO external dependencies (no DB, no API)
 */

export * from './entities';
export * from './usecases';
