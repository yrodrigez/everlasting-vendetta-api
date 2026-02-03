
const region = process.env.BLIZZARD_REGION || 'eu';
const locale = process.env.BLIZZARD_LOCALE || 'en_US';

const classicEraNamespaces = [
    { type: 'profile', namespace: `profile-classic1x-${region}` },
    { type: 'static', namespace: `static-classic1x-${region}` },
    { type: 'dynamic', namespace: `dynamic-classic1x-${region}` },
];
const classicAnniversaryNamespaces = [
    { type: 'profile', namespace: `profile-classicann-${region}` },
    { type: 'static', namespace: `static-classicann-${region}` },
    { type: 'dynamic', namespace: `dynamic-classicann-${region}` },
];

/* const classicProgressionNamespaces = [
    { type: 'profile', namespace: `profile-classic-${region}` },
    { type: 'static', namespace: `static-classic-${region}` },
    { type: 'dynamic', namespace: `dynamic-classic-${region}` },
]; */
/*
const retailNamespaces = [
    { type: 'profile', namespace: `profile-${region}` },
    { type: 'static', namespace: `static-${region}` },
    { type: 'dynamic', namespace: `dynamic-${region}` },
]
*/
const currentRealms = [
    {
        slug: 'living-flame', namespaces: classicEraNamespaces
    },
    {
        slug: 'spineshatter', namespaces: classicAnniversaryNamespaces
    }
];

export function findNamespace(realmSlug: string, type: 'profile' | 'static' | 'dynamic'): string | null {
    const realm = currentRealms.find(r => r.slug === realmSlug.toLowerCase());
    if (!realm) return null;
    const namespaceObj = realm.namespaces.find(n => n.type === type);
    return namespaceObj ? namespaceObj.namespace : null;
}

const getAllNamespacesByType = (type: 'profile' | 'static' | 'dynamic') => {
    return [...new Set(currentRealms.map(realm => {
        const namespaceObj = realm.namespaces.find(n => n.type === type);
        return namespaceObj ? namespaceObj.namespace : null;
    }).filter((ns): ns is string => ns !== null))];
}

const currentProfileNamespaces = getAllNamespacesByType('profile');

const currentStaticNamespaces = getAllNamespacesByType('static');

const currentDynamicNamespaces = getAllNamespacesByType('dynamic');


export type Realms = typeof currentRealms;


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
        jwtExpiration: 60 * 15, // 15 minutes in seconds
        refreshTokenExpiration: 60 * 60 * 24 * 30, // 30 days in seconds
        jwtKid: process.env.JWT_EV_KID!,
        isProd: process.env.ENVIRONMENT === 'production',
        currentRealms,
        profileNamespaces: currentProfileNamespaces,
        staticNamespaces: currentStaticNamespaces,
        dynamicNamespaces: currentDynamicNamespaces,
        guildNames: ['everlasting-vendetta']
    });
};
