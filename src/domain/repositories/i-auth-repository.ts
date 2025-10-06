import { RefreshToken } from "@entities/auth/refresh-token";
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

export interface IAuthRepository {
    findOrCreateUser(dto: FindOrCreateUserDTO): Promise<FindOrCreateUserResponseDTO>;

    storeOauthToken(dto: StoreOauthTokenDTO): Promise<void>;

    storeRefreshToken(dto: StoreRefreshTokenDTO): Promise<void>;

    getOauthProvider(userId: string, provider: OAuthProvider): Promise<OauthProviderDTO | null>;

    getRefreshToken(tokenJti: string): Promise<RefreshToken | null>;

    markTokenAsRotated(dto: MarkTokenAsRotatedDTO): Promise<void>;

    rotateToken(dto: RotateTokenDTO): Promise<void>;

    revokeRefreshToken(dto: RevokeRefreshTokenDTO): Promise<void>;

    revokeFamilyTokens(dto: RevokeFamilyTokensDTO): Promise<void>;

    createTokenFamily(dto: CreateTokenFamilyDTO): Promise<string>;
}