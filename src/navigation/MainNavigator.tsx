import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/home/HomeScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import CommunityInfoScreen from '../screens/community/CommunityInfoScreen';
import JoinCommunityScreen from '../screens/join/JoinCommunityScreen';
import ChatScreen from '../screens/community/ChatScreen';
import AnnouncementsScreen from '../screens/community/AnnouncementsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import type { HomeStackParamList, MainTabParamList } from './types';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'My Communities' }} />
      <HomeStack.Screen name="Community" component={CommunityScreen} options={{ title: 'Community' }} />
      <HomeStack.Screen name="CommunityInfo" component={CommunityInfoScreen} options={{ title: 'Manage' }} />
      <HomeStack.Screen name="JoinCommunity" component={JoinCommunityScreen} options={{ title: 'Add Community' }} />
    </HomeStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          title: 'Chat',
          headerShown: true,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chat" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AnnouncementsTab"
        component={AnnouncementsScreen}
        options={{
          title: 'Announcements',
          headerShown: true,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bullhorn" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerShown: true,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
