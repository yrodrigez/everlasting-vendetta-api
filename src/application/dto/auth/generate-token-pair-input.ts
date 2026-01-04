import { Provider } from "./provider";

export interface GenerateTokenPairInput {
  userId: string;
  roles: string[];
  permissions: string[];
  provider: Provider;
  familyId: string;
  isAdmin: boolean;
  isTemporal: boolean;
  email?: string;
  bnet_id?: string;
  discord_id?: string;
  isBanned: boolean;
  isGuildMember: boolean;
}
