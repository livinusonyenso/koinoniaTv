import React from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { userApi } from '../../api';

// ── Types ─────────────────────────────────────────────────────

type HistoryItem = {
  id: number;
  videoId: number;
  progressSeconds: number;
  completed: boolean;
  watchedAt: string;
  video: {
    id: number;
    title: string;
    thumbnailUrl: string;
    publishedAt: string;
    durationSeconds: number;
  };
};

// ── Helpers ───────────────────────────────────────────────────

function formatDuration(s: number): string {
  if (!s) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (days >= 1) return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  if (mins >= 1)  return `${mins}m ago`;
  return 'Just now';
}

function cleanTitle(title: string): string {
  return title
    .replace(/\|\d{2}\|\d{2}\|\d{4}\|+/g, '')
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function progressPct(progressSeconds: number, durationSeconds: number): number {
  if (!durationSeconds) return 0;
  return Math.min(progressSeconds / durationSeconds, 1);
}

function timeRemaining(progressSeconds: number, durationSeconds: number): string {
  const remaining = Math.max(durationSeconds - progressSeconds, 0);
  if (!remaining) return 'Completed';
  const m = Math.floor(remaining / 60);
  if (m < 1) return 'Almost done';
  return `${m}m left`;
}

// ── Row item ──────────────────────────────────────────────────

function HistoryRow({
  item,
  onPress,
}: {
  item: HistoryItem;
  onPress: () => void;
}) {
  const v       = item.video;
  const pct     = progressPct(item.progressSeconds, v.durationSeconds);
  const inProgress = !item.completed && item.progressSeconds > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        <Image source={{ uri: v.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
        {!!v.durationSeconds && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(v.durationSeconds)}</Text>
          </View>
        )}
        {item.completed && (
          <View style={styles.completedOverlay}>
            <MaterialCommunityIcons name="check-circle" size={28} color={Colors.green} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{cleanTitle(v.title)}</Text>

        <View style={styles.meta}>
          <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.metaText}>{timeAgo(item.watchedAt)}</Text>
          {inProgress && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={[styles.metaText, { color: Colors.gold }]}>
                {timeRemaining(item.progressSeconds, v.durationSeconds)}
              </Text>
            </>
          )}
          {item.completed && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={[styles.metaText, { color: Colors.green }]}>Completed</Text>
            </>
          )}
        </View>

        {/* Progress bar */}
        {!!v.durationSeconds && !item.completed && pct > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
        )}

        {/* Resume button */}
        {inProgress && (
          <TouchableOpacity style={styles.resumeBtn} onPress={onPress} activeOpacity={0.8}>
            <MaterialCommunityIcons name="play" size={12} color={Colors.dark} />
            <Text style={styles.resumeText}>Resume</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function HistoryScreen({ navigation }: any) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['history', { page: 1, limit: 50 }],
    queryFn: () => userApi.getHistory({ page: 1, limit: 50 }),
    staleTime: 2 * 60 * 1000,
  });

  const items: HistoryItem[] = data?.items ?? [];
  const inProgress = items.filter((i) => !i.completed && i.progressSeconds > 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.listHeader}>
              {/* Continue watching strip */}
              {inProgress.length > 0 && (
                <View style={styles.continueSection}>
                  <Text style={styles.continueSectionTitle}>Continue Watching</Text>
                  <Text style={styles.continueSectionSub}>
                    {inProgress.length} in progress
                  </Text>
                </View>
              )}
              <Text style={styles.countText}>
                {data?.total ?? 0} {data?.total === 1 ? 'video' : 'videos'} watched
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="television-play" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No watch history yet</Text>
            <Text style={styles.emptySub}>
              Sermons you watch will appear here so you can easily pick up where you left off
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate('Sermons')}
            >
              <Text style={styles.browseBtnText}>Browse Sermons</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <HistoryRow
            item={item}
            onPress={() =>
              navigation.navigate('VideoPlayer', {
                videoId: item.video.id,
                startAt: item.progressSeconds > 0 ? item.progressSeconds : undefined,
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent:  { paddingBottom: Spacing.xxl },
  emptyContent: { flexGrow: 1 },

  listHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  continueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  continueSectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  continueSectionSub: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  countText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  thumbWrap: {
    position: 'relative',
    width: 130,
  },
  thumb: {
    width: 130,
    height: '100%',
    minHeight: 80,
    backgroundColor: Colors.surfaceAlt,
  },
  durationBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.78)',
    paddingHorizontal: 4, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  durationText: { color: Colors.text, fontSize: 10, fontWeight: '600' },
  completedOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info
  info: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  metaDot: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  // Progress
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },

  // Resume
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  resumeText: {
    color: Colors.dark,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Empty
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
  },
  browseBtnText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
});
