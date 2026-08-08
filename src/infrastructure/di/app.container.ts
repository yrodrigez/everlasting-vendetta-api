import { AUTH_TOKENS, registerAuthDependencies } from "./auth/auth.container";
import {
    CHARACTER_TOKENS,
    registerCharacterDependencies,
} from "./characters/characters.container";
import { Container } from "./container";
import { EVX_TOKENS, registerEvxDependencies } from "./evx/evx.container";
import {
    DATABASE_TOKENS,
    registerDatabaseDependencies,
} from "./persistence/database.container";

export const TOKENS = {
    ...DATABASE_TOKENS,
    ...AUTH_TOKENS,
    ...CHARACTER_TOKENS,
    ...EVX_TOKENS,
} as const;

const appContainer = new Container();

registerDatabaseDependencies(appContainer);
registerAuthDependencies(appContainer);
registerCharacterDependencies(appContainer);
registerEvxDependencies(appContainer);

export { appContainer };
