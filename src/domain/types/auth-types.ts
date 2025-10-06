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

/**
 * Type guard to check if a string is a valid OAuth provider
 */
export function isValidOAuthProvider(value: string): value is OAuthProvider {
    return value === 'bnet' || value === 'discord';
}

/**
 * Type guard to check if a string is a valid revocation reason
 */
export function isValidRevocationReason(value: string): value is TokenRevocationReason {
    return value === 'manual' || value === 'breach_detected' || value === 'logout_all';
}
