import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Avatar, Card, Text, Button, List, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { uploadFile } from '../../services/upload';
import { getInitials, formatName } from '../../utils/formatting';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleChangeImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      await uploadFile(result.assets[0].uri, 'profile-images');
    } catch {
      // upload failed silently
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {user.profileImage ? (
          <Avatar.Image size={80} source={{ uri: user.profileImage }} />
        ) : (
          <Avatar.Text size={80} label={getInitials(user.firstName, user.lastName)} />
        )}
        <Text variant="headlineSmall" style={styles.name}>
          {formatName(user.firstName, user.lastName)}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user.email}
        </Text>
        <Button mode="text" onPress={handleChangeImage} compact>
          Change Photo
        </Button>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            My Communities
          </Text>
          {user.communities.length === 0 ? (
            <Text variant="bodyMedium" style={styles.noCommunities}>
              You haven't joined any communities yet
            </Text>
          ) : (
            user.communities.map((community, index) => (
              <React.Fragment key={community.communityId ?? index}>
                {index > 0 && <Divider />}
                <List.Item
                  title={community.communityName}
                  description={community.role === 'COMMUNITY_ADMIN' ? 'Admin' : 'Member'}
                  left={(props) => <List.Icon {...props} icon="home-group" />}
                />
              </React.Fragment>
            ))
          )}
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={logout}
        style={styles.logoutButton}
        textColor="#F44336"
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  name: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  email: {
    color: '#757575',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  noCommunities: {
    color: '#9E9E9E',
    textAlign: 'center',
    paddingVertical: 16,
  },
  logoutButton: {
    margin: 16,
    borderColor: '#F44336',
  },
});
