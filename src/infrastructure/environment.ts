
const region = process.env.BLIZZARD_REGION || 'eu';
const locale = process.env.BLIZZARD_LOCALE || 'en_US';
const classicStaticNamespace = `static-classic1x-${region}`;
const classicProfileNamespace = `profile-classic1x-${region}`;
const classicDynamicNamespace = `dynamic-classic1x-${region}`;


export const getEnvironment = () => {

    return Object.freeze({
        supabaseUrl: process.env.SUPABASE_URL!,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        blizzardClientId: process.env.BLIZZARD_CLIENT_ID!,
        blizzardClientSecret: process.env.BLIZZARD_CLIENT_SECRET!,
        blizzardRegion: region,
        blizzardLocale: locale,
        discordClientId: process.env.DISCORD_CLIENT_ID!,
        discordClientSecret: process.env.DISCORD_CLIENT_SECRET!,
        discordGuildId: process.env.DISCORD_GUILD_ID!,
        jwtSecret: process.env.JWT_EV_PRIVATE_KEY!,
        jwtRefreshSecret: process.env.JWT_EV_REFRESH_PRIVATE_KEY!,
        jwtAnonKey: process.env.JWT_EV_ANON_KEY!,
        jwtExpiration: 60 * 60 * 2, // 2 hours in seconds
        refreshTokenExpiration: 60 * 60 * 24 * 30, // 30 days in seconds
        jwtKid: process.env.JWT_EV_KID!,
        isProd: process.env.ENVIRONMENT === 'production',
        classicProfileNamespace: classicProfileNamespace,
        classicStaticNamespace: classicStaticNamespace,
        classicDynamicNamespace: classicDynamicNamespace,
    });
};
