import { TokenPair } from "./token-pair";

export type RefreshTokenOutput = {
    shouldRefreshProviderToken: boolean;
    provider: string;
} & TokenPair;