import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../../api';
import { SermonCard } from '../../components/common/SermonCard';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { useNetwork } from '../../hooks/useNetworkState';
import { useRefresh } from '../../hooks/useRefresh';
import ErrorState from '../../components/common/ErrorState';

const REFRESH_COLORS = { tint: '#F4C430', colors: ['#F4C430', '#4B2E83'], bg: '#16112A' };

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery]         = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const { isConnected }           = useNetwork();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['search', debouncedQ],
    queryFn: () => searchApi.search(debouncedQ, { limit: 30 }),
    enabled: debouncedQ.length >= 2,
    staleTime: 60000,
  });

  const { refreshing, onRefresh } = useRefresh(refetch);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <SermonCard
        video={item}
        onPress={() =>
          navigation.navigate('Sermons', {
            screen: 'VideoPlayer',
            params: { videoId: item.id },
          })
        }
        style={{ flex: 1 }}
      />
    ),
    [navigation],
  );

  const isNetworkError = !isConnected || (error as any)?.message === 'Network Error';

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search sermons, topics, events..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* States */}
      {debouncedQ.length < 2 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>Search Koinonia TV</Text>
          <Text style={styles.emptyDesc}>
            Search for sermons by topic, scripture, event name, or keyword.
          </Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator color={Colors.gold} size="large" style={{ marginTop: 60 }} />
      ) : isError ? (
        <ErrorState
          type={isNetworkError ? 'network' : 'server'}
          onRetry={refetch}
        />
      ) : data?.total === 0 ? (
        <ErrorState type="notFound" />
      ) : (
        <>
          <Text style={styles.resultsCount}>
            {data?.total} results for "{debouncedQ}"
          </Text>
          <FlatList
            data={data?.items || []}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={REFRESH_COLORS.tint}
                colors={REFRESH_COLORS.colors}
                progressBackgroundColor={REFRESH_COLORS.bg}
              />
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, margin: Spacing.md,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16 },
  input:      { flex: 1, color: Colors.text, fontSize: FontSize.md },
  clearBtn:   { color: Colors.textMuted, fontSize: 16, padding: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyIcon:  { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptyDesc:  { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
  resultsCount: { color: Colors.textMuted, fontSize: FontSize.xs, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  grid: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  row:  { gap: Spacing.sm, marginBottom: Spacing.sm },
});
