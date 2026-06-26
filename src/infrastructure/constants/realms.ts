export const ALLOWED_REALMS = [
    { id: 1, name: "Living Flame", slug: "living-flame" },
    { id: 2, name: "Spineshatter", slug: "spineshatter" },
];

export const isRealmAllowed = (realmSlug: string): boolean => {
    return ALLOWED_REALMS.some(
        (realm) => realm.slug.toLowerCase() === realmSlug.toLowerCase()
    );
};

export const getRealmBySlug = (realmSlug: string) => {
    return ALLOWED_REALMS.find(
        (realm) => realm.slug.toLowerCase() === realmSlug.toLowerCase()
    );
};
