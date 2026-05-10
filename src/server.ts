import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { SQLDatabaseClientFactory } from "@database/sql/sql-database-client-factory";

const app = createApp();
const port = Number(process.env.PORT ?? 8080);

console.log(`🚀 Server starting on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});

const db = SQLDatabaseClientFactory.getInstance()

process.on("SIGTERM", async () => {
  await db.close()
  process.exit(0)
})

process.on("SIGINT", async () => {
  await db.close()
  process.exit(0)
})

console.log(`✅ Server running at http://localhost:${port}`);
