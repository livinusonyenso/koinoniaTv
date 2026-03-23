import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import SmartImage from '../../components/common/SmartImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { userApi } from '../../api';
import { useNetwork } from '../../hooks/useNetworkState';
import { useRefresh } from '../../hooks/useRefresh';
import ErrorState from '../../components/common/ErrorState';

const { width: W } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────
const T = {
  bg:         '#0D0A1A',
  card:       '#16112A',
  cardBorder: '#2D1B55',
  purple:     '#4B2E83',
  purpleGlow: '#6B46C1',
  gold:       '#F4C430',
  goldDim:    '#C49A1044',
  green:      '#22C55E',
  greenDim:   '#22C55E22',
  text:       '#F5F0FF',
  textSub:    '#A89EC9',
  textMute:   '#5E5380',
};

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

// ── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={s.card}>
      <View style={s.skelThumb} />
      <View style={s.skelInfo}>
        <View style={s.skelLine1} />
        <View style={s.skelLine2} />
        <View style={s.skelBar} />
      </View>
    </View>
  );
}

// ── Continue Watching Strip ───────────────────────────────────
function ContinueCard({
  item,
  onPress,
}: {
  item: HistoryItem;
  onPress: () => void;
}) {
  const pct = progressPct(item.progressSeconds, item.video.durationSeconds);

  return (
    <TouchableOpacity
      style={s.continueCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <SmartImage uri={item.video.thumbnailUrl} style={s.continueThumb} lazy />
      {/* gradient over thumb */}
      <LinearGradient
        colors={['transparent', 'rgba(13,10,26,0.92)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Progress bar at bottom of thumb */}
      <View style={s.continueProgressTrack}>
        <View style={[s.continueProgressFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>

      {/* Play button overlay */}
      <View style={s.continuePlayWrap}>
        <View style={s.continuePlayCircle}>
          <MaterialCommunityIcons name="play" size={18} color={T.bg} />
        </View>
      </View>

      {/* Bottom info */}
      <View style={s.continueInfo}>
        <Text style={s.continueTitle} numberOfLines={2}>
          {cleanTitle(item.video.title)}
        </Text>
        <Text style={s.continueLeft}>
          {timeRemaining(item.progressSeconds, item.video.durationSeconds)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── History Row ───────────────────────────────────────────────
function HistoryRow({
  item,
  onPress,
}: {
  item: HistoryItem;
  onPress: () => void;
}) {
  const v          = item.video;
  const pct        = progressPct(item.progressSeconds, v.durationSeconds);
  const inProgress = !item.completed && item.progressSeconds > 0;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={s.thumbWrap}>
        <SmartImage uri={v.thumbnailUrl} style={s.thumb} lazy />

        {/* Dim overlay when completed */}
        {item.completed && (
          <View style={s.completedOverlay}>
            <LinearGradient
              colors={['rgba(34,197,94,0.18)', 'rgba(13,10,26,0.55)']}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        )}

        {/* Duration badge */}
        {!!v.durationSeconds && (
          <View style={s.durationBadge}>
            <Text style={s.durationText}>{formatDuration(v.durationSeconds)}</Text>
          </View>
        )}

        {/* Completed tick */}
        {item.completed && (
          <View style={s.completedTick}>
            <MaterialCommunityIcons name="check" size={11} color="#fff" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>
          {cleanTitle(v.title)}
        </Text>

        {/* Meta row */}
        <View style={s.metaRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={11}
            color={T.textMute}
          />
          <Text style={s.metaText}>{timeAgo(item.watchedAt)}</Text>

          {inProgress && (
            <>
              <View style={s.metaDot} />
              <Text style={[s.metaText, { color: T.gold }]}>
                {timeRemaining(item.progressSeconds, v.durationSeconds)}
              </Text>
            </>
          )}

          {item.completed && (
            <>
              <View style={s.metaDot} />
              <Text style={[s.metaText, { color: T.green }]}>Finished</Text>
            </>
          )}
        </View>

        {/* Progress bar */}
        {!!v.durationSeconds && !item.completed && pct > 0 && (
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
        )}

        {/* Completed bar (full green) */}
        {item.completed && (
          <View style={s.progressTrack}>
            <View style={[s.progressFill, s.progressFillDone, { width: '100%' }]} />
          </View>
        )}

        {/* Resume pill */}
        {inProgress && (
          <View style={s.resumePill}>
            <MaterialCommunityIcons name="play" size={10} color={T.bg} />
            <Text style={s.resumeText}>Resume</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────
export default function HistoryScreen({ navigation }: any) {
  const { isConnected } = useNetwork();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['history', { page: 1, limit: 50 }],
    queryFn: () => userApi.getHistory({ page: 1, limit: 50 }),
    staleTime: 2 * 60 * 1000,
  });
  const { refreshing, onRefresh } = useRefresh(refetch);

  const items: HistoryItem[]      = data?.items ?? [];
  const inProgress: HistoryItem[] = items.filter(
    (i) => !i.completed && i.progressSeconds > 0,
  );

  if (isError && items.length === 0) {
    const isNetworkError = !isConnected || (error as any)?.message === 'Network Error';
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ErrorState type={isNetworkError ? 'network' : 'server'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={T.gold}
            colors={[T.gold, T.purple]}
            progressBackgroundColor={T.card}
          />
        }
        contentContainerStyle={
          items.length === 0 ? s.emptyContent : s.listContent
        }
        ListHeaderComponent={
          <>
            {/* ── Top bar ── */}
            <View style={s.topBar}>
              <View>
                <Text style={s.topBarTitle}>Watch History</Text>
                {items.length > 0 && (
                  <Text style={s.topBarSub}>
                    {data?.total ?? 0} sermons watched
                  </Text>
                )}
              </View>
              {items.length > 0 && (
                <View style={s.topBarBadge}>
                  <MaterialCommunityIcons
                    name="history"
                    size={14}
                    color={T.gold}
                  />
                  <Text style={s.topBarBadgeText}>All time</Text>
                </View>
              )}
            </View>

            {/* ── Skeleton loading ── */}
            {isLoading && (
              <View style={{ paddingTop: Spacing.sm }}>
                {[1, 2, 3, 4].map((k) => <SkeletonCard key={k} />)}
              </View>
            )}

            {/* ── Continue Watching strip ── */}
            {!isLoading && inProgress.length > 0 && (
              <View style={s.continueSection}>
                <View style={s.continueLabelRow}>
                  <View style={s.continueAccent} />
                  <Text style={s.continueLabel}>Continue Watching</Text>
                  <Text style={s.continueCount}>{inProgress.length}</Text>
                </View>

                <FlatList
                  data={inProgress}
                  keyExtractor={(i) => `c-${i.id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.continueList}
                  renderItem={({ item }) => (
                    <ContinueCard
                      item={item}
                      onPress={() =>
                        navigation.navigate('VideoPlayer', {
                          videoId: item.video.id,
                          startAt: item.progressSeconds,
                        })
                      }
                    />
                  )}
                />
              </View>
            )}

            {/* ── All history label ── */}
            {!isLoading && items.length > 0 && (
              <View style={s.allLabelRow}>
                <View style={s.allLabelLine} />
                <Text style={s.allLabel}>ALL HISTORY</Text>
                <View style={s.allLabelLine} />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.emptyWrap}>
              {/* Decorative circle */}
              <View style={s.emptyCircle}>
                <MaterialCommunityIcons
                  name="television-play"
                  size={44}
                  color={T.textMute}
                />
              </View>
              <Text style={s.emptyTitle}>Nothing watched yet</Text>
              <Text style={s.emptySub}>
                Sermons you watch will appear here so you can pick up exactly where you left off
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => navigation.navigate('Sermons')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="play-circle-outline" size={16} color={T.bg} />
                <Text style={s.emptyBtnText}>Browse Sermons</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) =>
          !isLoading ? (
            <HistoryRow
              item={item}
              onPress={() =>
                navigation.navigate('VideoPlayer', {
                  videoId: item.video.id,
                  startAt:
                    item.progressSeconds > 0 ? item.progressSeconds : undefined,
                })
              }
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  listContent:  { paddingBottom: 40 },
  emptyContent: { flexGrow: 1 },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  topBarTitle: {
    color: T.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  topBarSub: {
    color: T.textMute,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  topBarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: T.goldDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: T.gold + '33',
  },
  topBarBadgeText: {
    color: T.gold,
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Continue watching ──
  continueSection: {
    marginBottom: Spacing.md,
  },
  continueLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    marginBottom: 12,
  },
  continueAccent: {
    width: 3,
    height: 16,
    backgroundColor: T.gold,
    borderRadius: 2,
  },
  continueLabel: {
    color: T.text,
    fontSize: FontSize.md,
    fontWeight: '800',
    flex: 1,
  },
  continueCount: {
    color: T.gold,
    fontSize: FontSize.xs,
    fontWeight: '800',
    backgroundColor: T.goldDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  continueList: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    gap: 10,
  },
  continueCard: {
    width: W * 0.52,
    height: 160,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.cardBorder,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  continueThumb: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  continueProgressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: T.gold,
  },
  continuePlayWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  continuePlayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueInfo: {
    padding: 10,
    paddingBottom: 14,
  },
  continueTitle: {
    color: T.text,
    fontSize: FontSize.xs,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 3,
  },
  continueLeft: {
    color: T.gold,
    fontSize: 10,
    fontWeight: '700',
  },

  // ── All history label ──
  allLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 8,
  },
  allLabelLine: {
    flex: 1,
    height: 1,
    backgroundColor: T.cardBorder,
  },
  allLabel: {
    color: T.textMute,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // ── Card ──
  card: {
    flexDirection: 'row',
    backgroundColor: T.card,
    marginHorizontal: Spacing.md,
    marginBottom: 10,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.cardBorder,
  },

  // Thumbnail
  thumbWrap: {
    width: 120,
    position: 'relative',
  },
  thumb: {
    width: 120,
    height: '100%',
    minHeight: 88,
    backgroundColor: T.cardBorder,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: T.text,
    fontSize: 10,
    fontWeight: '600',
  },
  completedTick: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 5,
  },
  title: {
    color: T.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  metaText: {
    color: T.textMute,
    fontSize: 11,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.textMute,
  },

  // Progress bar
  progressTrack: {
    height: 3,
    backgroundColor: T.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: T.gold,
    borderRadius: 2,
  },
  progressFillDone: {
    backgroundColor: T.green,
  },

  // Resume
  resumePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.gold,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  resumeText: {
    color: T.bg,
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Skeleton ──
  skelThumb: {
    width: 120,
    height: 88,
    backgroundColor: T.cardBorder,
  },
  skelInfo: {
    flex: 1,
    padding: 12,
    gap: 8,
    justifyContent: 'center',
  },
  skelLine1: {
    height: 12,
    borderRadius: 6,
    backgroundColor: T.cardBorder,
    width: '90%',
  },
  skelLine2: {
    height: 12,
    borderRadius: 6,
    backgroundColor: T.cardBorder,
    width: '60%',
  },
  skelBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: T.cardBorder,
    width: '75%',
    marginTop: 4,
  },

  // ── Empty ──
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: T.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySub: {
    color: T.textMute,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: T.gold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: Spacing.sm,
  },
  emptyBtnText: {
    color: T.bg,
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
});