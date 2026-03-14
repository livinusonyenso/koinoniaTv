import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/Home/HomeScreen';
import SermonsScreen from '../screens/Sermons/SermonsScreen';
import VideoPlayerScreen from '../screens/Sermons/VideoPlayerScreen';
import LiveScreen from '../screens/Live/LiveScreen';
import ClipsScreen from '../screens/Clips/ClipsScreen';
import EventsScreen from '../screens/Events/EventsScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import PrayerScreen from '../screens/Prayer/PrayerScreen';
import DeclarationsScreen from '../screens/Declarations/DeclarationsScreen';
import TestimonialsScreen from '../screens/Testimonials/TestimonialsScreen';
import MiracleServiceScreen from '../screens/MiracleService/MiracleServiceScreen';
import EngraftedWordScreen from '../screens/EngraftedWord/EngraftedWordScreen';
import PrayerRequestScreen from '../screens/PrayerRequest/PrayerRequestScreen';
import MomentPlayerScreen from '../screens/MomentPlayer/MomentPlayerScreen';

import { Colors, FontSize, Spacing } from '../constants/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type TabIconName = 'home' | 'play-box-multiple' | 'television-play' | 'book-open-variant' | 'hands-pray';

const TAB_ICONS: Record<string, TabIconName> = {
  Home:    'home',
  Sermons: 'play-box-multiple',
  Live:    'television-play',
  Clips:   'book-open-variant',
  Events:  'hands-pray',
};

const TAB_LABELS: Record<string, string> = {
  Home:    'Home',
  Sermons: 'Sermons',
  Live:    'Live',
  Clips:   'Word',
  Events:  'Prayer',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconName = TAB_ICONS[name] ?? 'home';
  return (
    <View style={styles.tabIconContainer}>
      <MaterialCommunityIcons
        name={iconName}
        size={22}
        color={focused ? Colors.gold : Colors.textMuted}
      />
      {focused && <View style={styles.tabActiveDot} />}
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
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
      <MaterialCommunityIcons name="magnify" size={22} color={Colors.gold} />
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

        {/* Modal screens accessible from anywhere */}
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
        <RootStack.Screen name="Prayer"         component={PrayerScreen}         options={{ headerShown: false }} />
        <RootStack.Screen name="Declarations"   component={DeclarationsScreen}   options={{ headerShown: false }} />
        <RootStack.Screen name="Testimonials"   component={TestimonialsScreen}   options={{ headerShown: false }} />
        <RootStack.Screen name="MiracleService" component={MiracleServiceScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="EngraftedWord"  component={EngraftedWordScreen}  options={{ headerShown: false }} />
        <RootStack.Screen name="PrayerRequest"  component={PrayerRequestScreen}  options={{ headerShown: false }} />
        <RootStack.Screen name="MomentPlayer"  component={MomentPlayerScreen}   options={{ headerShown: false }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 },
        ],
        tabBarShowLabel: true,
        tabBarLabel: TAB_LABELS[route.name] ?? route.name,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home"    component={HomeStack}    />
      <Tab.Screen name="Sermons" component={SermonsStack} />
      <Tab.Screen
        name="Live"
        component={LiveScreen}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerTitle: '🔴  Live',
        }}
      />
      <Tab.Screen name="Clips"  component={ClipsScreen}  options={{ headerShown: false }} />
      <Tab.Screen name="Events" component={EventsStack}  />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
    height: 62,
  },
  tabLabel:         { fontSize: 10, fontWeight: '600', marginTop: 2 },
  tabIconContainer: { alignItems: 'center', justifyContent: 'center', height: 28 },
  tabActiveDot: {
    position: 'absolute',
    bottom: -5,
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
});
