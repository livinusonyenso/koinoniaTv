import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { videosApi, categoriesApi } from '../../api';
import { SermonCard } from '../../components/common/SermonCard';
import { CategoryPill } from '../../components/common/CategoryPill';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const SORTS: Array<{ label: string; value: 'latest' | 'trending' | 'az' }> = [
  { label: 'Latest',   value: 'latest'   },
  { label: 'Trending', value: 'trending' },
  { label: 'A–Z',      value: 'az'       },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = ['All', ...Array.from({ length: CURRENT_YEAR - 2013 }, (_, i) => String(CURRENT_YEAR - i))];

// ── Skeleton card ──────────────────────────────────────────────────────────────
function SkeletonCard({ style }: { style?: object }) {
  return (
    <View style={[styles.skeletonCard, style]}>
      <View style={styles.skeletonThumb} />
      <View style={styles.skeletonInfo}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '55%', marginTop: 6 }]} />
      </View>
    </View>
  );
}

function SkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ category, onReset }: { category: string; onReset: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="magnify-close" size={52} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No messages found</Text>
      <Text style={styles.emptyText}>
        {category !== 'all'
          ? `No sermons found in this category yet.`
          : 'No sermons match your current filters.'}
      </Text>
      {category !== 'all' && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onReset}>
          <Text style={styles.emptyBtnText}>View All Messages</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function SermonsScreen({ navigation, route }: any) {
  const initCategory = route.params?.category ?? 'all';
  const initSort     = (route.params?.sort ?? 'latest') as 'latest' | 'trending' | 'az';

  const [category, setCategory] = React.useState(initCategory);
  const [sort, setSort]         = React.useState<'latest' | 'trending' | 'az'>(initSort);
  const [year, setYear]         = React.useState('All');

  const queryClient = useQueryClient();

  // ── Categories ──
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
    staleTime: 30 * 60 * 1000,
  });

  const allCats = useMemo(
    () => [{ id: 0, name: 'All', slug: 'all' }, ...(categories ?? [])],
    [categories],
  );

  // ── Prefetch first page for every category when categories load ──
  useEffect(() => {
    if (!categories) return;
    categories.forEach((cat: any) => {
      queryClient.prefetchInfiniteQuery({
        queryKey: ['videos-infinite', cat.slug, 'latest', 'All'],
        queryFn: ({ pageParam }) =>
          videosApi.getAll({ page: pageParam as number, limit: 20, category: cat.slug, sort: 'latest' }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: any, _all: any, lastPageParam: number) =>
          lastPageParam < lastPage.pages ? lastPageParam + 1 : undefined,
        pages: 1,
      });
    });
  }, [categories, queryClient]);

  // ── Infinite videos query ──
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['videos-infinite', category, sort, year],
    queryFn: ({ pageParam }) =>
      videosApi.getAll({
        page: pageParam as number,
        limit: 20,
        category: category !== 'all' ? category : undefined,
        year:     year !== 'All' ? +year : undefined,
        sort,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, _all, lastPageParam: number) =>
      lastPageParam < lastPage.pages ? lastPageParam + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo(
    () => data?.pages.flatMap((p: any) => p.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  // ── Handlers ──
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCategoryChange = useCallback((slug: string) => {
    setCategory(slug);
  }, []);

  const handleReset = useCallback(() => {
    setCategory('all');
    setSort('latest');
    setYear('All');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <SermonCard
        video={item}
        onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
        style={{ flex: 1 }}
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  const ListFooter = isFetchingNextPage
    ? <ActivityIndicator color={Colors.gold} style={styles.footerLoader} />
    : null;

  const ListEmpty = !isLoading
    ? <EmptyState category={category} onReset={handleReset} />
    : null;

  return (
    <View style={styles.container}>

      {/* ── Category tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillRow}
        contentContainerStyle={styles.pillContent}
      >
        {allCats.map((cat: any) => (
          <CategoryPill
            key={cat.slug}
            label={cat.name}
            active={category === cat.slug}
            onPress={() => handleCategoryChange(cat.slug)}
          />
        ))}
      </ScrollView>

      {/* ── Sort + Year filters ── */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterGroup}>
            <MaterialCommunityIcons name="sort" size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
            {SORTS.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.chip, sort === s.value && styles.chipActive]}
                onPress={() => setSort(s.value)}
              >
                <Text style={[styles.chipText, sort === s.value && styles.chipTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={styles.filterDivider} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterGroup}>
            <MaterialCommunityIcons name="calendar-range" size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
            {YEARS.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.chip, year === y && styles.chipActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ── Result count ── */}
      {!isLoading && total > 0 && (
        <Text style={styles.resultsCount}>
          {total.toLocaleString()} {total === 1 ? 'message' : 'messages'}
        </Text>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <SkeletonGrid />
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.grid, items.length === 0 && styles.gridEmpty]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },

  // ── Category pills ──
  pillRow:     { flexShrink: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pillContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs },

  // ── Filter bar ──
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterGroup: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 8, gap: 6,
  },
  filterDivider: { height: 1, backgroundColor: Colors.border },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '500' },
  chipTextActive: { color: Colors.gold, fontWeight: '700' },

  // ── Results count ──
  resultsCount: {
    color: Colors.textMuted, fontSize: FontSize.xs,
    paddingHorizontal: Spacing.md, paddingTop: 8, paddingBottom: 2,
  },

  // ── Grid ──
  grid:      { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 100 },
  gridEmpty: { flex: 1 },
  row:       { gap: Spacing.sm, marginBottom: Spacing.sm },

  // ── Footer loader ──
  footerLoader: { paddingVertical: 20 },

  // ── Empty state ──
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: 60,
  },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginTop: Spacing.md },
  emptyText:  { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  emptyBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.gold,
  },
  emptyBtnText: { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '700' },

  // ── Skeleton ──
  skeletonGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm,
  },
  skeletonCard: {
    width: '47.5%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  skeletonThumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.surfaceAlt },
  skeletonInfo:  { padding: Spacing.sm },
  skeletonLine: {
    width: '85%', height: 11,
    backgroundColor: Colors.surfaceAlt, borderRadius: 4,
  },
});
