
import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import SmartImage from '../../components/common/SmartImage';
import { prefetchThumbnails } from '../../utils/performance';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { videosApi, categoriesApi, eventsApi } from '../../api';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import { useNetwork } from '../../hooks/useNetworkState';
import ErrorState from '../../components/common/ErrorState';

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const SERMON_CARD_W = SCREEN_W * 0.60;
// Peek: show leading edge of next card so users know the row scrolls
const SERMON_PEEK_PADDING = SCREEN_W - SERMON_CARD_W - Spacing.md - 20;

const SCRIPTURES = [
  { verse: '"Faith comes by hearing, and hearing by the word of God."', ref: 'Romans 10:17' },
  { verse: '"I can do all things through Christ who strengthens me."', ref: 'Philippians 4:13' },
  { verse: '"The Lord is my shepherd; I shall not want."', ref: 'Psalm 23:1' },
  { verse: '"Trust in the Lord with all your heart and lean not on your own understanding."', ref: 'Proverbs 3:5' },
  { verse: '"For God so loved the world that He gave His only begotten Son."', ref: 'John 3:16' },
  { verse: '"No weapon formed against you shall prosper."', ref: 'Isaiah 54:17' },
  { verse: '"Greater is He that is in you than he that is in the world."', ref: '1 John 4:4' },
];

// [L5] Day-of-year index for true daily rotation (not day-of-week)
function getDailyScripture() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return SCRIPTURES[dayOfYear % SCRIPTURES.length];
}

const QUICK_ACCESS: Array<{
  id: string;
  label: string;
  icon: string;
  bg: string;
  accentColor: string;
  screen: string;
}> = [
  { id: 'prayer',       label: 'Prayer',          icon: 'hands-pray',          bg: '#1E1035', accentColor: '#9B72E0', screen: 'Prayer'         },
  { id: 'declarations', label: 'Declarations',    icon: 'bullhorn',             bg: '#0D1F3C', accentColor: '#5B9BD5', screen: 'Declarations'   },
  { id: 'testimonies',  label: 'Testimonies',     icon: 'star-circle',          bg: '#0B2E18', accentColor: '#4CAF6E', screen: 'Testimonials'   },
  { id: 'miracle',      label: 'Miracle',         icon: 'lightning-bolt',       bg: '#2D1206', accentColor: '#E07B3A', screen: 'MiracleService' },
  { id: 'word',         label: 'Engrafted Word',  icon: 'book-open-variant',    bg: '#1E0D3C', accentColor: '#B388FF', screen: 'EngraftedWord'  },
  { id: 'request',      label: 'Prayer Request',  icon: 'email-heart-outline',  bg: '#002626', accentColor: '#4DB6AC', screen: 'PrayerRequest'  },
  { id: 'songs',        label: 'Songs',           icon: 'music-note-whole',     bg: '#0D1B2A', accentColor: '#64B5F6', screen: 'Songs'          },
  { id: 'events',       label: 'Events',          icon: 'calendar-star',        bg: '#17093A', accentColor: '#CE93D8', screen: 'Events'         },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function cleanTitle(title: string) {
  return title
    .replace(/\|\d{2}\|\d{2}\|\d{4}\|+/g, '')
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Skeleton components ──────────────────────────────────────────────────────

// [H5] Skeleton for horizontal sermon rows
function RowSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonThumb} />
          <View style={styles.skeletonInfo}>
            <View style={[styles.skeletonLine, { width: '88%' }]} />
            <View style={[styles.skeletonLine, { width: '60%', marginTop: 6 }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

// [H5] Skeleton for category grid
function CategorySkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.catGrid, { opacity }]}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.catCard, { borderLeftColor: Colors.border }]}>
          <View style={[styles.skeletonLine, { width: '70%', height: 13 }]} />
          <View style={[styles.skeletonLine, { width: '40%', marginTop: 6, height: 10 }]} />
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const scripture = getDailyScripture(); // [L5] daily rotation by date
  const { isConnected } = useNetwork();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Live badge pulse animation
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  const {
    data: latest,
    isLoading: loadingLatest,
    isError: latestError,
    error: latestErr,
    refetch: refetchLatest,
  } = useQuery({
    queryKey: ['latest'],
    queryFn: () => videosApi.getLatest(10),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trending, isLoading: loadingTrending, refetch: refetchTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => videosApi.getTrending(8),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories, isLoading: loadingCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
    staleTime: 30 * 60 * 1000,
  });

  const { data: upcomingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: eventsApi.getUpcoming,
    staleTime: 10 * 60 * 1000,
  });

  // [C1] All hooks BEFORE the conditional error return
  // [L3] onRefresh now refetches all four queries
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchLatest(),
      refetchTrending(),
      refetchCategories(),
      refetchEvents(),
    ]);
    setRefreshing(false);
  }, [refetchLatest, refetchTrending, refetchCategories, refetchEvents]);

  // Prefetch thumbnails once data arrives
  useEffect(() => {
    if (latest && latest.length > 1) {
      prefetchThumbnails(latest.slice(1).map((v: any) => v.thumbnailUrl));
    }
  }, [latest]);

  useEffect(() => {
    if (trending && trending.length > 0) {
      prefetchThumbnails(trending.map((v: any) => v.thumbnailUrl));
    }
  }, [trending]);

  // [C1] Error guard AFTER all hooks
  if (latestError && !latest) {
    const isNetworkError =
      !isConnected || (latestErr as any)?.message === 'Network Error';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark }} edges={['top']}>
        <ErrorState
          type={isNetworkError ? 'network' : 'server'}
          onRetry={refetchLatest}
        />
      </SafeAreaView>
    );
  }

  const hero = latest?.[0];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>K</Text>
            </View>
            <View>
              <Text style={styles.logoText}>Koinonia TV</Text>
              <Text style={styles.greetSub}>Grow in Faith Daily</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            {/* [H2] accessibilityLabel + accessibilityRole on all icon buttons */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('SearchModal')}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <MaterialCommunityIcons name="magnify" size={22} color={Colors.textSecond} />
            </TouchableOpacity>
            {/* [H3] Bell is now wired up */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={Colors.textSecond} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero Banner ── */}
        {loadingLatest ? (
          <View style={styles.heroSkeleton}>
            <ActivityIndicator color={Colors.gold} size="large" />
            <Text style={styles.skeletonText}>Loading messages…</Text>
          </View>
        ) : hero ? (
          /* [C2] Outer container is plain View — no nested TouchableOpacity */
          <View style={styles.hero}>
            <SmartImage uri={hero.thumbnailUrl} style={styles.heroBg} lazy={false} />
            {/* Layered gradient overlays for depth */}
            <View style={styles.heroTopFade} />
            <View style={styles.heroBottomFade} />
            <View style={styles.heroContent}>
              {/* Animated live badge */}
              <View style={styles.heroBadgeRow}>
                <Animated.View style={[styles.heroBadgeDot, { opacity: pulseAnim }]} />
                <Text style={styles.heroBadgeText}>LATEST MESSAGE</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {cleanTitle(hero.title)}
              </Text>
              <View style={styles.heroMeta}>
                {!!hero.durationSeconds && (
                  <View style={styles.heroMetaChip}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textSecond} />
                    <Text style={styles.heroMetaText}> {formatDuration(hero.durationSeconds)}</Text>
                  </View>
                )}
                {!!hero.viewCount && (
                  <View style={styles.heroMetaChip}>
                    <MaterialCommunityIcons name="eye-outline" size={12} color={Colors.textSecond} />
                    <Text style={styles.heroMetaText}>
                      {' '}{Number(hero.viewCount).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
              {/* [C2] Single intentional CTA — [H1] min 44pt — [H2] labelled */}
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => navigation.navigate('VideoPlayer', { videoId: hero.id })}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={`Watch ${cleanTitle(hero.title)}`}
              >
                <MaterialCommunityIcons name="play" size={16} color={Colors.dark} />
                <Text style={styles.heroBtnText}>Watch Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ── Spiritual Tools ── */}
        <View style={styles.section}>
          {/* [H4] sectionTitle no longer has baked-in paddingHorizontal */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spiritual Tools</Text>
          </View>
          {/* Redesigned: 4-column grid, accent-coloured icon circle */}
          <View style={styles.qaGrid}>
            {QUICK_ACCESS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.qaCard, { backgroundColor: item.bg }]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.qaIconCircle, { backgroundColor: item.accentColor + '22' }]}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={24}
                    color={item.accentColor}
                  />
                </View>
                <Text style={styles.qaLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Word for Today ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Word for Today</Text>
          </View>
          <View style={styles.scriptureCard}>
            {/* Full-width gold accent bar */}
            <View style={styles.scriptureAccentBar} />
            <View style={styles.scriptureBody}>
              <Text style={styles.scriptureVerse}>{scripture.verse}</Text>
              <Text style={styles.scriptureRef}>{scripture.ref}</Text>
              <View style={styles.scriptureBtns}>
                {/* [H1] min 44pt height on scripture buttons */}
                <TouchableOpacity
                  style={styles.scriptureBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Share this verse"
                >
                  <MaterialCommunityIcons name="share-variant" size={16} color={Colors.gold} />
                  <Text style={styles.scriptureBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scriptureBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Save this verse"
                >
                  <MaterialCommunityIcons name="bookmark-outline" size={16} color={Colors.gold} />
                  <Text style={styles.scriptureBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ── Latest Messages ── */}
        <View style={styles.section}>
          {/* [H4] sectionRow now owns the single paddingHorizontal */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Latest Messages</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Sermons', { sort: 'latest' })}
              accessibilityRole="button"
              accessibilityLabel="See all latest messages"
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {/* [H5] Skeleton while loading */}
          {loadingLatest ? (
            <RowSkeleton />
          ) : (latest?.length ?? 0) > 1 ? (
            /* [L1] nestedScrollEnabled for Android; [L2] snap + peek padding */
            <FlatList
              data={latest!.slice(1)}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              snapToInterval={SERMON_CARD_W + Spacing.sm}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingLeft: Spacing.md,
                paddingRight: SERMON_PEEK_PADDING,
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sermonCard}
                  activeOpacity={0.82}
                  onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${cleanTitle(item.title)}${item.durationSeconds ? `, ${formatDuration(item.durationSeconds)}` : ''}`}
                >
                  {/* [L4] Wrap in relative View so durationBadge bottom:8 is relative to the image */}
                  <View style={styles.sermonThumbWrap}>
                    <SmartImage uri={item.thumbnailUrl} style={styles.sermonThumb} lazy />
                    {!!item.durationSeconds && (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{formatDuration(item.durationSeconds)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.sermonInfo}>
                    <Text style={styles.sermonTitle} numberOfLines={2}>
                      {cleanTitle(item.title)}
                    </Text>
                    <Text style={styles.sermonViews}>
                      {Number(item.viewCount || 0).toLocaleString()} views
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : null}
        </View>

        {/* ── Browse by Topic ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Browse by Topic</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Sermons')}
              accessibilityRole="button"
              accessibilityLabel="See all topics"
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {/* [H5] Skeleton while loading */}
          {loadingCategories ? (
            <CategorySkeleton />
          ) : (categories?.length ?? 0) > 0 ? (
            <View style={styles.catGrid}>
              {categories!.slice(0, 6).map((cat: any) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catCard, { borderLeftColor: cat.colorHex || Colors.gold }]}
                  onPress={() => navigation.navigate('Sermons', { category: cat.slug })}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${cat.name}, ${cat.videoCount ?? 0} messages`}
                >
                  <View style={styles.catCardInner}>
                    <View style={styles.catLeft}>
                      <View
                        style={[
                          styles.catDot,
                          { backgroundColor: cat.colorHex || Colors.gold },
                        ]}
                      />
                      <Text style={styles.catName}>{cat.name}</Text>
                    </View>
                    <View
                      style={[
                        styles.catCountBadge,
                        { backgroundColor: (cat.colorHex || Colors.gold) + '22' },
                      ]}
                    >
                      <Text
                        style={[styles.catCount, { color: cat.colorHex || Colors.gold }]}
                      >
                        {cat.videoCount ?? 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {/* ── Upcoming Programs ── */}
        {(upcomingEvents?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Upcoming Programs</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Events')}
                accessibilityRole="button"
                accessibilityLabel="See all upcoming programs"
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingEvents!.slice(0, 2).map((ev: any) => {
              const d = new Date(ev.startDatetime);
              const day = d.toLocaleDateString('en-US', { day: 'numeric' });
              const month = d.toLocaleDateString('en-US', { month: 'short' });
              const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('Events')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${ev.title}, ${weekday} ${month} ${day}`}
                >
                  {/* Redesigned: date block on left */}
                  <View style={styles.eventDateBlock}>
                    <Text style={styles.eventDateDay}>{day}</Text>
                    <Text style={styles.eventDateMonth}>{month.toUpperCase()}</Text>
                  </View>
                  <View style={styles.eventRight}>
                    <Text style={styles.eventType}>
                      {(ev.eventType || 'EVENT').toUpperCase()}
                    </Text>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {ev.title}
                    </Text>
                    <Text style={styles.eventWeekday}>{weekday}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Trending This Week ── */}
        <View style={[styles.section, styles.sectionLast]}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Trending This Week</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Sermons', { sort: 'trending' })}
              accessibilityRole="button"
              accessibilityLabel="See all trending messages"
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {/* [H5] Skeleton while loading */}
          {loadingTrending ? (
            <RowSkeleton />
          ) : (trending?.length ?? 0) > 0 ? (
            <FlatList
              data={trending}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              snapToInterval={SERMON_CARD_W + Spacing.sm}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingLeft: Spacing.md,
                paddingRight: SERMON_PEEK_PADDING,
              }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.sermonCard}
                  activeOpacity={0.82}
                  onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${cleanTitle(item.title)}${item.durationSeconds ? `, ${formatDuration(item.durationSeconds)}` : ''}`}
                >
                  <View style={styles.sermonThumbWrap}>
                    <SmartImage uri={item.thumbnailUrl} style={styles.sermonThumb} lazy />
                    {/* Trending rank badge */}
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    {!!item.durationSeconds && (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                          {formatDuration(item.durationSeconds)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.sermonInfo}>
                    <Text style={styles.sermonTitle} numberOfLines={2}>
                      {cleanTitle(item.title)}
                    </Text>
                    <Text style={styles.sermonViews}>
                      {Number(item.viewCount || 0).toLocaleString()} views
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1, backgroundColor: Colors.dark },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: { color: Colors.gold, fontSize: FontSize.lg, fontWeight: '900' },
  logoText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  greetSub: { color: Colors.gold, fontSize: 10, fontWeight: '500', marginTop: 1 },
  headerIcons: { flexDirection: 'row', gap: Spacing.xs },

  // [H1] iconBtn — 44×44 (was 36×36)
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero ──
  hero: { height: 300, position: 'relative' },
  heroBg: { width: '100%', height: '100%', position: 'absolute' },
  heroTopFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(13,10,20,0.45)',
  },
  heroBottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(13,10,20,0.9)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  // Redesigned badge: dot + text
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  heroBadgeText: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    lineHeight: 28,
  },
  heroMeta: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  heroMetaText: { color: Colors.textSecond, fontSize: FontSize.xs },
  // [H1] heroBtn: paddingVertical 12 → comfortably over 44pt
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  heroBtnText: { color: Colors.dark, fontSize: FontSize.sm, fontWeight: '800' },
  heroSkeleton: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  skeletonText: { color: Colors.textMuted, fontSize: FontSize.sm },

  // ── Section structure ──
  // [H4] sectionTitle NO longer has paddingHorizontal — prevents double-indent
  section: { marginTop: Spacing.lg },
  sectionLast: { marginBottom: 48 },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  // [H1] seeAllBtn has paddingVertical for 44pt tap area
  seeAllBtn: {
    paddingVertical: 10,
    paddingLeft: Spacing.sm,
  },
  seeAll: { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '600' },

  // ── Quick Access grid ──
  // Redesigned: 4-column
  qaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  qaCard: {
    width: '22.5%',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    minHeight: 88,
    justifyContent: 'center',
  },
  qaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    opacity: 0.9,
  },

  // ── Scripture ──
  scriptureCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  // Full-width gold stripe at top
  scriptureAccentBar: {
    height: 3,
    backgroundColor: Colors.gold,
  },
  scriptureBody: {
    padding: Spacing.md,
  },
  scriptureVerse: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  scriptureRef: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  scriptureBtns: { flexDirection: 'row', gap: Spacing.sm },
  // [H1] scriptureBtn minHeight 44pt
  scriptureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scriptureBtnText: {
    color: Colors.textSecond,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // ── Sermon cards ──
  sermonCard: {
    width: SERMON_CARD_W,
    marginRight: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    ...Shadow.card,
  },
  sermonThumbWrap: {
    position: 'relative',
    width: '100%',
    height: 118,
  },
  sermonThumb: { width: '100%', height: '100%', backgroundColor: Colors.surfaceAlt },
  // [L4] bottom: 8 anchors to image bottom — was fragile top: 92
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.80)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  durationText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.gold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  rankText: { color: Colors.dark, fontSize: FontSize.xs, fontWeight: '800' },
  sermonInfo: { padding: Spacing.sm },
  sermonTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  sermonViews: { color: Colors.textMuted, fontSize: FontSize.xs },

  // ── Categories ──
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  catCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    ...Shadow.card,
  },
  catCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  catDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  catName: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    flexShrink: 1,
  },
  catCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 28,
    alignItems: 'center',
  },
  catCount: { fontSize: 10, fontWeight: '800' },

  // ── Events ──
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    gap: Spacing.md,
    ...Shadow.card,
  },
  // Redesigned date block
  eventDateBlock: {
    width: 46,
    height: 46,
    borderRadius: Radius.sm,
    backgroundColor: Colors.gold + '1A',
    borderWidth: 1,
    borderColor: Colors.gold + '44',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eventDateDay: {
    color: Colors.gold,
    fontSize: FontSize.lg,
    fontWeight: '900',
    lineHeight: 22,
  },
  eventDateMonth: {
    color: Colors.gold,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  eventRight: { flex: 1 },
  eventType: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  eventTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 2 },
  eventWeekday: { color: Colors.textMuted, fontSize: FontSize.xs },

  // ── Skeleton ──
  skeletonRow: {
    flexDirection: 'row',
    paddingLeft: Spacing.md,
    gap: Spacing.sm,
  },
  skeletonCard: {
    width: SERMON_CARD_W,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  skeletonThumb: {
    width: '100%',
    height: 118,
    backgroundColor: Colors.surfaceAlt,
  },
  skeletonInfo: { padding: Spacing.sm },
  skeletonLine: {
    height: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 4,
  },
});