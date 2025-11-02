export interface GenerateTokenPairInput {
  userId: string;
  roles: string[];
  permissions: string[];
  provider: 'bnet' | 'discord';
  familyId: string;
  isAdmin: boolean;
  isTemporal: boolean;
  email?: string;
  bnet_id?: string;
  discord_id?: string;
  isBanned: boolean;
}
