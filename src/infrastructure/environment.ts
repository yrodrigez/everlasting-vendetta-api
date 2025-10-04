export const getEnvironment = () => {
    // Cloudflare Workers use process.env with nodejs_compat flag
    // Variables are loaded from .dev.vars (local) or wrangler secrets (production)
    return Object.freeze({
        supabaseUrl: process.env.SUPABASE_URL!,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        blizzardClientId: process.env.BLIZZARD_CLIENT_ID!,
        blizzardClientSecret: process.env.BLIZZARD_CLIENT_SECRET!,
        blizzardRegion: 'eu',
        blizzardLocale: 'en_US',
        discordClientId: process.env.DISCORD_CLIENT_ID!,
        discordClientSecret: process.env.DISCORD_CLIENT_SECRET!,
        discordGuildId: process.env.DISCORD_GUILD_ID!,
        jwtSecret: process.env.JWT_EV_PRIVATE_KEY!,
        jwtExpiration: 60 * 60 * 2, // 2 hours in seconds
        refreshTokenExpiration: 60 * 60 * 24 * 30, // 30 days in seconds
        jwtKid: process.env.JWT_EV_KID!,
        isProd: process.env.ENVIRONMENT === 'production',
    });
};