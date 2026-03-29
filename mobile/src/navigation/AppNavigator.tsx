import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
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
import SongsScreen from '../screens/Songs/SongsScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import BookmarksScreen from '../screens/Profile/BookmarksScreen';
import HistoryScreen from '../screens/Profile/HistoryScreen';

// Auth screens
import AuthModal from '../screens/Auth/AuthModal';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

import { Colors, FontSize, Spacing } from '../constants/theme';
import { AuthProvider, useAuthStore } from '../store/authStore';

// ── Navigator instances ────────────────────────────────────────

const Tab           = createBottomTabNavigator();
const RootStack     = createNativeStackNavigator();
const Stack         = createNativeStackNavigator();
const AuthStack     = createNativeStackNavigator();

// ── Tab config ────────────────────────────────────────────────

type TabIconName =
  | 'home'
  | 'play-box-multiple'
  | 'television-play'
  | 'book-open-variant'
  | 'hands-pray'
  | 'account-circle-outline';

const TAB_ICONS: Record<string, TabIconName> = {
  Home:    'home',
  Sermons: 'play-box-multiple',
  Live:    'television-play',
  Clips:   'book-open-variant',
  Events:  'hands-pray',
  Profile: 'account-circle-outline',
};

const TAB_LABELS: Record<string, string> = {
  Home:    'Home',
  Sermons: 'Sermons',
  Live:    'Live',
  Clips:   'Word',
  Events:  'Prayer',
  Profile: 'Profile',
};

const screenOpts = {
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.text,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: FontSize.lg },
  contentStyle: { backgroundColor: Colors.dark },
};

// ── Tab icon ──────────────────────────────────────────────────

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

// ── Sub-stacks ────────────────────────────────────────────────

function SearchBtn({ navigation }: any) {
  return (
    <TouchableOpacity
      onPress={() => navigation?.navigate?.('SearchModal')}
      style={{ marginRight: Spacing.md }}
    >
      <MaterialCommunityIcons name="magnify" size={22} color={Colors.gold} />
    </TouchableOpacity>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="HomeMain"    component={HomeScreen}        options={{ headerShown: false }} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function SermonsStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="SermonsMain" component={SermonsScreen}     options={{ title: 'Messages', headerRight: SearchBtn }} />
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

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="Bookmarks"   component={BookmarksScreen} options={{ title: 'Saved Sermons' }} />
      <Stack.Screen name="History"     component={HistoryScreen}   options={{ title: 'Watch History' }} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

// ── Auth inner stack (inside the modal) ───────────────────────

function AuthInnerStack() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="AuthPrompt" component={AuthModal}       />
      <AuthStack.Screen name="Login"      component={LoginScreen}     />
      <AuthStack.Screen name="Register"   component={RegisterScreen}  />
    </AuthStack.Navigator>
  );
}

// ── Main tabs (always visible) ────────────────────────────────

function MainTabs() {
  const insets = useSafeAreaInsets();
  // On Android the bottom inset covers gesture nav bar or button nav bar.
  // We must expand the tab bar height to include it — padding alone doesn't
  // work when a fixed height is set because padding gets consumed inside it.
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 62 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: bottomInset,
          },
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
      <Tab.Screen name="Clips"   component={ClipsScreen}   options={{ headerShown: false }} />
      <Tab.Screen name="Events"  component={EventsStack}   />
      <Tab.Screen name="Profile" component={ProfileStack}  />
    </Tab.Navigator>
  );
}

// ── Splash screen ─────────────────────────────────────────────

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <MaterialCommunityIcons name="television-play" size={52} color={Colors.gold} />
      <Text style={styles.splashWordmark}>KOINONIA TV</Text>
      <ActivityIndicator color={Colors.gold} size="small" style={{ marginTop: Spacing.xl }} />
    </View>
  );
}

// ── Root navigator ─────────────────────────────────────────────
//  - Main tabs are ALWAYS accessible (guest mode)
//  - AuthModal slides up over the app when triggered by useRequireAuth

function RootNavigator() {
  const { authState, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (authState === 'loading') return <SplashScreen />;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* ── Always-visible app ── */}
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
      <RootStack.Screen name="Prayer"         component={PrayerScreen}         options={{ headerShown: false }} />
      <RootStack.Screen name="Declarations"   component={DeclarationsScreen}   options={{ headerShown: false }} />
      <RootStack.Screen name="Testimonials"   component={TestimonialsScreen}   options={{ headerShown: false }} />
      <RootStack.Screen name="MiracleService" component={MiracleServiceScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="EngraftedWord"  component={EngraftedWordScreen}  options={{ headerShown: false }} />
      <RootStack.Screen name="PrayerRequest"  component={PrayerRequestScreen}  options={{ headerShown: false }} />
      <RootStack.Screen name="MomentPlayer"   component={MomentPlayerScreen}   options={{ headerShown: false }} />
      <RootStack.Screen name="Songs"          component={SongsScreen}          options={{ headerShown: false }} />
      <RootStack.Screen name="Notifications"  component={NotificationsScreen}  options={{ headerShown: false }} />

      {/* ── Auth modal — slides up from bottom ── */}
      <RootStack.Screen
        name="AuthModal"
        component={AuthInnerStack}
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
      />
    </RootStack.Navigator>
  );
}

// ── App entry point ───────────────────────────────────────────

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabLabel:         { fontSize: 10, fontWeight: '600', marginTop: 2 },
  tabIconContainer: { alignItems: 'center', justifyContent: 'center', height: 28 },
  tabActiveDot: {
    position: 'absolute', bottom: -5,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  splash: {
    flex: 1, backgroundColor: Colors.dark,
    alignItems: 'center', justifyContent: 'center',
  },
  splashWordmark: {
    color: Colors.gold, fontSize: FontSize.xxl,
    fontWeight: '900', letterSpacing: 3, marginTop: Spacing.md,
  },
});
