import zod from "zod";

export const wowProfileCharactersSchema = zod.object({
    access_token: zod.string().min(1, "Access token is required"),
    realmSlug: zod.string().min(1, "Realm slug is required"),
});

