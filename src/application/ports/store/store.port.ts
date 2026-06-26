export interface StorePort {
    set<T>(key: string, value: T, exp?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    remove(key: string): Promise<void>;
}
