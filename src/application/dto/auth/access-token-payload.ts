import { Provider } from "./provider";

export interface AccessTokenPayload {
    jti: string;
    sub: string;
    iat: number;
    exp: number;
    role: 'authenticated' | 'anon';
    aud: 'authenticated';
    type: 'access';
    aal: 'aal1';
    isTemporal: boolean;
    isAdmin: boolean;
    email?: string;
    provider: Provider;
    bnet_id?: string;
    discord_id?: string;
    custom_roles: string[];
    permissions: string[];
    isBanned: boolean;
    isGuildMember: boolean;
    iss: string;
}