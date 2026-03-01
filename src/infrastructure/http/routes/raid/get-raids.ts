import { createRoute } from "@http/hono-adapter";
import { Hono } from "hono";
import { GetRaidsUseCaseFactory } from "src/infrastructure/factories/raid/get-raids-usecase-factory";

const getRaidsRoute = new Hono();

getRaidsRoute.get(
    '/',
    createRoute(
        {
            functionName: "get-raids",
        },
        async () => {
            const useCase = GetRaidsUseCaseFactory.make();
            const raids = await useCase.execute();
            return { raids };
        }
    )
);

export { getRaidsRoute };
