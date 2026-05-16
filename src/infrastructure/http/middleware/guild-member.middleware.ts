import { Context, Next } from "hono";

export async function guildMemberMiddleware(context: Context, next: Next) {
    const user = context.get("user");

    if (!user) {
        return context.json({ error: "Unauthorized" }, 401);
    }

    if (user.isBanned) {
        return context.json({ error: "User is banned" }, 403);
    }

    if (!user.isGuildMember) {
        return context.json({ error: "User is not a guild member" }, 403);
    }

    await next();
}

export async function vxAdminMiddleware(context: Context, next: Next) {
    const user = context.get("user");

    if (!user) {
        return context.json({ error: "Unauthorized" }, 401);
    }

    if (!user.roles?.includes("GUILD_MASTER") || !user.roles?.includes("VX_ADMIN")) {
        return context.json({ error: "Guild master access required" }, 403);
    }

    await next();
}
