import { DatabaseClient } from "@database/database-client-factory";
import { AuthError } from "@errors/auth-error";
import { IAuthRepository } from "@repositories/i-auth-repository";

export class AuthRepository implements IAuthRepository {
    private readonly authSchema = 'ev_auth';

    constructor(
        private readonly database: DatabaseClient
    ) { }
    async createTokenFamily(userId: string, provider: "bnet" | "discord", ipAddress?: string): Promise<string> {
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

        if (error) {
            throw new AuthError(
                `Failed to create token family: ${error.message}`,
                'DB_ERROR',
                500
            );
        }

        return familyId;
    }
    async storeRefreshToken(userId: string, tokenJti: string, familyId: string, provider: "bnet" | "discord", expiresAt: Date, ipAddress?: string, userAgent?: string): Promise<void> {
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

        if (error) {
            throw new AuthError(
                `Database error while storing refresh token: ${error.message || 'Unknown error'}`,
                'DB_ERROR',
                500
            );
        }


    }
    getRefreshToken(tokenJti: string): Promise<{ user_id: string; token_jti: string; family_id: string; provider: "bnet" | "discord"; expires_at: string; revoked: boolean; created_at: string; ip_address: string | null; user_agent: string | null; } | null> {
        throw new Error("Method not implemented.");
    }
    markTokenAsRotated(oldTokenJti: string, newTokenJti: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    revokeRefreshToken(tokenJti: string, reason: "manual" | "breach_detected" | "logout_all"): Promise<void> {
        throw new Error("Method not implemented.");
    }
    revokeFamilyTokens(familyId: string, reason: "manual" | "breach_detected" | "logout_all"): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async findOrCreateUser(provider: string, providerUserId: string, username: string): Promise<{ userId: string; isNewUser: boolean; }> {
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

    async storeOauthToken(
        userId: string,
        provider: 'bnet' | 'discord',
        providerUserId: string,
        providerUsername: string,
        accessToken: string,
        refreshToken: string | null,
        expiresAt: Date
    ): Promise<void> {
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