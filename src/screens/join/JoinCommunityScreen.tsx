import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useCreateCommunity, useJoinCommunity } from '../../hooks/useCommunities';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'JoinCommunity'>;

export default function JoinCommunityScreen({ navigation }: Props) {
  const { setActiveCommunity } = useAuth();
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [joinCode, setJoinCode] = useState('');
  const [communityName, setCommunityName] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');
  const [error, setError] = useState('');

  const joinMutation = useJoinCommunity();
  const createMutation = useCreateCommunity();

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a community code');
      return;
    }
    setError('');
    try {
      const community = await joinMutation.mutateAsync({ code: joinCode.trim() });
      setActiveCommunity(community.id);
      navigation.navigate('Community', { communityId: community.id });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Failed to join community');
    }
  };

  const handleCreate = async () => {
    if (!communityName.trim()) {
      setError('Please enter a community name');
      return;
    }
    setError('');
    try {
      const community = await createMutation.mutateAsync({
        name: communityName.trim(),
        description: communityDescription.trim() || undefined,
      });
      setActiveCommunity(community.id);
      navigation.navigate('Community', { communityId: community.id });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Failed to create community');
    }
  };

  const loading = joinMutation.isPending || createMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SegmentedButtons
          value={mode}
          onValueChange={(value) => {
            setMode(value as 'join' | 'create');
            setError('');
          }}
          buttons={[
            { value: 'join', label: 'Join Existing' },
            { value: 'create', label: 'Create New' },
          ]}
          style={styles.segmented}
        />

        {mode === 'join' ? (
          <>
            <TextInput
              label="Community Code"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              style={styles.input}
              mode="outlined"
            />
            {error ? <HelperText type="error">{error}</HelperText> : null}
            <Button mode="contained" onPress={handleJoin} loading={loading} disabled={loading} style={styles.button}>
              Join Community
            </Button>
          </>
        ) : (
          <>
            <TextInput
              label="Community Name"
              value={communityName}
              onChangeText={setCommunityName}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Description (optional)"
              value={communityDescription}
              onChangeText={setCommunityDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
              mode="outlined"
            />
            {error ? <HelperText type="error">{error}</HelperText> : null}
            <Button mode="contained" onPress={handleCreate} loading={loading} disabled={loading} style={styles.button}>
              Create Community
            </Button>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scroll: {
    padding: 24,
  },
  segmented: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
  },
});
