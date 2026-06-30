import { CommunityRole } from './user';

export interface Community {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  memberCount: number;
  messageCount: number;
  announcementCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  userId: string;
  communityId: string;
  userName: string;
  firstName: string;
  lastName: string;
  userEmail: string;
  role: CommunityRole;
  joinedAt: string;
}

export interface CommunityStats {
  totalMembers: number;
  totalMessages: number;
  totalAnnouncements: number;
}

export interface CreateCommunityDto {
  name: string;
  description?: string;
}

export interface JoinCommunityDto {
  code: string;
}

export interface UpdateCommunityDto {
  name?: string;
  description?: string;
}

export interface AddMemberDto {
  email: string;
}

export interface UpdateMemberRoleDto {
  role: CommunityRole;
}
