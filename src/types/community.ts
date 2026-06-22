import { CommunityRole } from './user';

export interface Community {
  id: string;
  name: string;
  description?: string;
  joinCode: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  role: CommunityRole;
  joinedAt: string;
}

export interface CommunityStats {
  memberCount: number;
  messageCount: number;
  announcementCount: number;
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
