import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import SermonsScreen from '../screens/Sermons/SermonsScreen';
import VideoPlayerScreen from '../screens/Sermons/VideoPlayerScreen';
import LiveScreen from '../screens/Live/LiveScreen';
import ClipsScreen from '../screens/Clips/ClipsScreen';
import EventsScreen from '../screens/Events/EventsScreen';
import SearchScreen from '../screens/Search/SearchScreen';

import { Colors, FontSize, Spacing } from '../constants/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠', Sermons: '🎬', Live: '🔴', Clips: '⚡', Events: '📅',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {TAB_ICONS[name]}
      </Text>
    </View>
  );
}

// Stack wrapping Home with VideoPlayer
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Koinonia TV', headerRight: SearchBtn }} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function SermonsStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="SermonsMain" component={SermonsScreen} options={{ title: 'Messages', headerRight: SearchBtn }} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="EventsMain" component={EventsScreen} options={{ title: 'Programs & Events' }} />
    </Stack.Navigator>
  );
}

function SearchBtn({ navigation }: any) {
  return (
    <TouchableOpacity onPress={() => navigation?.navigate?.('SearchModal')} style={{ marginRight: Spacing.md }}>
      <Text style={{ color: Colors.accent, fontSize: 20 }}>🔍</Text>
    </TouchableOpacity>
  );
}

const screenOpts = {
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.text,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: FontSize.lg },
  contentStyle: { backgroundColor: Colors.dark },
};

const RootStack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
        <RootStack.Screen
          name="SearchModal"
          component={SearchScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.text,
            headerTitle: 'Search',
            presentation: 'modal',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home"    component={HomeStack}    />
      <Tab.Screen name="Sermons" component={SermonsStack} />
      <Tab.Screen name="Live"    component={LiveScreen}   options={{ headerShown: true, headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.text, headerTitle: '🔴  Live' }} />
      <Tab.Screen name="Clips"   component={ClipsScreen}  options={{ headerShown: false }} />
      <Tab.Screen name="Events"  component={EventsStack}  />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingTop: 4,
    height: 60,
  },
  tabLabel: { fontSize: FontSize.xs, fontWeight: '600', marginTop: -2 },
  tabIcon: { alignItems: 'center', justifyContent: 'center', width: 28, height: 28 },
  tabIconActive: {},
  tabEmoji: { fontSize: 20, opacity: 0.6 },
  tabEmojiActive: { opacity: 1 },
});
