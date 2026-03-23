import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const BANNER_H = 56;
const RED      = '#EF4444';
const BG       = '#1A0A0A';

interface Props {
  isConnected: boolean;
}

/**
 * Slides down from the top when the device goes offline.
 * Positioned absolutely so it overlays screen content — never pushes it down.
 * Auto-dismisses 3 seconds after the connection is restored.
 */
export default function OfflineBanner({ isConnected }: Props) {
  const insets   = useSafeAreaInsets();
  const slideY   = useRef(new Animated.Value(-BANNER_H)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!isConnected) {
      // Slide down into view
      Animated.timing(slideY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Wait 3 s then slide back up
      timerRef.current = setTimeout(() => {
        Animated.timing(slideY, {
          toValue: -BANNER_H,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 3000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isConnected]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top, transform: [{ translateY: slideY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.leftBorder} />
      <MaterialCommunityIcons name="wifi-off" size={20} color={RED} style={styles.icon} />
      <View style={styles.textCol}>
        <Text style={styles.title}>No internet connection</Text>
        <Text style={styles.sub}>Showing cached content</Text>
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
    zIndex: 9999,
    elevation: 20,
  },
  leftBorder: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: RED,
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
