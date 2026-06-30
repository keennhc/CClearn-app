import React from 'react';
import { StyleSheet } from 'react-native';
import { List, Avatar, Chip } from 'react-native-paper';
import { CommunityMember } from '../types/community';
import { getInitials } from '../utils/formatting';

interface MemberListItemProps {
  member: CommunityMember;
  onPress?: () => void;
}

export default function MemberListItem({ member, onPress }: MemberListItemProps) {
  return (
    <List.Item
      title={member.userName}
      description={member.userEmail}
      onPress={onPress}
      left={() => (
        <Avatar.Text
          size={40}
          label={getInitials(member.firstName, member.lastName)}
          style={styles.avatar}
        />
      )}
      right={() => (
        <Chip compact style={styles.chip} textStyle={styles.chipText}>
          {member.role === 'COMMUNITY_ADMIN' ? 'Admin' : 'Member'}
        </Chip>
      )}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    marginLeft: 8,
    alignSelf: 'center',
  },
  chip: {
    alignSelf: 'center',
  },
  chipText: {
    fontSize: 11,
  },
});
