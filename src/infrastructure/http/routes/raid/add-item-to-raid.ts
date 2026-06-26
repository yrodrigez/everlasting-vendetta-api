import { createRoute, RouteContext } from "@http/hono-adapter";
import { Hono } from "hono";
import { z } from "zod/v3";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { AddItemToRaidUseCaseFactory } from "src/infrastructure/factories/raid/add-item-to-raid-usecase-factory";

const addItemSchema = z.object({
    itemId: z.number(),
    bossName: z.string().optional(),
    raidId: z.string().uuid(),
});

type AddItemInput = z.infer<typeof addItemSchema>;

const addItemToRaidRoute = new Hono();

addItemToRaidRoute.post(
    "/item",
    authMiddleware,
    createRoute<AddItemInput>(
        {
            functionName: "add-item-to-raid",
            inputSchema: addItemSchema,
        },
        async (routeContext: RouteContext<AddItemInput>) => {
            const user = routeContext.user;
            if (!user?.isAdmin) {
                throw {
                    message: "Forbidden: admin access required",
                    statusCode: 403,
                };
            }

            const useCase = AddItemToRaidUseCaseFactory.make();
            const result = await useCase.execute({
                itemId: routeContext.input.itemId,
                bossName: routeContext.input.bossName,
                raidId: routeContext.input.raidId,
            });

            return result;
        }
    )
);

export { addItemToRaidRoute };
