import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { Message } from '../types/message';
import { formatTime, getInitials } from '../utils/formatting';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

export default function ChatMessage({ message, isOwn }: ChatMessageProps) {
  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      {!isOwn && (
        <Avatar.Text
          size={32}
          label={getInitials(message.senderFirstName, message.senderLastName)}
          style={styles.avatar}
        />
      )}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {!isOwn && (
          <Text variant="labelSmall" style={styles.senderName}>
            {message.senderFirstName} {message.senderLastName}
          </Text>
        )}
        {message.attachmentUrl && (
          <Image source={{ uri: message.attachmentUrl }} style={styles.attachment} resizeMode="cover" />
        )}
        {message.content && (
          <Text variant="bodyMedium" style={isOwn ? styles.ownText : undefined}>
            {message.content}
          </Text>
        )}
        <Text variant="labelSmall" style={[styles.time, isOwn && styles.ownTime]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  avatar: {
    marginRight: 8,
  },
  bubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  otherBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: '#2196F3',
    marginBottom: 2,
    fontWeight: '600',
  },
  ownText: {
    color: '#FFFFFF',
  },
  time: {
    color: '#9E9E9E',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  attachment: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
  },
});
