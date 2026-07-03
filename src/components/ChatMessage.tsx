import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { Message } from '../types/message';
import { formatTime, getInitials } from '../utils/formatting';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  status?: 'sending' | 'failed';
  onRetryPress?: () => void;
}

export default function ChatMessage({ message, isOwn, status, onRetryPress }: ChatMessageProps) {
  const bubble = (
    <View
      style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble,
        status === 'failed' && styles.failedBubble,
      ]}
    >
      {!isOwn && (
        <Text variant="labelSmall" style={styles.senderName}>
          {message.senderFirstName} {message.senderLastName}
        </Text>
      )}
      {message.attachmentUrl && (
        <Image source={{ uri: message.attachmentUrl }} style={styles.attachment} resizeMode="cover" />
      )}
      {message.message && (
        <Text variant="bodyMedium" style={isOwn ? styles.ownText : undefined}>
          {message.message}
        </Text>
      )}
      <View style={styles.footer}>
        {status === 'sending' && <ActivityIndicator size={10} style={styles.statusIcon} />}
        <Text
          variant="labelSmall"
          style={[styles.time, isOwn && styles.ownTime, status === 'failed' && styles.failedTime]}
        >
          {status === 'failed' ? 'Not sent · Tap to retry' : formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      {!isOwn && (
        <Avatar.Text
          size={32}
          label={getInitials(message.senderFirstName, message.senderLastName)}
          style={styles.avatar}
        />
      )}
      {status === 'failed' && onRetryPress ? (
        <Pressable onPress={onRetryPress} testID="chat-message-retry">
          {bubble}
        </Pressable>
      ) : (
        bubble
      )}
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
  failedBubble: {
    opacity: 0.6,
  },
  senderName: {
    color: '#2196F3',
    marginBottom: 2,
    fontWeight: '600',
  },
  ownText: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  time: {
    color: '#9E9E9E',
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  failedTime: {
    color: '#F44336',
    fontWeight: '600',
  },
  attachment: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
  },
});
