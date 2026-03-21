import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Share, ActivityIndicator,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { videosApi } from '../../api';
import { SermonCard } from '../../components/common/SermonCard';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuthStore } from '../../store/authStore';

export default function VideoPlayerScreen({ route, navigation }: any) {
  const { videoId } = route.params;
  const { requireAuth } = useRequireAuth();
  const { authState } = useAuthStore();
  const queryClient = useQueryClient();
  const [playing, setPlaying] = useState(true);
  const [showFull, setShowFull] = useState(false);
  const progressRef = useRef(0);

  // ── Video data ────────────────────────────────────────────────
  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videosApi.getOne(videoId),
  });

  const { data: related } = useQuery({
    queryKey: ['related', videoId],
    queryFn: () => videosApi.getRelated(videoId),
  });

  // ── Bookmark state ────────────────────────────────────────────
  const { data: bkmStatus } = useQuery({
    queryKey: ['bookmark-status', videoId],
    queryFn: async () => {
      // optimistic: default false; try the status endpoint if it exists
      try {
        const r = await videosApi.getBookmarkStatus(videoId);
        return r;
      } catch {
        return { bookmarked: false };
      }
    },
    enabled: authState === 'authenticated',
    staleTime: 60_000,
  });

  const bookmarked = bkmStatus?.bookmarked ?? false;

  const toggleBookmark = useMutation({
    mutationFn: () =>
      bookmarked ? videosApi.unbookmark(videoId) : videosApi.bookmark(videoId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['bookmark-status', videoId] });
      queryClient.setQueryData(['bookmark-status', videoId], { bookmarked: !bookmarked });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-status', videoId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const handleBookmark = () => {
    requireAuth(() => toggleBookmark.mutate());
  };

  // ── Progress tracking ─────────────────────────────────────────
  // Using useMutation so every successful save invalidates the history cache,
  // keeping ProfileScreen watched-count and HistoryScreen up to date.
  const progressMutation = useMutation({
    mutationFn: (seconds: number) =>
      videosApi.saveProgress(videoId, seconds, video?.durationSeconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  const saveProgress = useCallback((seconds: number) => {
    if (authState !== 'authenticated') return;
    progressMutation.mutate(seconds);
  }, [authState]); // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: record the view immediately — creates the DB row so it appears
  // in history at once. Backend never decreases existing progress, so
  // re-opening a video with saved position does NOT reset it.
  useEffect(() => {
    if (video && authState === 'authenticated') {
      saveProgress(0);
    }
  }, [video?.id, authState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save real progress every 30s while watching
  useEffect(() => {
    const interval = setInterval(() => {
      if (progressRef.current > 0) saveProgress(progressRef.current);
    }, 30_000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  // Save on unmount — covers back button, tab switch, navigation away
  useEffect(() => {
    return () => {
      if (progressRef.current > 0) saveProgress(progressRef.current);
    };
  }, [saveProgress]);

  // ── Share ─────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!video) return;
    await Share.share({
      title: video.title,
      message: `Watch "${video.title}" on Koinonia TV:\nhttps://www.youtube.com/watch?v=${video.youtubeId}`,
      url: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    });
  };

  // ── Render ────────────────────────────────────────────────────
  if (isLoading || !video) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* YouTube Player */}
      <View style={styles.playerWrapper}>
        <YoutubePlayer
          height={220}
          videoId={video.youtubeId}
          play={playing}
          onChangeState={(s: string) => { if (s === 'paused') setPlaying(false); }}
          onCurrentSecond={(s: number) => { progressRef.current = s; }}
        />
      </View>

      {/* Title & Actions */}
      <View style={styles.info}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.date}>
          {new Date(video.publishedAt).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })}
        </Text>

        {/* Action Row */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={Colors.gold} />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, bookmarked && styles.actionBtnActive]}
            onPress={handleBookmark}
            disabled={toggleBookmark.isPending}
          >
            <MaterialCommunityIcons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={bookmarked ? Colors.dark : Colors.gold}
            />
            <Text style={[styles.actionLabel, bookmarked && styles.actionLabelActive]}>
              {bookmarked ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        {video.videoCategories?.length > 0 && (
          <View style={styles.cats}>
            {video.videoCategories.map((vc: any) => (
              <TouchableOpacity
                key={vc.id}
                style={styles.catChip}
                onPress={() => navigation.navigate('Sermons', { category: vc.category.slug })}
              >
                <Text style={styles.catLabel}>{vc.category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Description */}
        {video.description ? (
          <>
            <Text style={styles.descLabel}>About this message</Text>
            <Text style={styles.desc} numberOfLines={showFull ? undefined : 4}>
              {video.description}
            </Text>
            <TouchableOpacity onPress={() => setShowFull(!showFull)}>
              <Text style={styles.readMore}>{showFull ? 'Show less' : 'Read more'}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {/* Related */}
      {related?.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related Messages</Text>
          {related.map((v: any) => (
            <SermonCard
              key={v.id}
              video={v}
              onPress={() => navigation.push('VideoPlayer', { videoId: v.id })}
              style={styles.relatedCard}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.dark },
  loading:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  playerWrapper: { backgroundColor: '#000', width: '100%' },
  info:          { padding: Spacing.md },
  title:         { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', lineHeight: 24, marginBottom: 6 },
  date:          { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.md },

  actions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  actionBtn: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    minWidth: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  actionLabel:       { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 3 },
  actionLabelActive: { color: Colors.dark },

  cats:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  catChip:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.primary },
  catLabel: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600' },

  descLabel: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: 8 },
  desc:      { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 22 },
  readMore:  { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '600', marginTop: 6 },

  relatedSection: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  relatedTitle:   { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  relatedCard:    { marginBottom: Spacing.sm },
});
