import { DatabaseClientFactory } from "@database/database-client-factory";
import { IEventTrackingService, EventTrackingInput } from "src/domain/services/i-event-tracking-service";
import { createLogger } from "src/infrastructure/logging";

export class EventTrackingService implements IEventTrackingService {
    private readonly logger = createLogger('EventTrackingService');

    async track(input: EventTrackingInput): Promise<void> {
        try {
            const db = DatabaseClientFactory.getInstance();
            const { error } = await db.from('web_events').insert({
                event_name: input.event_name,
                event_type: input.event_type,
                user_id: input.user_id ?? null,
                page_url: null,
                page_path: null,
                referrer: null,
                metadata: input.metadata ?? {},
                ip_address: input.ip_address ?? null,
                user_agent: input.user_agent ?? null,
            });
            if (error) {
                this.logger.error('Failed to track event', error);
            }
        } catch (err) {
            this.logger.error('Event tracking error (swallowed)', err);
        }
    }
}
