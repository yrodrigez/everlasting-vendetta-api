import { RefreshToken } from "@entities/auth/refresh-token";
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
import { Provider } from "@dto/auth/provider";
import { LinkOAuthAccount } from "@entities/auth/link-oauth-account";
import { OAuthProvider } from "@entities/auth/oauth-provider";

export interface IAuthRepository {
    findOrCreateUser(dto: FindOrCreateUserDTO): Promise<FindOrCreateUserResponseDTO>;

    findUserByProviderUserId(providerUserId: string, provider: Provider): Promise<OAuthProvider | null>;

    storeOauthToken(dto: StoreOauthTokenDTO): Promise<void>;

    storeRefreshToken(dto: StoreRefreshTokenDTO): Promise<void>;

    getOauthProvider(userId: string, provider: Provider): Promise<OauthProviderDTO | null>;

    getRefreshToken(tokenJti: string): Promise<RefreshToken | null>;

    markTokenAsRotated(dto: MarkTokenAsRotatedDTO): Promise<void>;

    rotateToken(dto: RotateTokenDTO): Promise<void>;

    revokeRefreshToken(dto: RevokeRefreshTokenDTO): Promise<void>;

    revokeFamilyTokens(dto: RevokeFamilyTokensDTO): Promise<void>;

    createTokenFamily(dto: CreateTokenFamilyDTO): Promise<string>;

    getUserSessions(userId: string): Promise<RefreshToken[]>;

    revokeAllUserTokens(userId: string, reason: string): Promise<void>;

    findTokenByJti(tokenJti: string): Promise<RefreshToken | null>;

    getActiveFamilyToken(familyId: string, provider: Provider): Promise<RefreshToken | null>;

    linkOAuthAccount(data: LinkOAuthAccount): Promise<OAuthProvider>;

    findAllByUserId(userId: string): Promise<OAuthProvider[]>;
}
