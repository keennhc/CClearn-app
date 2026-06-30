export type GlobalRole = 'SUPER_ADMIN' | 'USER';
export type CommunityRole = 'COMMUNITY_ADMIN' | 'COMMUNITY_MEMBER';

export interface CommunityMembership {
  communityId: string;
  communityName: string;
  role: CommunityRole;
}

export interface AuthProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: GlobalRole;
  profileImageUrl: string | null;
  communities: CommunityMembership[];
}
