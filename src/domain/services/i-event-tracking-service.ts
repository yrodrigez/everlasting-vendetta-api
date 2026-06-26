export interface EventTrackingInput {
    event_name: string;
    event_type: "auth" | "action" | "system";
    user_id?: string;
    metadata?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
}

export interface IEventTrackingService {
    track(input: EventTrackingInput): Promise<void>;
}
