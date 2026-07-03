import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../hooks/useMessages';
import { useMessageQueueDrain } from '../../hooks/useMessageQueueDrain';
import { useSocket } from '../../hooks/useSocket';
import ChatMessage from '../../components/ChatMessage';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';
import { Message } from '../../types/message';
import { QueuedMessage } from '../../utils/messageQueue';
import { AuthProfile } from '../../types/user';

function toDisplayMessage(queued: QueuedMessage, user: AuthProfile): Message {
  return {
    id: queued.localId,
    message: queued.message,
    communityId: queued.communityId,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    senderFirstName: user.firstName,
    senderLastName: user.lastName,
    userRole: user.role,
    attachmentUrl: queued.localAttachmentUri ?? queued.attachmentUrl ?? null,
    attachmentType: queued.attachmentType ?? null,
    attachmentName: queued.attachmentName ?? null,
    createdAt: queued.createdAt,
  };
}

export default function ChatScreen() {
  const { user, activeCommunityId } = useAuth();
  const { data, isLoading } = useMessages(activeCommunityId || '');
  const { queuedMessages, isOnline, enqueue, retry } = useMessageQueueDrain(activeCommunityId || '');
  const flatListRef = useRef<FlatList>(null);
  const [text, setText] = useState('');

  useSocket(activeCommunityId);

  const sentMessages = data?.items || [];

  const listItems = [
    ...sentMessages.map((message) => ({
      key: message.id,
      message,
      isOwn: message.userId === user?.id,
      status: undefined as 'sending' | 'failed' | undefined,
      onRetryPress: undefined as (() => void) | undefined,
    })),
    ...(user
      ? queuedMessages.map((queued) => ({
          key: queued.localId,
          message: toDisplayMessage(queued, user),
          isOwn: true,
          status: (queued.status === 'failed' ? 'failed' : 'sending') as 'sending' | 'failed',
          onRetryPress: queued.status === 'failed' ? () => retry(queued.localId) : undefined,
        }))
      : []),
  ];

  useEffect(() => {
    if (listItems.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listItems.length]);

  if (!activeCommunityId) {
    return (
      <EmptyState
        icon="chat-outline"
        title="No Community Selected"
        description="Select a community from the Home tab to start chatting"
      />
    );
  }

  if (isLoading || !user) return <LoadingScreen />;

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    await enqueue({ message: content });
  };

  const handleAttachment = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const content = text.trim();
    setText('');
    await enqueue({
      message: content || null,
      localAttachmentUri: result.assets[0].uri,
      attachmentType: 'IMAGE',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>No connection -- messages will send when you're back online</Text>
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={listItems}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <ChatMessage
            message={item.message}
            isOwn={item.isOwn}
            status={item.status}
            onRetryPress={item.onRetryPress}
          />
        )}
        contentContainerStyle={!listItems.length ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="chat-outline"
            title="No Messages Yet"
            description="Send the first message to start the conversation"
          />
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      <View style={styles.inputRow}>
        <IconButton testID="attachment-button" icon="image" onPress={handleAttachment} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          style={styles.input}
          mode="outlined"
          dense
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <IconButton testID="send-button" icon="send" onPress={handleSend} disabled={!text.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  list: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  offlineBanner: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  offlineBannerText: {
    color: '#E65100',
    fontSize: 13,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
  },
});
