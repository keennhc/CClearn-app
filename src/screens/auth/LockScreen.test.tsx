import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LockScreen from './LockScreen';

const mockUnlock = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ unlock: mockUnlock, logout: mockLogout }),
}));

describe('LockScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the app name and an unlock prompt', () => {
    const { getByText } = render(<LockScreen />);
    expect(getByText('Home Owners Hub')).toBeTruthy();
    expect(getByText('Unlock to continue')).toBeTruthy();
  });

  it('calls unlock when the Unlock button is pressed', async () => {
    mockUnlock.mockResolvedValue(true);
    const { getByText } = render(<LockScreen />);

    fireEvent.press(getByText('Unlock'));

    await waitFor(() => expect(mockUnlock).toHaveBeenCalledTimes(1));
  });

  it('shows an error and stays on screen when unlock fails', async () => {
    mockUnlock.mockResolvedValue(false);
    const { getByText } = render(<LockScreen />);

    fireEvent.press(getByText('Unlock'));

    await waitFor(() => expect(getByText("Couldn't verify it's you. Try again.")).toBeTruthy());
  });

  it('calls logout when Sign Out is pressed', () => {
    const { getByText } = render(<LockScreen />);

    fireEvent.press(getByText('Sign Out'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
