import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { clipsApi } from '../../api';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function SongsScreen({ navigation }: any) {
  const { data: songs, isLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: () => clipsApi.getAll({ limit: 50 }),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Songs</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      ) : (songs?.length ?? 0) === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="music-note-off" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No songs available yet</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.8}>
              <View style={styles.indexBox}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <MaterialCommunityIcons name="music" size={24} color={Colors.gold} />
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                {!!item.durationSeconds && (
                  <Text style={styles.duration}>{formatDuration(item.durationSeconds)}</Text>
                )}
              </View>
              <MaterialCommunityIcons name="play-circle-outline" size={28} color={Colors.gold} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },

  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  indexBox: {
    width: 24,
    alignItems: 'center',
  },
  indexText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    ...Shadow.card,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  duration: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
