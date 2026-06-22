import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useMessages, useSendMessage } from '../../hooks/useMessages';
import { useSocket } from '../../hooks/useSocket';
import { uploadFile } from '../../services/upload';
import ChatMessage from '../../components/ChatMessage';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

export default function ChatScreen() {
  const { user, activeCommunityId } = useAuth();
  const { data, isLoading } = useMessages(activeCommunityId || '');
  const sendMessage = useSendMessage(activeCommunityId || '');
  const flatListRef = useRef<FlatList>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useSocket(activeCommunityId);

  const messages = data?.items || [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (!activeCommunityId) {
    return (
      <EmptyState
        icon="chat-outline"
        title="No Community Selected"
        description="Select a community from the Home tab to start chatting"
      />
    );
  }

  if (isLoading) return <LoadingScreen />;

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    try {
      await sendMessage.mutateAsync({ content });
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setSending(true);
    try {
      const upload = await uploadFile(result.assets[0].uri, 'chat-media');
      await sendMessage.mutateAsync({
        content: text.trim() || '',
        attachmentUrl: upload.url,
        attachmentType: 'image',
      });
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatMessage message={item} isOwn={item.senderId === user?.id} />
        )}
        contentContainerStyle={!messages.length ? styles.emptyContainer : styles.list}
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
        <IconButton icon="image" onPress={handleAttachment} disabled={sending} />
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
        <IconButton icon="send" onPress={handleSend} disabled={!text.trim() || sending} />
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
  },
});
