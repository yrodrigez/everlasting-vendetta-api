import { DatabaseClient } from "@database/database-client-factory";
import { RefreshToken } from "@entities/auth/refresh-token";
import { AuthError } from "@errors/auth-error";
import { IAuthRepository } from "@repositories/i-auth-repository";
import { OAuthProvider } from "src/domain/types/auth-types";
import {
    StoreRefreshTokenDTO,
    RotateTokenDTO,
    CreateTokenFamilyDTO,
    RevokeRefreshTokenDTO,
    RevokeFamilyTokensDTO,
    StoreOauthTokenDTO,
    FindOrCreateUserDTO,
    MarkTokenAsRotatedDTO,
    OauthProviderDTO,
    FindOrCreateUserResponseDTO
} from "@dto/auth";

export class AuthRepository implements IAuthRepository {
    private readonly authSchema = 'ev_auth';

    constructor(
        private readonly database: DatabaseClient
    ) { }

    async getOauthProvider(userId: string, provider: OAuthProvider): Promise<OauthProviderDTO | null> {
        const { data, error } = await this.database
            .schema(this.authSchema)
            .from('oauth_providers')
            .select('*')
            .eq('user_id', userId)
            .eq('provider', provider)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw new AuthError(
                `Database error while retrieving OAuth provider: ${error.message || 'Unknown error'}`,
                'DB_ERROR',
                500
            );
        }

        if (!data) {
            return null;
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(data.token_expires_at),
        }
    }

    async rotateToken(dto: RotateTokenDTO): Promise < void> {
            const { oldJti, newJti, userId, familyId, provider, expiresAt, ipAddress, userAgent } = dto;
            const { error } = await this.database.schema(this.authSchema).rpc(
                'rotate_refresh_token', {
                p_old_jti: oldJti,
                p_new_jti: newJti,
                p_user_id: userId,
                p_family_id: familyId,
                p_provider: provider,
                p_expires_at: expiresAt.toISOString(),
                p_ip_address: ipAddress || null,
                p_user_agent: userAgent || null
            });

            if(error) {
                throw new AuthError(
                    `Database error while rotating refresh token: ${error.message || 'Unknown error'}`,
                    'DB_ERROR',
                    500
                );
            }
        }
    async createTokenFamily(dto: CreateTokenFamilyDTO): Promise < string > {
            const { userId, provider, ipAddress } = dto;
            const familyId = crypto.randomUUID();

            const { error } = await this.database
                .schema(this.authSchema)
                .from('token_families')
                .insert({
                    id: familyId,
                    user_id: userId,
                    provider: provider,
                    original_ip_address: ipAddress,
                    created_at: new Date().toISOString()
                });

            if(error) {
                throw new AuthError(
                    `Failed to create token family: ${error.message}`,
                    'DB_ERROR',
                    500
                );
            }

        return familyId;
        }
    
    async storeRefreshToken(dto: StoreRefreshTokenDTO): Promise < void> {
            const { userId, tokenJti, familyId, provider, expiresAt, ipAddress, userAgent } = dto;
            const { error } = await this.database
                .schema(this.authSchema)
                .from('refresh_tokens')
                .insert({
                    user_id: userId,
                    token_jti: tokenJti,
                    family_id: familyId,
                    provider: provider,
                    expires_at: expiresAt.toISOString(),
                    ip_address: ipAddress,
                    user_agent: userAgent
                });

            if(error) {
                throw new AuthError(
                    `Database error while storing refresh token: ${error.message || 'Unknown error'}`,
                    'DB_ERROR',
                    500
                );
            }


        }

    async getRefreshToken(tokenJti: string): Promise < RefreshToken | null > {
            const { data, error } = await this.database
                .schema(this.authSchema)
                .from('refresh_tokens')
                .select('*')
                .eq('token_jti', tokenJti)
                .limit(1)
                .maybeSingle();

            if(error || !data) {
            throw new AuthError(
                `Database error while retrieving refresh token: ${!data ? 'Token not found' : (error?.message || 'Unknown error')}`,
                'DB_ERROR',
                error ? 500 : 404
            );
        }

        return RefreshToken.fromDatabase(data);
    }

    async markTokenAsRotated(dto: MarkTokenAsRotatedDTO): Promise<void> {
        const { oldTokenJti, newTokenJti } = dto;
        const { error } = await this.database
            .schema(this.authSchema)
            .from('refresh_tokens')
            .update({
                rotated_to_jti: newTokenJti,
                is_rotated: true
            })
            .eq('token_jti', oldTokenJti);

        if (error) {
            throw new AuthError(
                `Database error while marking token as rotated: ${error.message || 'Unknown error'}`,
                'DB_ERROR',
                500
            );
        }
    }

    async revokeRefreshToken(dto: RevokeRefreshTokenDTO): Promise<void> {
        const { tokenJti, reason } = dto;
        const { error } = await this.database
            .schema(this.authSchema)
            .from('refresh_tokens')
            .update({ revoked: true, revoked_reason: reason, revoked_at: new Date().toISOString() })
            .eq('token_jti', tokenJti);

        if (error) {
            throw new AuthError(
                `Database error while revoking refresh token: ${error.message || 'Unknown error'}`,
                'DB_ERROR',
                500
            );
        }

    }

    async revokeFamilyTokens(dto: RevokeFamilyTokensDTO): Promise<void> {
        const { familyId, reason } = dto;
        const { error } = await this.database
            .schema(this.authSchema)
            .from('refresh_tokens')
            .update({ revoked_reason: reason, revoked_at: new Date().toISOString() })
            .eq('family_id', familyId)
            .is('revoked_at', null)
            .is('revoked_reason', null)


        if (error) {
            throw new AuthError(
                `Database error while revoking family tokens: ${error.message || 'Unknown error'}`,
                'DB_ERROR',
                500
            );
        }
    }

    async findOrCreateUser(dto: FindOrCreateUserDTO): Promise<FindOrCreateUserResponseDTO> {
        const { provider, providerUserId, username } = dto;
        const { data, error } = await this.database
            .from('users')
            .select('user_id:id')
            .eq('user_name', username)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw new AuthError(
                `Database error while finding user: ${error.message || 'Unknown error'}`,
                'DB_ERROR',
                500
            );
        }


        if (data) {
            return { userId: data.user_id, isNewUser: false };
        }

        const id = crypto.randomUUID();
        const { data: insertData, error: insertError } = await this.database
            .from('users')
            .insert({ id, user_name: username })
            .select('id')
            .limit(1)
            .single();

        if (insertError || !insertData) {
            throw new AuthError(
                `Database error while creating user: ${insertError?.message || 'Could not get created user ID'}`,
                'DB_ERROR',
                500
            );
        }

        return { userId: insertData.id, isNewUser: true };
    }

    async storeOauthToken(dto: StoreOauthTokenDTO): Promise<void> {
        const { userId, provider, providerUserId, providerUsername, accessToken, refreshToken, expiresAt } = dto;
        const { error } = await this.database
            .schema(this.authSchema)
            .from('oauth_providers')
            .upsert({
                user_id: userId,
                provider: provider,
                provider_user_id: providerUserId,
                provider_username: providerUsername,
                access_token: accessToken,
                refresh_token: refreshToken,
                token_expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
                last_sync_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,provider'
            });

        if (error) {
            throw new AuthError(
                `Database error while storing OAuth token: ${error.message || 'Unknown error'}`,
                'DB_ERROR',
                500
            );
        }
    }

}