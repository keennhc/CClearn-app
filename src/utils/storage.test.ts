import { tokenStorage, preferences } from './storage';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-secure-store');
jest.mock('@react-native-async-storage/async-storage');

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('tokenStorage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gets the token from secure store', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValue('test-token');
    const token = await tokenStorage.get();
    expect(token).toBe('test-token');
    expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
  });

  it('sets the token in secure store', async () => {
    await tokenStorage.set('new-token');
    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'new-token');
  });

  it('removes the token from secure store', async () => {
    await tokenStorage.remove();
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
  });
});

describe('preferences', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gets a value from async storage', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue('value');
    const result = await preferences.get('key');
    expect(result).toBe('value');
    expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('key');
  });

  it('sets a value in async storage', async () => {
    await preferences.set('key', 'value');
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith('key', 'value');
  });

  it('removes a value from async storage', async () => {
    await preferences.remove('key');
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('key');
  });
});
