import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Community } from '../types/community';
import { CommunityRole } from '../types/user';

interface CommunityCardProps {
  community: Community;
  role?: CommunityRole;
  onPress: () => void;
}

export default function CommunityCard({ community, role, onPress }: CommunityCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium">{community.name}</Text>
        {community.description && (
          <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
            {community.description}
          </Text>
        )}
        <Text variant="bodySmall" style={styles.members}>
          {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
        </Text>
        {role && (
          <Chip style={styles.chip} textStyle={styles.chipText} compact>
            {role === 'COMMUNITY_ADMIN' ? 'Admin' : 'Member'}
          </Chip>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  description: {
    marginTop: 4,
    color: '#757575',
  },
  members: {
    marginTop: 8,
    color: '#9E9E9E',
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  chipText: {
    fontSize: 12,
  },
});
