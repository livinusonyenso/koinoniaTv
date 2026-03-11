import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

interface Props {
  video: {
    id: number;
    title: string;
    thumbnailUrl: string;
    publishedAt: string;
    durationSeconds: number;
    viewCount?: number;
  };
  onPress: () => void;
  style?: object;
}

function formatDuration(s: number): string {
  if (!s) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const SermonCard: React.FC<Props> = ({ video, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={[styles.card, style]} activeOpacity={0.82}>
    <View style={styles.thumbContainer}>
      <Image source={{ uri: video.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
      {video.durationSeconds > 0 && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.durationSeconds)}</Text>
        </View>
      )}
    </View>
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
      <Text style={styles.date}>{formatDate(video.publishedAt)}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  thumbContainer: { position: 'relative' },
  thumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.surfaceAlt },
  durationBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  durationText: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '600' },
  info: { padding: Spacing.sm },
  title: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', lineHeight: 18, marginBottom: 4 },
  date: { color: Colors.textMuted, fontSize: FontSize.xs },
});
