import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { FAB, Portal, Modal, TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from '../../hooks/useAnnouncements';
import AnnouncementCard from '../../components/AnnouncementCard';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';
import { Announcement } from '../../types/announcement';

export default function AnnouncementsScreen() {
  const { user, activeCommunityId } = useAuth();
  const { data: announcements, isLoading, refetch, isRefetching } = useAnnouncements(activeCommunityId || '');
  const createMutation = useCreateAnnouncement(activeCommunityId || '');
  const updateMutation = useUpdateAnnouncement(activeCommunityId || '');
  const deleteMutation = useDeleteAnnouncement(activeCommunityId || '');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const membership = user?.communities.find((c) => c.communityId === activeCommunityId);
  const isAdmin = membership?.role === 'COMMUNITY_ADMIN';

  if (!activeCommunityId) {
    return (
      <EmptyState
        icon="bullhorn-outline"
        title="No Community Selected"
        description="Select a community from the Home tab to view announcements"
      />
    );
  }

  if (isLoading) return <LoadingScreen />;

  const openCreate = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
    setModalVisible(true);
  };

  const openEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    if (editingAnnouncement) {
      await updateMutation.mutateAsync({
        id: editingAnnouncement.id,
        data: { title: title.trim(), content: content.trim() },
      });
    } else {
      await createMutation.mutateAsync({ title: title.trim(), content: content.trim() });
    }
    setModalVisible(false);
  };

  const handleDelete = (announcement: Announcement) => {
    Alert.alert('Delete Announcement', `Delete "${announcement.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(announcement.id),
      },
    ]);
  };

  const handleLongPress = (announcement: Announcement) => {
    if (!isAdmin) return;
    Alert.alert(announcement.title, undefined, [
      { text: 'Edit', onPress: () => openEdit(announcement) },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(announcement) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={styles.container}>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AnnouncementCard
            announcement={item}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={!announcements?.length ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            icon="bullhorn-outline"
            title="No Announcements"
            description="There are no announcements yet"
          />
        }
      />

      {isAdmin && (
        <FAB icon="plus" style={styles.fab} onPress={openCreate} />
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
          </Text>
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.modalInput}
          />
          <TextInput
            label="Content"
            value={content}
            onChangeText={setContent}
            mode="outlined"
            multiline
            numberOfLines={5}
            style={styles.modalInput}
          />
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving || !title.trim() || !content.trim()}
          >
            {editingAnnouncement ? 'Update' : 'Create'}
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
  list: {
    paddingVertical: 8,
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
    marginBottom: 12,
  },
});
