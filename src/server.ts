import { serve } from "@hono/node-server";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT ?? 8080);

console.log(`🚀 Server starting on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});

console.log(`✅ Server running at http://localhost:${port}`);
