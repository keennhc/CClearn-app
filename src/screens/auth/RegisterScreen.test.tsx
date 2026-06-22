import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from './RegisterScreen';

const mockRegister = jest.fn();
const mockGoBack = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

const createProps = () => ({
  navigation: { goBack: mockGoBack } as any,
  route: { key: 'register', name: 'Register' as const, params: undefined },
});

describe('RegisterScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the create account heading', () => {
    const { getByText } = render(<RegisterScreen {...createProps()} />);
    expect(getByText('Join Home Owners Hub')).toBeTruthy();
  });

  it('shows validation error on empty submit', () => {
    const { getByText, getAllByText } = render(<RegisterScreen {...createProps()} />);
    const buttons = getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);
    expect(getByText('Please fill in all fields')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error message when registration fails', async () => {
    mockRegister.mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });
    const { getAllByText, getByText, UNSAFE_getAllByType } = render(
      <RegisterScreen {...createProps()} />
    );

    const textInputs = UNSAFE_getAllByType('TextInput' as any);
    fireEvent.changeText(textInputs[0], 'John');
    fireEvent.changeText(textInputs[1], 'Doe');
    fireEvent.changeText(textInputs[2], 'john@test.com');
    fireEvent.changeText(textInputs[3], 'pass');

    const buttons = getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(getByText('Email already exists')).toBeTruthy();
    });
  });

  it('navigates back when sign in link is pressed', () => {
    const props = createProps();
    const { getByText } = render(<RegisterScreen {...props} />);
    fireEvent.press(getByText('Already have an account? Sign in'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
