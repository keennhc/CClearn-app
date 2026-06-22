import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={64} color="#9E9E9E" />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="bodyMedium" style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    textAlign: 'center',
    color: '#757575',
  },
  button: {
    marginTop: 24,
  },
});
