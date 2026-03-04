import { Hono } from "hono";
import { createRoute } from "@http/hono-adapter";
import {
    sendAnalyticsEventSchema,
    SendAnalyticsEventInput,
} from "@http/validators/schemas/analytics-schema";
import { DatabaseClientFactory } from "@database/database-client-factory";

const sendEventRoute = new Hono();

sendEventRoute.post(
    "/",
    createRoute<SendAnalyticsEventInput>(
        {
            functionName: "analytics-send-event",
            inputSchema: sendAnalyticsEventSchema,
        },
        async ({ input, ipAddress, userAgent, user }) => {
            const databaseClient = DatabaseClientFactory.getInstance();

            const resolvedUserAgent = input.user_agent ?? userAgent;

            const { error } = await databaseClient
                .from("web_events")
                .insert({
                    event_name: input.event_name,
                    event_type: input.event_type ?? null,
                    user_id: user?.userId ?? null,
                    page_url: input.page_url ?? null,
                    page_path: input.page_path ?? null,
                    referrer: input.referrer ?? null,
                    metadata: input.metadata ?? {},
                    ip_address: ipAddress,
                    user_agent: resolvedUserAgent,
                });

            if (error) {
                throw new Error(error.message);
            }

            return { ok: true };
        },
    ),
);

export default sendEventRoute;
