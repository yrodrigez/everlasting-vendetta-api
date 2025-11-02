import { z } from "zod/v3";

export const calculateGearScoreSchema = z.object({
    characters: z
        .array(z.object({
            name: z.string().min(1, "Character name cannot be empty"),
            realm: z.string().min(1, "Character realm cannot be empty"),
        }))
        .min(1, "At least one character is required"),
    forceRefresh: z.boolean().optional(),
});

export type CalculateGearScoreInput = z.infer<typeof calculateGearScoreSchema>;

export const anonTokenHeadersSchema = z.object({
    authorization: z.string().min(1, "Authorization header is required"),
});

export type CalculateGearScoreHeaders = z.infer<typeof anonTokenHeadersSchema>;
