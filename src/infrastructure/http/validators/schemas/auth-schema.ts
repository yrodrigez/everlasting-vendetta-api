import { Provider } from "../../../../application/dto/auth/provider";
import { z } from "zod/v3";

const providers: [Provider, ...Provider[]] = ["bnet_oauth", "discord_oauth"];

export const loginSchema = z.object({
    provider: z.enum(providers, { message: "Invalid provider" }),
    access_token: z.string().min(1, "Access token is required"),
    expires_at: z
        .number()
        .min(Date.now() / 1000, "Expiration time must be in the future"),
    refresh_token: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
    sessionId: z.string().min(1, "sessionId is required"),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const revokeSchema = z.object({
    token_jti: z.string().uuid("Token JTI must be a valid UUID"),
});

export type RevokeInput = z.infer<typeof revokeSchema>;

export const linkOAuthAccountSchema = z.object({
    provider: z.enum(providers, { message: "Invalid provider" }),
    accessToken: z.string().min(1, "Access token is required"),
    refreshToken: z.string().optional(),
    tokenExpiresAt: z.number().positive(),
    metadata: z.record(z.any()).optional(),
});

export type LinkOAuthAccountSchema = z.infer<typeof linkOAuthAccountSchema>;

export const getMyProfileSchema = z.object({});

export type GetMyProfileSchema = z.infer<typeof getMyProfileSchema>;
