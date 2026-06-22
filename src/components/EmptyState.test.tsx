import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EmptyState from './EmptyState';

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

describe('EmptyState', () => {
  it('renders title and icon', () => {
    const { getByText } = render(
      <EmptyState icon="alert" title="Nothing Here" />
    );
    expect(getByText('Nothing Here')).toBeTruthy();
  });

  it('renders description when provided', () => {
    const { getByText } = render(
      <EmptyState icon="alert" title="Empty" description="No items found" />
    );
    expect(getByText('No items found')).toBeTruthy();
  });

  it('does not render description when not provided', () => {
    const { queryByText } = render(
      <EmptyState icon="alert" title="Empty" />
    );
    expect(queryByText('No items found')).toBeNull();
  });

  it('renders action button and fires callback when pressed', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState icon="alert" title="Empty" actionLabel="Add Item" onAction={onAction} />
    );
    fireEvent.press(getByText('Add Item'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when label or callback is missing', () => {
    const { queryByText } = render(
      <EmptyState icon="alert" title="Empty" actionLabel="Add Item" />
    );
    expect(queryByText('Add Item')).toBeNull();
  });
});
