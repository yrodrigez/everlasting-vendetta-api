import { Provider } from "./provider";

export interface RefreshTokenPayload {
    jti: string;
    sub: string;
    iat: number;
    exp: number;
    type: "refresh";
    provider: Provider;
    family_id: string;
}
