import React from 'react';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TrackersScreen } from '../screens/TrackersScreen';
import { TrackerDetailScreen } from '../screens/TrackerDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TrackerDetail: { trackerId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color }: { name: string; focused: boolean; color: string }) => {
  const icons: Record<string, string> = { Home: '🏠', Trackers: '📋', Settings: '⚙️' };
  return <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 24 }}>{icons[name]}</Text></View>;
};

const MainTabs = () => {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => <TabIcon name={route.name} focused={focused} color={color} />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: { backgroundColor: theme.colors.tabBar, borderTopColor: theme.colors.border },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trackers" component={TrackersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { theme } = useTheme();
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}><Text>Loading...</Text></View>;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="TrackerDetail" component={TrackerDetailScreen} options={{ title: 'Tracker Details' }} />
        </>
      )}
    </Stack.Navigator>
  );
};