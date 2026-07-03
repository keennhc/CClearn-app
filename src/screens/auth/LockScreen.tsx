import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function LockScreen() {
  const { unlock, logout } = useAuth();
  const [unlocking, setUnlocking] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleUnlock = async () => {
    setUnlocking(true);
    setFailed(false);
    try {
      const success = await unlock();
      if (!success) setFailed(true);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Avatar.Icon size={72} icon="lock" style={styles.icon} />
      <Text variant="headlineSmall" style={styles.title}>
        Home Owners Hub
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Unlock to continue
      </Text>
      {failed ? (
        <Text variant="bodySmall" style={styles.error}>
          Couldn't verify it's you. Try again.
        </Text>
      ) : null}
      <Button mode="contained" onPress={handleUnlock} loading={unlocking} disabled={unlocking} style={styles.button}>
        Unlock
      </Button>
      <Button mode="text" onPress={logout} textColor="#F44336">
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 16,
    backgroundColor: '#2196F3',
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#757575',
    marginTop: 4,
    marginBottom: 24,
  },
  error: {
    color: '#F44336',
    marginBottom: 12,
  },
  button: {
    width: '100%',
    marginBottom: 8,
    paddingVertical: 4,
  },
});
