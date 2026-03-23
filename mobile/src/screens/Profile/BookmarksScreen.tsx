import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import SmartImage from '../../components/common/SmartImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { userApi } from '../../api';

// ── Types ─────────────────────────────────────────────────────

type BookmarkItem = {
  id: number;
  videoId: number;
  video: {
    id: number;
    title: string;
    thumbnailUrl: string;
    publishedAt: string;
    durationSeconds: number;
    viewCount: number;
  };
  createdAt: string;
};

// ── Helpers ───────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const GAP   = Spacing.sm;
const PAD   = Spacing.md;
const CARD_W = (SCREEN_W - PAD * 2 - GAP) / 2;

function formatDuration(s: number): string {
  if (!s) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function cleanTitle(title: string): string {
  return title
    .replace(/\|\d{2}\|\d{2}\|\d{4}\|+/g, '')
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Card ──────────────────────────────────────────────────────

function BookmarkCard({
  item,
  onPress,
}: {
  item: BookmarkItem;
  onPress: () => void;
}) {
  const v = item.video;
  return (
    <TouchableOpacity style={[styles.card, { width: CARD_W }]} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.thumbWrap}>
        <SmartImage uri={v.thumbnailUrl} style={styles.thumb} lazy />
        {!!v.durationSeconds && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(v.durationSeconds)}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{cleanTitle(v.title)}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function BookmarksScreen({ navigation }: any) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['bookmarks', { page: 1, limit: 50 }],
    queryFn: () => userApi.getBookmarks({ page: 1, limit: 50 }),
    staleTime: 5 * 60 * 1000,
  });

  const items: BookmarkItem[] = data?.items ?? [];

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
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.countText}>
              {data?.total ?? 0} saved {data?.total === 1 ? 'sermon' : 'sermons'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="bookmark-off-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No saved sermons yet</Text>
            <Text style={styles.emptySub}>Tap the bookmark icon on any sermon to save it here</Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate('Sermons')}
            >
              <Text style={styles.browseBtnText}>Browse Sermons</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <BookmarkCard
            item={item}
            onPress={() =>
              navigation.navigate('VideoPlayer', { videoId: item.video.id })
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

  listContent: {
    padding: PAD,
    gap: GAP,
  },
  emptyContent: {
    flexGrow: 1,
    padding: PAD,
  },
  listHeader: {
    paddingBottom: Spacing.sm,
  },
  countText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceAlt,
  },
  durationBadge: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: 'rgba(0,0,0,0.78)',
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  durationText: { color: Colors.text, fontSize: 10, fontWeight: '600' },
  info: { padding: Spacing.sm },
  title: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 4,
  },
  date: { color: Colors.textMuted, fontSize: 10 },

  // Empty
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
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
    paddingHorizontal: Spacing.xl,
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
