import { cors } from "hono/cors";

export const corsMiddleware = cors({
    origin: ["https://everlastingvendetta.com", "http://localhost:3000"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposeHeaders: ["X-Request-ID"],
    maxAge: 86400,
});
