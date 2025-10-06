import { z } from "zod/v3";

export const loginSchema = z.object({
    provider: z.string().min(1, "Provider is required"),
    access_token: z.string().min(1, "Access token is required"),
    expires_at: z.number().min(Date.now() / 1000, "Expiration time must be in the future"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
    refresh_token: z.string().min(1, "Refresh token is required"),
});

export type RefreshInput = z.infer<typeof refreshSchema>;