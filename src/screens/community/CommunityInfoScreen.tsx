import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, TextInput, Button } from 'react-native-paper';
import { useCommunity, useRegenerateJoinCode } from '../../hooks/useCommunities';
import * as communitiesService from '../../services/communities';
import { useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../../components/LoadingScreen';
import MembersScreen from './MembersScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'CommunityInfo'>;

export default function CommunityInfoScreen({ route }: Props) {
  const { communityId } = route.params;
  const { data: community, isLoading } = useCommunity(communityId);
  const regenerateCode = useRegenerateJoinCode(communityId);
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  if (isLoading || !community) return <LoadingScreen />;

  const handleEdit = () => {
    setName(community.name);
    setDescription(community.description || '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await communitiesService.updateCommunity(communityId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update community');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Join Code',
      'The current code will stop working. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', onPress: () => regenerateCode.mutate() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Community Settings
          </Text>
          {editing ? (
            <>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
                Save
              </Button>
              <Button mode="text" onPress={() => setEditing(false)} style={styles.cancelButton}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Text variant="bodyLarge">{community.name}</Text>
              <Text variant="bodyMedium" style={styles.descText}>
                {community.description || 'No description'}
              </Text>
              <Button mode="outlined" onPress={handleEdit} style={styles.editButton}>
                Edit Details
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Join Code
          </Text>
          <Text variant="headlineSmall" style={styles.joinCode}>
            {community.joinCode}
          </Text>
          <Button mode="outlined" onPress={handleRegenerate} loading={regenerateCode.isPending}>
            Regenerate Code
          </Button>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.membersTitle}>
        Members
      </Text>
      <MembersScreen communityId={communityId} />
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
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  descText: {
    color: '#616161',
    marginTop: 4,
    marginBottom: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  cancelButton: {
    marginTop: 4,
  },
  joinCode: {
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 12,
  },
  membersTitle: {
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
});
