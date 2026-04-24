export type UserRegistrationWeeksResult = {
    userId: string;
    registeredAt: Date | null;
    weeksSinceRegistration: number;
    characterName: string | null;
}

export interface UserRegistrationWeeksPort {
    getUserRegistrationWeeks(userId: string): Promise<UserRegistrationWeeksResult>;
}
