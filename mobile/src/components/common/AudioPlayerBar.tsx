import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { Colors, Radius } from '../../constants/theme';

const TAB_BAR_H = 62;

export default function AudioPlayerBar() {
  const { track, isPlaying, positionMs, durationMs, isLoading, pause, resume, stop } = useAudioPlayer();
  const insets = useSafeAreaInsets();

  if (!track) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { bottom: TAB_BAR_H + insets.bottom }]}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.row}>
        {/* Thumbnail */}
        <Image source={{ uri: track.thumbnailUrl }} style={styles.thumb} />

        {/* Title + time */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
          <Text style={styles.time}>
            {formatTime(positionMs)} / {durationMs > 0 ? formatTime(durationMs) : '--:--'}
          </Text>
        </View>

        {/* Controls */}
        {isLoading ? (
          <ActivityIndicator color={Colors.gold} style={styles.btn} />
        ) : (
          <TouchableOpacity
            style={styles.btn}
            onPress={isPlaying ? pause : resume}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={36}
              color={Colors.gold}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btn} onPress={stop}>
          <MaterialCommunityIcons name="close" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#1A1225',
    borderTopWidth: 1,
    borderTopColor: '#2E1F45',
    zIndex: 9998,
    elevation: 19,
  },
  progressTrack: {
    height: 2,
    backgroundColor: '#2E1F45',
    width: '100%',
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.gold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: '#2E1F45',
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#F5F0FF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  time: {
    color: '#9E8FAA',
    fontSize: 11,
    marginTop: 2,
  },
  btn: {
    padding: 4,
  },
});
