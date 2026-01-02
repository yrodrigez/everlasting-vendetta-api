import { AuthError } from "@errors/auth-error";
import { GetMyProfileController } from "@http/controllers/auth/get-my-profile-controller";
import { createRoute } from "@http/hono-adapter";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { GetMyProfileUseCaseFactory } from "@infrastructure/factories/auth/get-my-profile-usecase-factory";
import { Hono } from "hono";

const route = new Hono();

route.get('/',
    authMiddleware,
    createRoute({
        functionName: "get-my-profile",
    }, async (ctx) => {
        const user = ctx.c.get('user');
        if (!user) {
            throw new AuthError('User not authenticated', 'USER_NOT_AUTHENTICATED', 401);
        }
        const currentUserId = user.userId;

        const usecase = GetMyProfileUseCaseFactory.make();

        const controller = new GetMyProfileController(usecase);
        return controller.handle({ userId: currentUserId });
    })
);

export const getMyProfileRoute = route;