/**
 * Central export module for all Drizzle ORM schema definitions.
 *
 * This file serves as the single entry point for importing database schema definitions
 * and their relationships throughout the application. It exports all table schemas,
 * type definitions, and relationship configurations used for database operations.
 */

// Auth schema tables and relations
export * from './auth-schema';

export * from './restaurant';
export * from './catalog';
export * from './category';
export * from './product';
export * from './modifier';
export * from './offer';
export * from './workstation';

export * from './zone';
export * from './table';
export * from './order';
export * from './check';
export * from './payment';
export * from './printer';
export * from './table-session';
export * from './order-discount';
