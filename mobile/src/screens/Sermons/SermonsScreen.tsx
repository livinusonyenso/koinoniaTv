import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  ActivityIndicator, TextInput, TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { videosApi, categoriesApi } from '../../api';
import { SermonCard } from '../../components/common/SermonCard';
import { CategoryPill } from '../../components/common/CategoryPill';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const SORTS = [
  { label: 'Latest',   value: 'latest'   },
  { label: 'Trending', value: 'trending' },
  { label: 'A–Z',      value: 'az'       },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = ['All', ...Array.from({ length: CURRENT_YEAR - 2013 }, (_, i) => String(CURRENT_YEAR - i))];

export default function SermonsScreen({ navigation, route }: any) {
  const initCategory = route.params?.category || 'all';
  const initSort = route.params?.sort || 'latest';

  const [category, setCategory] = useState(initCategory);
  const [sort, setSort]         = useState<'latest' | 'trending' | 'az'>(initSort);
  const [year, setYear]         = useState('All');
  const [page, setPage]         = useState(1);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
    staleTime: 30 * 60 * 1000,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['videos', category, sort, year, page],
    queryFn: () => videosApi.getAll({
      page,
      limit: 20,
      category: category !== 'all' ? category : undefined,
      year: year !== 'All' ? +year : undefined,
      sort,
    }),
    staleTime: 5 * 60 * 1000,
  });

  const allCats = [{ id: 0, name: 'All', slug: 'all' }, ...(categories || [])];

  return (
    <View style={styles.container}>
      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}
        contentContainerStyle={{ paddingHorizontal: Spacing.md }}>
        {allCats.map((cat: any) => (
          <CategoryPill
            key={cat.slug}
            label={cat.name}
            active={category === cat.slug}
            onPress={() => { setCategory(cat.slug); setPage(1); }}
          />
        ))}
      </ScrollView>

      {/* Sort + Year Row */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SORTS.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.sortBtn, sort === s.value && styles.sortBtnActive]}
              onPress={() => { setSort(s.value as any); setPage(1); }}
            >
              <Text style={[styles.sortLabel, sort === s.value && styles.sortLabelActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {YEARS.map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.sortBtn, year === y && styles.sortBtnActive]}
              onPress={() => { setYear(y); setPage(1); }}
            >
              <Text style={[styles.sortLabel, year === y && styles.sortLabelActive]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results count */}
      {data && (
        <Text style={styles.resultsCount}>{data.total} messages</Text>
      )}

      {/* Grid */}
      {isLoading ? (
        <ActivityIndicator color={Colors.accent} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SermonCard
              video={item}
              onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
              style={{ flex: 1 }}
            />
          )}
          onEndReached={() => {
            if (data && page < data.pages) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetching ? <ActivityIndicator color={Colors.accent} style={{ padding: 20 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  pillRow: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  sortBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  sortBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '500' },
  sortLabelActive: { color: Colors.text },
  resultsCount: { color: Colors.textMuted, fontSize: FontSize.xs, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  grid: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
});
