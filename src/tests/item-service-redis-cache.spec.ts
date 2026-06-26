import { describe, expect, it, jest } from "@jest/globals";
import { ItemService } from "../infrastructure/external/item-service";

const itemDetails = {
    itemLevel: 100,
    quality: {
        type: "EPIC",
        name: "Epic",
    },
    icon: "icon.jpg",
    displayId: 123,
    id: 456,
    name: "Cached Item",
    sockets: [{ type: "red" }],
};

describe("ItemService Redis cache", () => {
    it("returns item details from Redis without querying the database", async () => {
        const store: any = {
            get: jest.fn(async () => itemDetails),
            set: jest.fn(),
            remove: jest.fn(),
        };
        const databaseClient = {
            from: jest.fn(),
        };
        const service = new ItemService(
            databaseClient as any,
            undefined,
            store as any
        );

        const result = await service.getItem(456);

        expect(result).toEqual(itemDetails);
        expect(store.get).toHaveBeenCalledWith("wow:item:456");
        expect(databaseClient.from).not.toHaveBeenCalled();
    });

    it("stores valid database item details in Redis", async () => {
        const query: any = {
            select: jest.fn(() => query),
            eq: jest.fn(() => query),
            limit: jest.fn(() => query),
            maybeSingle: jest.fn(async () => ({
                data: {
                    details: itemDetails,
                    updated_at: "2026-06-01T00:00:00Z",
                },
                error: null,
            })),
        };
        const store: any = {
            get: jest.fn(async () => null),
            set: jest.fn(),
            remove: jest.fn(),
        };
        const databaseClient = {
            from: jest.fn(() => query),
        };
        const service = new ItemService(
            databaseClient as any,
            undefined,
            store as any
        );

        const result = await service.getItem(456);

        expect(result).toEqual(itemDetails);
        expect(store.set).toHaveBeenCalledWith("wow:item:456", itemDetails);
    });
});
