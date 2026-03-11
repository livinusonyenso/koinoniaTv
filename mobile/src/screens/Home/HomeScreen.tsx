import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, Image, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { videosApi, categoriesApi, eventsApi, clipsApi } from '../../api';
import { SermonCard } from '../../components/common/SermonCard';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.44;

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { data: featured, isLoading: loadingFeatured, refetch: refetchFeatured } =
    useQuery({ queryKey: ['featured'], queryFn: videosApi.getFeatured, staleTime: 5 * 60 * 1000 });

  const { data: latest, refetch: refetchLatest } =
    useQuery({ queryKey: ['latest'], queryFn: () => videosApi.getLatest(8), staleTime: 5 * 60 * 1000 });

  const { data: trending, refetch: refetchTrending } =
    useQuery({ queryKey: ['trending'], queryFn: () => videosApi.getTrending(8), staleTime: 5 * 60 * 1000 });

  const { data: categories } =
    useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll, staleTime: 30 * 60 * 1000 });

  const { data: upcomingEvents } =
    useQuery({ queryKey: ['events-upcoming'], queryFn: eventsApi.getUpcoming, staleTime: 10 * 60 * 1000 });

  const { data: featuredClips } =
    useQuery({ queryKey: ['clips-featured'], queryFn: clipsApi.getFeatured, staleTime: 10 * 60 * 1000 });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFeatured(), refetchLatest(), refetchTrending()]);
    setRefreshing(false);
  }, []);

  const hero = featured?.[0];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    >
      {/* ── Hero Banner ── */}
      {loadingFeatured ? (
        <View style={styles.heroSkeleton}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : hero ? (
        <TouchableOpacity
          style={styles.hero}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('VideoPlayer', { videoId: hero.id })}
        >
          <Image source={{ uri: hero.thumbnailUrl }} style={styles.heroBg} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>✦  FEATURED</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{hero.title}</Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => navigation.navigate('VideoPlayer', { videoId: hero.id })}
            >
              <Text style={styles.heroBtnText}>▶  Watch Now</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* ── Categories Grid ── */}
      {categories?.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Browse by Topic" onSeeAll={() => navigation.navigate('Sermons')} />
          <View style={styles.catGrid}>
            {categories.slice(0, 8).map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catCard, { borderColor: cat.colorHex || Colors.accent }]}
                onPress={() => navigation.navigate('Sermons', { category: cat.slug })}
                activeOpacity={0.8}
              >
                <View style={[styles.catDot, { backgroundColor: cat.colorHex || Colors.accent }]} />
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catCount}>{cat.videoCount || 0} messages</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Latest Sermons ── */}
      {latest?.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Latest Messages" onSeeAll={() => navigation.navigate('Sermons', { sort: 'latest' })} />
          <FlatList
            data={latest}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: Spacing.md }}
            renderItem={({ item }) => (
              <SermonCard
                video={item}
                onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
                style={{ width: CARD_W, marginRight: Spacing.sm }}
              />
            )}
          />
        </View>
      )}

      {/* ── Trending ── */}
      {trending?.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Trending This Week" onSeeAll={() => navigation.navigate('Sermons', { sort: 'trending' })} />
          <FlatList
            data={trending}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: Spacing.md }}
            renderItem={({ item }) => (
              <SermonCard
                video={item}
                onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
                style={{ width: CARD_W, marginRight: Spacing.sm }}
              />
            )}
          />
        </View>
      )}

      {/* ── Upcoming Event Banner ── */}
      {upcomingEvents?.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Upcoming Programs" onSeeAll={() => navigation.navigate('Events')} />
          {upcomingEvents.slice(0, 2).map((ev: any) => (
            <TouchableOpacity
              key={ev.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('Events', { screen: 'EventDetail', params: { eventId: ev.id } })}
            >
              <View style={styles.eventLeft}>
                <Text style={styles.eventType}>{ev.eventType.toUpperCase()}</Text>
                <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                <Text style={styles.eventDate}>
                  {new Date(ev.startDatetime).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'long', day: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={styles.eventArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Featured Clips Row ── */}
      {featuredClips?.length > 0 && (
        <View style={[styles.section, { marginBottom: Spacing.xxl }]}>
          <SectionHeader title="Short Clips" onSeeAll={() => navigation.navigate('Clips')} />
          <FlatList
            data={featuredClips}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: Spacing.md }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.clipCard}
                onPress={() => navigation.navigate('Clips')}
                activeOpacity={0.85}
              >
                <Image source={{ uri: item.thumbnailUrl || item.video?.thumbnailUrl }} style={styles.clipThumb} />
                <View style={styles.clipOverlay}>
                  <Text style={styles.clipPlay}>▶</Text>
                </View>
                <View style={styles.clipInfo}>
                  <Text style={styles.clipTitle} numberOfLines={2}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  heroSkeleton: { height: 280, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  hero: { height: 300, position: 'relative' },
  heroBg: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0)',
    // gradient simulation
  },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.sm, marginBottom: 8,
  },
  heroBadgeText: { color: Colors.dark, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.sm, lineHeight: 26 },
  heroBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderRadius: Radius.pill, alignSelf: 'flex-start',
  },
  heroBtnText: { color: Colors.dark, fontSize: FontSize.sm, fontWeight: '800' },

  section: { marginTop: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  seeAll: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '600' },

  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
  },
  catCard: {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.sm,
    borderLeftWidth: 3,
  },
  catDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  catName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: 2 },
  catCount: { color: Colors.textMuted, fontSize: FontSize.xs },

  eventCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.accent,
  },
  eventLeft: { flex: 1 },
  eventType: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  eventTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: 4 },
  eventDate: { color: Colors.textMuted, fontSize: FontSize.sm },
  eventArrow: { color: Colors.textMuted, fontSize: 24, marginLeft: Spacing.sm },

  clipCard: { width: 140, marginRight: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.card },
  clipThumb: { width: '100%', height: 200, backgroundColor: Colors.surfaceAlt },
  clipOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  clipPlay: { color: Colors.text, fontSize: 28 },
  clipInfo: { padding: Spacing.xs },
  clipTitle: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '500' },
});
