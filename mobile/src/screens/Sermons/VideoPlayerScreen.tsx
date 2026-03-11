import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, Share, ActivityIndicator,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useQuery } from '@tanstack/react-query';
import { videosApi } from '../../api';
import { SermonCard } from '../../components/common/SermonCard';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

export default function VideoPlayerScreen({ route, navigation }: any) {
  const { videoId } = route.params;
  const [playing, setPlaying] = useState(true);
  const [showFull, setShowFull] = useState(false);
  const progressRef = useRef(0);

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videosApi.getOne(videoId),
  });

  const { data: related } = useQuery({
    queryKey: ['related', videoId],
    queryFn: () => videosApi.getRelated(videoId),
  });

  // Auto-save progress every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (progressRef.current > 0) {
        videosApi.saveProgress(videoId, progressRef.current).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [videoId]);

  const handleShare = async () => {
    if (!video) return;
    await Share.share({
      title: video.title,
      message: `Watch "${video.title}" on Koinonia TV: https://www.youtube.com/watch?v=${video.youtubeId}`,
      url: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    });
  };

  if (isLoading || !video) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent} size="large" />
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
            <Text style={styles.actionIcon}>↗</Text>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => videosApi.bookmark(videoId)}>
            <Text style={styles.actionIcon}>♡</Text>
            <Text style={styles.actionLabel}>Bookmark</Text>
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
  container: { flex: 1, backgroundColor: Colors.dark },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  playerWrapper: { backgroundColor: '#000', width: '100%' },
  info: { padding: Spacing.md },
  title: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', lineHeight: 24, marginBottom: 6 },
  date: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  actionBtn: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.md, minWidth: 80 },
  actionIcon: { color: Colors.accent, fontSize: 20, marginBottom: 2 },
  actionLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.accent,
  },
  catLabel: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '600' },
  descLabel: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: 8 },
  desc: { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 22 },
  readMore: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '600', marginTop: 6 },
  relatedSection: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  relatedTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  relatedCard: { marginBottom: Spacing.sm },
});
