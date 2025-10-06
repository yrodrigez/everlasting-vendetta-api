export interface AccessTokenPayload {
    jti: string;
    sub: string;
    iat: number;
    exp: number;
    role: 'authenticated';
    aud: 'authenticated';
    type: 'access';
    aal: 'aal1';
    isTemporal: boolean;
    isAdmin: boolean;
    email: string;
    provider: 'bnet' | 'discord';
    bnet_id?: string;
    discord_id?: string;
    custom_roles: string[];
    permissions: string[];
}