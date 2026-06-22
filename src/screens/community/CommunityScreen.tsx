import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useCommunity, useCommunityStats } from '../../hooks/useCommunities';
import LoadingScreen from '../../components/LoadingScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Community'>;

export default function CommunityScreen({ route, navigation }: Props) {
  const { communityId } = route.params;
  const { user, setActiveCommunity } = useAuth();
  const { data: community, isLoading } = useCommunity(communityId);
  const { data: stats } = useCommunityStats(communityId);

  const membership = user?.communities.find((c) => c.communityId === communityId);
  const isAdmin = membership?.role === 'COMMUNITY_ADMIN';

  if (isLoading || !community) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.name}>
            {community.name}
          </Text>
          {community.description && (
            <Text variant="bodyMedium" style={styles.description}>
              {community.description}
            </Text>
          )}
          <Chip icon="account-group" style={styles.memberChip}>
            {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
          </Chip>
        </Card.Content>
      </Card>

      {stats && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Statistics
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text variant="headlineSmall">{stats.memberCount}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="headlineSmall">{stats.messageCount}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Messages</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="headlineSmall">{stats.announcementCount}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Announcements</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <Button
            mode="outlined"
            icon="chat"
            onPress={() => {
              setActiveCommunity(communityId);
              navigation.getParent()?.navigate('ChatTab');
            }}
            style={styles.actionButton}
          >
            Open Chat
          </Button>
          <Button
            mode="outlined"
            icon="bullhorn"
            onPress={() => {
              setActiveCommunity(communityId);
              navigation.getParent()?.navigate('AnnouncementsTab');
            }}
            style={styles.actionButton}
          >
            Announcements
          </Button>
          {isAdmin && (
            <Button
              mode="outlined"
              icon="account-multiple"
              onPress={() => navigation.navigate('CommunityInfo', { communityId })}
              style={styles.actionButton}
            >
              Manage Community
            </Button>
          )}
        </Card.Content>
      </Card>

      {isAdmin && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Join Code
            </Text>
            <Text variant="headlineSmall" style={styles.joinCode}>
              {community.joinCode}
            </Text>
            <Text variant="bodySmall" style={styles.joinCodeHint}>
              Share this code with others to invite them
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  name: {
    fontWeight: 'bold',
  },
  description: {
    marginTop: 8,
    color: '#616161',
  },
  memberChip: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#9E9E9E',
    marginTop: 4,
  },
  actionButton: {
    marginBottom: 8,
  },
  joinCode: {
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 3,
    marginVertical: 8,
  },
  joinCodeHint: {
    textAlign: 'center',
    color: '#9E9E9E',
  },
});
