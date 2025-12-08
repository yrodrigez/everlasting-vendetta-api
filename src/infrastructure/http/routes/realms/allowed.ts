import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { GetAllowedRealmsUseCaseFactory } from "@infrastructure/factories/wow/allowed-realms-usecase-factory";
import { Hono } from "hono";

const realmsRoute = new Hono();

realmsRoute.get(
    authMiddleware,
    createRoute(
        {
            functionName: "get-allowed-realms",
        },
        async () => {
            const useCase = GetAllowedRealmsUseCaseFactory.make();
            const realms = await useCase.execute();
            return { realms };
        }
    ));

export { realmsRoute };
