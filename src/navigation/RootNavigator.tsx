import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import CommunitySetupScreen from '../screens/auth/CommunitySetupScreen';
import LockScreen from '../screens/auth/LockScreen';
import LoadingScreen from '../components/LoadingScreen';
import { navigationRef } from './navigationRef';
import { useDeepLinkResolver } from './useDeepLinkResolver';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading, isLocked } = useAuth();
  const [navReady, setNavReady] = useState(false);

  useDeepLinkResolver(navReady);

  if (isLoading) return <LoadingScreen />;

  const hasCommunities = user && user.communities && user.communities.length > 0;

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isLocked ? (
          <Stack.Screen name="Lock" component={LockScreen} />
        ) : hasCommunities ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen
            name="CommunitySetup"
            component={CommunitySetupScreen}
            options={{ headerShown: true, title: 'Get Started' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
