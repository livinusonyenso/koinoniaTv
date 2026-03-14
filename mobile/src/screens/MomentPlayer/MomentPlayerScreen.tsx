import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, Image, TouchableOpacity,
  StyleSheet, Dimensions, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { momentsApi } from '../../api';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const { width: SW } = Dimensions.get('window');
const PLAYER_H = Math.round(SW * 9 / 16);   // 16:9
const AUTOPLAY_DELAY = 4;                     // seconds before auto-advance

const TYPE_COLORS: Record<string, string> = {
  declaration: Colors.gold,
  prayer:      '#1565C0',
  testimony:   '#2E7D32',
};

const TYPE_ICONS: Record<string, string> = {
  declaration: 'bullhorn',
  prayer:      'hands-pray',
  testimony:   'star-circle',
};

const TYPE_LABELS: Record<string, string> = {
  declaration: 'Declaration',
  prayer:      'Prayer',
  testimony:   'Testimony',
};

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function clipDuration(start: number, end: number) {
  return `${Math.round(end - start)}s clip`;
}

// ── Suggestion Card ──────────────────────────────────────────────────────────
function SuggestionCard({
  item,
  onPress,
  isNext,
}: {
  item: any;
  onPress: () => void;
  isNext?: boolean;
}) {
  const color = TYPE_COLORS[item.type] ?? Colors.gold;
  return (
    <TouchableOpacity
      style={[styles.sugCard, isNext && styles.sugCardNext]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.sugThumbBox}>
        <Image
          source={{ uri: item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg` }}
          style={styles.sugThumb}
          resizeMode="cover"
        />
        <View style={[styles.sugTypeBadge, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={TYPE_ICONS[item.type] as any} size={10} color="#fff" />
        </View>
        <View style={styles.sugDuration}>
          <Text style={styles.sugDurationText}>{clipDuration(item.startTime, item.endTime)}</Text>
        </View>
      </View>
      <View style={styles.sugInfo}>
        {isNext && <Text style={styles.sugNextLabel}>UP NEXT</Text>}
        <Text style={styles.sugTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.sugSermon} numberOfLines={1}>{item.sermonTitle}</Text>
        <Text style={styles.sugTime}>@ {formatTime(item.startTime)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MomentPlayerScreen({ route, navigation }: any) {
  const initialMoment = route.params?.moment as any;

  const [moment, setMoment]           = useState(initialMoment);
  const [thumbMode, setThumbMode]     = useState(true);   // show thumb until user taps
  const [playerReady, setPlayerReady] = useState(false);
  const [countdown, setCountdown]     = useState<number | null>(null);
  const countdownRef                  = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef                     = useRef<ScrollView>(null);
  const fadeAnim                      = useRef(new Animated.Value(0)).current;
  const queryClient                   = useQueryClient();

  const typeColor = TYPE_COLORS[moment.type] ?? Colors.gold;
  const typeIcon  = TYPE_ICONS[moment.type]  ?? 'play-circle';
  const typeLabel = TYPE_LABELS[moment.type] ?? 'Clip';

  // Fetch suggestions whenever the active moment changes
  const { data: suggestions = [] } = useQuery({
    queryKey: ['moment-suggestions', moment.id],
    queryFn: () =>
      momentsApi.getSuggestions({
        momentId: moment.id,
        youtubeId: moment.youtubeId,
        type: moment.type,
        limit: 8,
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Prefetch the first suggestion's suggestions so switching is instant
  useEffect(() => {
    if (suggestions.length > 0) {
      const next = suggestions[0];
      queryClient.prefetchQuery({
        queryKey: ['moment-suggestions', next.id],
        queryFn: () =>
          momentsApi.getSuggestions({
            momentId: next.id,
            youtubeId: next.youtubeId,
            type: next.type,
            limit: 8,
          }),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [suggestions]);

  // Fade in the player when thumb mode turns off
  useEffect(() => {
    if (!thumbMode) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [thumbMode]);

  // Reset state when moment changes (e.g. navigating to suggestion)
  useEffect(() => {
    setThumbMode(true);
    setPlayerReady(false);
    cancelCountdown();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [moment.id]);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
  }, []);

  const startCountdown = useCallback(() => {
    if (suggestions.length === 0) return;
    setCountdown(AUTOPLAY_DELAY);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) {
          clearInterval(countdownRef.current!);
          playNext();
          return null;
        }
        return c - 1;
      });
    }, 1000);
  }, [suggestions]);

  const playNext = useCallback(() => {
    cancelCountdown();
    if (suggestions.length > 0) {
      setMoment(suggestions[0]);
    }
  }, [suggestions]);

  const handlePlayerState = useCallback(
    (state: string) => {
      if (state === 'ended') startCountdown();
      if (state === 'playing') cancelCountdown();
    },
    [startCountdown, cancelCountdown],
  );

  const handleThumbPress = () => {
    setThumbMode(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={[styles.typePill, { backgroundColor: typeColor + '22', borderColor: typeColor }]}>
          <MaterialCommunityIcons name={typeIcon as any} size={13} color={typeColor} />
          <Text style={[styles.typeLabel, { color: typeColor }]}>{typeLabel}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Player / Thumbnail ── */}
        <View style={[styles.playerContainer, { height: PLAYER_H }]}>
          {/* Thumbnail (always rendered, hidden behind player once loaded) */}
          {thumbMode ? (
            <TouchableOpacity style={styles.thumbTap} onPress={handleThumbPress} activeOpacity={0.9}>
              <Image
                source={{ uri: moment.thumbnailUrl || `https://img.youtube.com/vi/${moment.youtubeId}/mqdefault.jpg` }}
                style={styles.thumbBg}
                resizeMode="cover"
              />
              <View style={styles.thumbOverlay} />
              <View style={styles.thumbPlayBtn}>
                <MaterialCommunityIcons name="play-circle" size={64} color={Colors.gold} />
              </View>
              <View style={styles.thumbTimeBadge}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.text} />
                <Text style={styles.thumbTimeText}> Starts at {formatTime(moment.startTime)}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              <YoutubePlayer
                height={PLAYER_H}
                videoId={moment.youtubeId}
                play
                initialPlayerParams={{
                  start: moment.startTime,
                  controls: true,
                  modestbranding: true,
                  rel: 0,
                }}
                onReady={() => setPlayerReady(true)}
                onChangeState={handlePlayerState}
              />
            </Animated.View>
          )}
        </View>

        {/* ── Clip Info ── */}
        <View style={styles.infoBox}>
          <Text style={styles.clipTitle}>{moment.title}</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="play-box" size={14} color={Colors.textMuted} />
            <Text style={styles.infoSermon} numberOfLines={1}> {moment.sermonTitle}</Text>
          </View>
          <View style={styles.infoMetaRow}>
            <View style={styles.infoMeta}>
              <MaterialCommunityIcons name="clock-start" size={13} color={Colors.textMuted} />
              <Text style={styles.infoMetaText}> {formatTime(moment.startTime)}</Text>
            </View>
            <View style={styles.infoMeta}>
              <MaterialCommunityIcons name="timer-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.infoMetaText}> {clipDuration(moment.startTime, moment.endTime)}</Text>
            </View>
            <View style={[styles.infoMeta, { borderColor: typeColor }]}>
              <MaterialCommunityIcons name={typeIcon as any} size={13} color={typeColor} />
              <Text style={[styles.infoMetaText, { color: typeColor }]}> {typeLabel}</Text>
            </View>
          </View>
          {!!moment.transcriptText && (
            <View style={styles.transcriptBox}>
              <MaterialCommunityIcons name="format-quote-open" size={18} color={typeColor} />
              <Text style={styles.transcriptText}>{moment.transcriptText}</Text>
            </View>
          )}
        </View>

        {/* ── Autoplay Countdown ── */}
        {countdown !== null && suggestions.length > 0 && (
          <View style={styles.autoplayBar}>
            <View style={styles.autoplayLeft}>
              <Text style={styles.autoplayText}>
                Up next in <Text style={{ color: Colors.gold, fontWeight: '800' }}>{countdown}s</Text>
              </Text>
              <Text style={styles.autoplayNext} numberOfLines={1}>{suggestions[0].title}</Text>
            </View>
            <View style={styles.autoplayBtns}>
              <TouchableOpacity onPress={playNext} style={styles.autoplayNow}>
                <Text style={styles.autoplayNowText}>Play Now</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelCountdown} style={styles.autoplayCancel}>
                <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Suggestions ── */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Up Next</Text>
            {suggestions.map((item: any, idx: number) => (
              <SuggestionCard
                key={item.id}
                item={item}
                isNext={idx === 0}
                onPress={() => {
                  cancelCountdown();
                  setMoment(item);
                }}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:   { width: 40, height: 40, justifyContent: 'center' },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  typeLabel: { fontSize: FontSize.xs, fontWeight: '700' },

  // Player
  playerContainer: { width: '100%', backgroundColor: '#000' },
  thumbTap:        { flex: 1, position: 'relative' },
  thumbBg:         { width: '100%', height: '100%', position: 'absolute' },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  thumbPlayBtn: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  thumbTimeBadge: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  thumbTimeText: { color: Colors.text, fontSize: FontSize.xs },

  // Info
  infoBox: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  clipTitle:    { color: Colors.text, fontSize: FontSize.xl, fontWeight: '800', lineHeight: 26, marginBottom: 6 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  infoSermon:   { color: Colors.textMuted, fontSize: FontSize.sm, flex: 1 },
  infoMetaRow:  { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.sm },
  infoMeta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  infoMetaText: { color: Colors.textMuted, fontSize: FontSize.xs },
  transcriptBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.sm, marginTop: Spacing.xs,
  },
  transcriptText: { flex: 1, color: Colors.textSecond, fontSize: FontSize.sm, fontStyle: 'italic', lineHeight: 20 },

  // Autoplay bar
  autoplayBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.gold + '44',
    ...Shadow.card,
  },
  autoplayLeft:   { flex: 1 },
  autoplayText:   { color: Colors.text, fontSize: FontSize.sm, marginBottom: 2 },
  autoplayNext:   { color: Colors.textMuted, fontSize: FontSize.xs },
  autoplayBtns:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  autoplayNow: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  autoplayNowText:  { color: Colors.dark, fontSize: FontSize.xs, fontWeight: '800' },
  autoplayCancel:   { padding: 4 },

  // Suggestions
  section:      { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },

  sugCard: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: Radius.md, marginBottom: Spacing.sm,
    overflow: 'hidden', ...Shadow.card,
  },
  sugCardNext: {
    borderWidth: 1, borderColor: Colors.gold + '55',
  },
  sugThumbBox:    { width: 110, position: 'relative' },
  sugThumb:       { width: 110, height: 80, backgroundColor: Colors.surfaceAlt },
  sugTypeBadge: {
    position: 'absolute', top: 6, left: 6,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sugDuration: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3,
  },
  sugDurationText: { color: Colors.text, fontSize: 9, fontWeight: '600' },
  sugInfo:         { flex: 1, padding: Spacing.sm, justifyContent: 'center' },
  sugNextLabel:    { color: Colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  sugTitle:        { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', lineHeight: 17, marginBottom: 3 },
  sugSermon:       { color: Colors.textMuted, fontSize: 10, marginBottom: 2 },
  sugTime:         { color: Colors.textMuted, fontSize: 9 },
});
