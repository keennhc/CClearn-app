import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  CommunitySetup: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Community: { communityId: string };
  CommunityInfo: { communityId: string };
  JoinCommunity: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ChatTab: undefined;
  AnnouncementsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  CommunitySetup: undefined;
};
