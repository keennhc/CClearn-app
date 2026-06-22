import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useMyCommunities } from '../../hooks/useCommunities';
import CommunityCard from '../../components/CommunityCard';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, setActiveCommunity } = useAuth();
  const { data: communities, isLoading, refetch, isRefetching } = useMyCommunities();

  const getUserRole = useCallback(
    (communityId: string) => {
      return user?.communities.find((c) => c.communityId === communityId)?.role;
    },
    [user]
  );

  const handleCommunityPress = (communityId: string) => {
    setActiveCommunity(communityId);
    navigation.navigate('Community', { communityId });
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={communities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommunityCard
            community={item}
            role={getUserRole(item.id)}
            onPress={() => handleCommunityPress(item.id)}
          />
        )}
        contentContainerStyle={!communities?.length ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            icon="home-group"
            title="No Communities"
            description="Join a community or create your own to get started"
          />
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('JoinCommunity')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  list: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
