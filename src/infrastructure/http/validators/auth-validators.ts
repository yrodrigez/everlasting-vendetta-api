import { access } from "fs";
import z from "zod";

const loginSchema = z.object({
    provider: z.string().min(1, "Provider is required"),
    access_token: z.string().min(1, "Access token is required"),
    expires_at: z.number().min(Date.now() / 1000, "Expiration time must be in the future"),
});

export { loginSchema };