import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from './LoginScreen';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

const createProps = () => ({
  navigation: { navigate: mockNavigate } as any,
  route: { key: 'login', name: 'Login' as const, params: undefined },
});

describe('LoginScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the sign in heading', () => {
    const { getByText } = render(<LoginScreen {...createProps()} />);
    expect(getByText('Sign in to your account')).toBeTruthy();
  });

  it('shows error when submitting with empty fields', () => {
    const { getByText } = render(<LoginScreen {...createProps()} />);
    fireEvent.press(getByText('Sign In'));
    expect(getByText('Please fill in all fields')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    const { getByText, getAllByText } = render(<LoginScreen {...createProps()} />);

    const inputs = getAllByText(/Email|Password/);
    fireEvent.changeText(inputs[0], 'test@test.com');
    fireEvent.changeText(inputs[inputs.length - 1], 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    const { getByText, getAllByText } = render(<LoginScreen {...createProps()} />);

    const inputs = getAllByText(/Email|Password/);
    fireEvent.changeText(inputs[0], 'test@test.com');
    fireEvent.changeText(inputs[inputs.length - 1], 'wrong');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('navigates to Register screen when link is pressed', () => {
    const props = createProps();
    const { getByText } = render(<LoginScreen {...props} />);
    fireEvent.press(getByText("Don't have an account? Register"));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });
});
