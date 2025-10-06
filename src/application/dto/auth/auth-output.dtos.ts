/**
 * Output DTOs for Auth operations
 * These DTOs are used for outgoing data from the application layer
 */

export interface OauthProviderDTO {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
}

export interface FindOrCreateUserResponseDTO {
    userId: string;
    isNewUser: boolean;
}

export interface CreateTokenFamilyResponseDTO {
    familyId: string;
}
