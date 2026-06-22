import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Announcement } from '../types/announcement';
import { formatDateTime, formatName } from '../utils/formatting';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress?: () => void;
  onLongPress?: () => void;
}

export default function AnnouncementCard({ announcement, onPress, onLongPress }: AnnouncementCardProps) {
  return (
    <Card style={styles.card} onPress={onPress} onLongPress={onLongPress}>
      <Card.Content>
        <Text variant="titleMedium">{announcement.title}</Text>
        <Text variant="bodyMedium" style={styles.content} numberOfLines={3}>
          {announcement.content}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          {formatName(announcement.authorFirstName, announcement.authorLastName)} ·{' '}
          {formatDateTime(announcement.createdAt)}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  content: {
    marginTop: 8,
    color: '#616161',
  },
  meta: {
    marginTop: 12,
    color: '#9E9E9E',
  },
});
