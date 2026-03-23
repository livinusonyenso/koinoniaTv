import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const BANNER_H = 56;
const GOLD     = '#F4C430';
const BG       = '#1A1400';

// Module-level flag: show the slow-connection banner only once per JS bundle
// session (i.e. once per app run, not once per mount).
let shownThisSession = false;

interface Props {
  isSlowConnection: boolean;
  isConnected: boolean;
}

/**
 * Shows once per app session when the device is on a slow (2G/EDGE) connection.
 * Auto-dismisses after 5 seconds. Never shown again until the app is restarted.
 */
export default function SlowConnectionBanner({ isSlowConnection, isConnected }: Props) {
  const insets   = useSafeAreaInsets();
  const slideY   = useRef(new Animated.Value(-BANNER_H)).current;
  const shown    = useRef(false); // component-level guard

  useEffect(() => {
    // Only show when slow AND connected (not when fully offline — OfflineBanner handles that)
    if (!isSlowConnection || !isConnected) return;
    if (shownThisSession || shown.current) return;

    shownThisSession = true;
    shown.current    = true;

    // Slide in
    Animated.timing(slideY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 5 s
    const timer = setTimeout(() => {
      Animated.timing(slideY, {
        toValue: -BANNER_H,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isSlowConnection, isConnected]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top, transform: [{ translateY: slideY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.leftBorder} />
      <MaterialCommunityIcons name="speedometer-slow" size={20} color={GOLD} style={styles.icon} />
      <View style={styles.textCol}>
        <Text style={styles.title}>Slow connection detected</Text>
        <Text style={styles.sub}>Content may take longer to load</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: BANNER_H,
    backgroundColor: BG,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9998,
    elevation: 19,
  },
  leftBorder: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: GOLD,
  },
  icon: {
    marginHorizontal: 12,
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: '#F5F0FF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  sub: {
    color: '#9E8FAA',
    fontSize: 11,
    marginTop: 1,
  },
});
