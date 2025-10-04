export interface RefreshTokenPayload {
  jti: string;                    // JWT ID
  sub: string;                    // User UUID
  iat: number;                    // Issued at (seconds)
  exp: number;                    // Expiration (seconds)
  type: 'refresh';                // Token type
  provider: 'bnet' | 'discord';   // OAuth provider
  family_id: string;              // Token family UUID
}