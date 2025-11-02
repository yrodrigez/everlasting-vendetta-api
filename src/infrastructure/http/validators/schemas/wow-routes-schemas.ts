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

export const characterAvatarParamsSchema = z.object({
    realm: z.string().min(1, "Realm slug is required"),
    name: z.string().min(1, "Character name is required"),
});

export const characterAvatarQuerySchema = z.object({
    force: z.string().optional(),
});

export type CharacterAvatarParams = z.infer<typeof characterAvatarParamsSchema>;
export type CharacterAvatarQuery = z.infer<typeof characterAvatarQuerySchema>;

export const wowCharacterParamsSchema = characterAvatarParamsSchema;
export const wowCharacterQuerySchema = characterAvatarQuerySchema;
export type WowCharacterParams = CharacterAvatarParams;
export type WowCharacterQuery = CharacterAvatarQuery;

export const wowItemQuerySchema = z.object({
    force: z.string().optional(),
});
export const wowItemParamsSchema = z.object({
    itemId: z.coerce.number().int().gt(0, "itemId must be greater than 0"),
});

export type WowItemParams = z.infer<typeof wowItemParamsSchema>;
export type WowItemQuery = z.infer<typeof wowItemQuerySchema>;
