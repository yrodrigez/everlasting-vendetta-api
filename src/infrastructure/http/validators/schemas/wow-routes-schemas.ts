import { z } from "zod/v3";

export const wowProfileCharactersSchema = z.object({
    access_token: z.string().min(1, "Access token is required"),
    realmSlug: z.string().min(1, "Realm slug is required"),
});

export type WowProfileCharactersInput = z.infer<typeof wowProfileCharactersSchema>;

// Schema for user characters endpoint - uses Authorization header and query params
export const userCharactersQuerySchema = z.object({
    realmSlug: z.string().optional(),
});

export const userCharactersHeadersSchema = z.object({
    authorization: z.string().min(1, "Authorization header is required"),
});

export type UserCharactersQuery = z.infer<typeof userCharactersQuerySchema>;
export type UserCharactersHeaders = z.infer<typeof userCharactersHeadersSchema>;

