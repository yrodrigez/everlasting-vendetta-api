export interface GenerateTokenPairInput {
  userId: string;
  roles: string[];
  permissions: string[];
  provider: 'bnet' | 'discord';
  familyId: string; 
}
