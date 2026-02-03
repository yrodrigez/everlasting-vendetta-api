/**
 * Domain types for authentication
 * These are shared types used across the domain layer
 */

/**
 * Supported OAuth providers
 */
export type OAuthProvider = 'bnet' | 'discord';

/**
 * Reasons for revoking a refresh token
 */
export type TokenRevocationReason = 'manual' | 'breach_detected' | 'logout_all';

