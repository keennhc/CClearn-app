import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, FAB, Portal, Modal, TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useMembers, useAddMember, useUpdateMemberRole, useRemoveMember } from '../../hooks/useCommunities';
import MemberListItem from '../../components/MemberListItem';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import { CommunityMember } from '../../types/community';
import { CommunityRole } from '../../types/user';

interface MembersScreenProps {
  communityId: string;
}

export default function MembersScreen({ communityId }: MembersScreenProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addEmail, setAddEmail] = useState('');

  const { data, isLoading } = useMembers(communityId, 1, search);
  const addMember = useAddMember(communityId);
  const updateRole = useUpdateMemberRole(communityId);
  const removeMember = useRemoveMember(communityId);

  const membership = user?.communities.find((c) => c.communityId === communityId);
  const isAdmin = membership?.role === 'COMMUNITY_ADMIN';

  if (isLoading) return <LoadingScreen />;

  const members = data?.items || [];

  const handleMemberPress = (member: CommunityMember) => {
    if (!isAdmin || member.userId === user?.id) return;

    const newRole: CommunityRole =
      member.role === 'COMMUNITY_ADMIN' ? 'COMMUNITY_MEMBER' : 'COMMUNITY_ADMIN';

    Alert.alert(
      `${member.firstName} ${member.lastName}`,
      `Current role: ${member.role === 'COMMUNITY_ADMIN' ? 'Admin' : 'Member'}`,
      [
        {
          text: `Make ${newRole === 'COMMUNITY_ADMIN' ? 'Admin' : 'Member'}`,
          onPress: () => updateRole.mutate({ memberId: member.id, data: { role: newRole } }),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Remove Member', `Remove ${member.firstName} ${member.lastName}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => removeMember.mutate(member.id) },
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAddMember = async () => {
    if (!addEmail.trim()) return;
    try {
      await addMember.mutateAsync({ email: addEmail.trim() });
      setAddModalVisible(false);
      setAddEmail('');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Error', message || 'Failed to add member');
    }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search members..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MemberListItem member={item} onPress={() => handleMemberPress(item)} />
        )}
        contentContainerStyle={!members.length ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <EmptyState icon="account-group-outline" title="No Members Found" />
        }
      />

      {isAdmin && (
        <FAB icon="account-plus" style={styles.fab} onPress={() => setAddModalVisible(true)} />
      )}

      <Portal>
        <Modal
          visible={addModalVisible}
          onDismiss={() => setAddModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Add Member
          </Text>
          <TextInput
            label="Email Address"
            value={addEmail}
            onChangeText={setAddEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.modalInput}
          />
          <Button
            mode="contained"
            onPress={handleAddMember}
            loading={addMember.isPending}
            disabled={addMember.isPending || !addEmail.trim()}
          >
            Add Member
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  searchbar: {
    margin: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  modalInput: {
    marginBottom: 16,
  },
});
