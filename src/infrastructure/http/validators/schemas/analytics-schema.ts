import { z } from "zod/v3";

export const sendAnalyticsEventSchema = z.object({
    event_name: z.string().min(1, "event_name is required"),
    event_type: z.string().nullish(),
    user_id: z.string().nullish(),
    page_url: z.string().nullish(),
    page_path: z.string().nullish(),
    referrer: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    user_agent: z.string().nullish(),
});

export type SendAnalyticsEventInput = z.infer<typeof sendAnalyticsEventSchema>;
