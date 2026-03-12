import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, Image, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { videosApi, categoriesApi, eventsApi } from '../../api';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const SERMON_CARD_W = SCREEN_W * 0.60;

const SCRIPTURES = [
  { verse: '"Faith comes by hearing, and hearing by the word of God."', ref: 'Romans 10:17' },
  { verse: '"I can do all things through Christ who strengthens me."', ref: 'Philippians 4:13' },
  { verse: '"The Lord is my shepherd; I shall not want."', ref: 'Psalm 23:1' },
  { verse: '"Trust in the Lord with all your heart and lean not on your own understanding."', ref: 'Proverbs 3:5' },
  { verse: '"For God so loved the world that He gave His only begotten Son."', ref: 'John 3:16' },
  { verse: '"No weapon formed against you shall prosper."', ref: 'Isaiah 54:17' },
  { verse: '"Greater is He that is in you than he that is in the world."', ref: '1 John 4:4' },
];

const QUICK_ACCESS = [
  { id: 'prayer',       label: 'Prayer',         emoji: '🙏', bg: '#3B1A6E' },
  { id: 'declarations', label: 'Declarations',   emoji: '📣', bg: '#1A3A6E' },
  { id: 'testimonies',  label: 'Testimonies',    emoji: '✨', bg: '#1A5E2E' },
  { id: 'miracle',      label: 'Miracle Service',emoji: '⚡', bg: '#6E2E1A' },
  { id: 'word',         label: 'Engrafted Word', emoji: '📖', bg: '#4A148C' },
  { id: 'request',      label: 'Prayer Request', emoji: '💌', bg: '#006064' },
];

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

export default function HomeScreen({ navigation }: any) {
  const scripture = SCRIPTURES[new Date().getDay()];

  const { data: latest, isLoading: loadingLatest, refetch: refetchLatest } =
    useQuery({ queryKey: ['latest'], queryFn: () => videosApi.getLatest(10), staleTime: 5 * 60 * 1000 });

  const { data: trending, refetch: refetchTrending } =
    useQuery({ queryKey: ['trending'], queryFn: () => videosApi.getTrending(8), staleTime: 5 * 60 * 1000 });

  const { data: categories } =
    useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll, staleTime: 30 * 60 * 1000 });

  const { data: upcomingEvents } =
    useQuery({ queryKey: ['events-upcoming'], queryFn: eventsApi.getUpcoming, staleTime: 10 * 60 * 1000 });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchLatest(), refetchTrending()]);
    setRefreshing(false);
  }, [refetchLatest, refetchTrending]);

  const hero = latest?.[0];

  const handleQuickAccess = (id: string) => {
    if (id === 'miracle') navigation.navigate('Events');
    else if (id === 'prayer' || id === 'request') navigation.navigate('Live');
    else navigation.navigate('Sermons');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
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
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('SearchModal')}
            >
              <Text style={styles.iconEmoji}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Text style={styles.iconEmoji}>🔔</Text>
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
          <TouchableOpacity
            style={styles.hero}
            activeOpacity={0.92}
            onPress={() => navigation.navigate('VideoPlayer', { videoId: hero.id })}
          >
            <Image source={{ uri: hero.thumbnailUrl }} style={styles.heroBg} resizeMode="cover" />
            <View style={styles.heroTopFade} />
            <View style={styles.heroBottomFade} />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>✦  LATEST MESSAGE</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>{cleanTitle(hero.title)}</Text>
              <View style={styles.heroMeta}>
                {!!hero.durationSeconds && (
                  <View style={styles.heroMetaChip}>
                    <Text style={styles.heroMetaText}>⏱  {formatDuration(hero.durationSeconds)}</Text>
                  </View>
                )}
                {!!hero.viewCount && (
                  <View style={styles.heroMetaChip}>
                    <Text style={styles.heroMetaText}>👁  {Number(hero.viewCount).toLocaleString()}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => navigation.navigate('VideoPlayer', { videoId: hero.id })}
              >
                <Text style={styles.heroBtnText}>▶  Watch Now</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* ── Spiritual Tools ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spiritual Tools</Text>
          <View style={styles.qaGrid}>
            {QUICK_ACCESS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.qaCard, { backgroundColor: item.bg }]}
                onPress={() => handleQuickAccess(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.qaEmoji}>{item.emoji}</Text>
                <Text style={styles.qaLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Word for Today ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Word for Today</Text>
          <View style={styles.scriptureCard}>
            <View style={styles.scriptureGoldBar} />
            <Text style={styles.scriptureVerse}>{scripture.verse}</Text>
            <Text style={styles.scriptureRef}>{scripture.ref}</Text>
            <View style={styles.scriptureBtns}>
              <TouchableOpacity style={styles.scriptureBtn}>
                <Text style={styles.scriptureBtnText}>Share  🔗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.scriptureBtn}>
                <Text style={styles.scriptureBtnText}>Save  🔖</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Latest Messages ── */}
        {(latest?.length ?? 0) > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Latest Messages</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Sermons', { sort: 'latest' })}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={latest!.slice(1)}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: Spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sermonCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
                >
                  <Image source={{ uri: item.thumbnailUrl }} style={styles.sermonThumb} />
                  {!!item.durationSeconds && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{formatDuration(item.durationSeconds)}</Text>
                    </View>
                  )}
                  <View style={styles.sermonInfo}>
                    <Text style={styles.sermonTitle} numberOfLines={2}>{cleanTitle(item.title)}</Text>
                    <Text style={styles.sermonViews}>{Number(item.viewCount || 0).toLocaleString()} views</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Browse by Topic ── */}
        {(categories?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Browse by Topic</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Sermons')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.catGrid}>
              {categories!.slice(0, 6).map((cat: any) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catCard, { borderLeftColor: cat.colorHex || Colors.gold }]}
                  onPress={() => navigation.navigate('Sermons', { category: cat.slug })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.catDot, { backgroundColor: cat.colorHex || Colors.gold }]} />
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catCount}>{cat.videoCount ?? 0} msgs</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Upcoming Programs ── */}
        {(upcomingEvents?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Upcoming Programs</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingEvents!.slice(0, 2).map((ev: any) => (
              <TouchableOpacity
                key={ev.id}
                style={styles.eventCard}
                onPress={() => navigation.navigate('Events')}
              >
                <View style={styles.eventLeft}>
                  <Text style={styles.eventType}>{(ev.eventType || 'EVENT').toUpperCase()}</Text>
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

        {/* ── Trending This Week ── */}
        {(trending?.length ?? 0) > 0 && (
          <View style={[styles.section, { marginBottom: 40 }]}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Trending This Week</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Sermons', { sort: 'trending' })}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={trending}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: Spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sermonCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
                >
                  <Image source={{ uri: item.thumbnailUrl }} style={styles.sermonThumb} />
                  {!!item.durationSeconds && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{formatDuration(item.durationSeconds)}</Text>
                    </View>
                  )}
                  <View style={styles.sermonInfo}>
                    <Text style={styles.sermonTitle} numberOfLines={2}>{cleanTitle(item.title)}</Text>
                    <Text style={styles.sermonViews}>{Number(item.viewCount || 0).toLocaleString()} views</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark },
  scroll:   { flex: 1, backgroundColor: Colors.dark },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: { color: Colors.gold, fontSize: FontSize.lg, fontWeight: '900' },
  logoText:     { color: Colors.text, fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.4 },
  greetSub:     { color: Colors.gold, fontSize: 10, fontWeight: '500', marginTop: 1 },
  headerIcons:  { flexDirection: 'row', gap: Spacing.xs },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 16 },

  // ── Hero ──
  hero:           { height: 280, position: 'relative' },
  heroBg:         { width: '100%', height: '100%', position: 'absolute' },
  heroTopFade: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 60,
    backgroundColor: 'rgba(13,10,20,0.35)',
  },
  heroBottomFade: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 210,
    backgroundColor: 'rgba(13,10,20,0.85)',
  },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.md, paddingBottom: Spacing.lg,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gold,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.sm, marginBottom: 8,
  },
  heroBadgeText: { color: Colors.dark, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: {
    color: Colors.text, fontSize: FontSize.xl, fontWeight: '800',
    marginBottom: Spacing.sm, lineHeight: 28,
  },
  heroMeta:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  heroMetaChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  heroMetaText: { color: Colors.textSecond, fontSize: FontSize.xs },
  heroBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderRadius: Radius.pill, alignSelf: 'flex-start',
  },
  heroBtnText: { color: Colors.dark, fontSize: FontSize.sm, fontWeight: '800' },
  heroSkeleton: {
    height: 280, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.surface, gap: Spacing.sm,
  },
  skeletonText: { color: Colors.textMuted, fontSize: FontSize.sm },

  // ── Sections ──
  section: { marginTop: Spacing.lg },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text, fontSize: FontSize.lg, fontWeight: '700',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  seeAll: { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '600' },

  // ── Quick Access ──
  qaGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
  },
  qaCard: {
    width: '30.5%',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.15)',
    ...Shadow.card,
  },
  qaEmoji: { fontSize: 26 },
  qaLabel: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '600', textAlign: 'center' },

  // ── Daily Scripture ──
  scriptureCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  scriptureGoldBar: {
    width: 44, height: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2, marginBottom: Spacing.sm,
  },
  scriptureVerse: {
    color: Colors.text, fontSize: FontSize.md, fontStyle: 'italic',
    lineHeight: 24, marginBottom: Spacing.sm,
  },
  scriptureRef: { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.md },
  scriptureBtns: { flexDirection: 'row', gap: Spacing.sm },
  scriptureBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scriptureBtnText: { color: Colors.textSecond, fontSize: FontSize.sm, fontWeight: '600' },

  // ── Sermon Cards ──
  sermonCard: {
    width: SERMON_CARD_W,
    marginRight: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    ...Shadow.card,
  },
  sermonThumb:   { width: '100%', height: 120, backgroundColor: Colors.surfaceAlt },
  durationBadge: {
    position: 'absolute', top: 92, right: 6,
    backgroundColor: 'rgba(0,0,0,0.78)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  durationText:  { color: Colors.text, fontSize: FontSize.xs, fontWeight: '600' },
  sermonInfo:    { padding: Spacing.sm },
  sermonTitle:   { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 4, lineHeight: 18 },
  sermonViews:   { color: Colors.textMuted, fontSize: FontSize.xs },

  // ── Categories ──
  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
  },
  catCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    ...Shadow.card,
  },
  catDot:   { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  catName:  { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: 2 },
  catCount: { color: Colors.textMuted, fontSize: FontSize.xs },

  // ── Events ──
  eventCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.gold,
    ...Shadow.card,
  },
  eventLeft:  { flex: 1 },
  eventType:  { color: Colors.gold, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  eventTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: 4 },
  eventDate:  { color: Colors.textMuted, fontSize: FontSize.sm },
  eventArrow: { color: Colors.textMuted, fontSize: 28, marginLeft: Spacing.sm },
});
