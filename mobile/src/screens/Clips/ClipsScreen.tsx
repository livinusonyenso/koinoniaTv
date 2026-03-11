import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity,
  Share, ActivityIndicator, Image,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useQuery } from '@tanstack/react-query';
import { clipsApi } from '../../api';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

function ClipItem({ item, isActive, navigation }: any) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(isActive);
  }, [isActive]);

  const handleShare = async () => {
    await clipsApi.share(item.id);
    const url = `https://www.youtube.com/watch?v=${item.video?.youtubeId}&t=${item.startSeconds}s`;
    await Share.share({ title: item.title, message: `"${item.title}" — Koinonia TV\n${url}`, url });
  };

  return (
    <View style={styles.clipItem}>
      {item.video?.youtubeId ? (
        <YoutubePlayer
          height={SCREEN_H}
          width={SCREEN_W}
          videoId={item.video.youtubeId}
          play={playing}
          initialPlayerParams={{ start: item.startSeconds, end: item.endSeconds, controls: false }}
        />
      ) : (
        <Image
          source={{ uri: item.thumbnailUrl || item.video?.thumbnailUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}

      {/* Overlay */}
      <View style={styles.overlay} />

      {/* Right Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setPlaying(!playing)}>
          <Text style={styles.actionIcon}>{playing ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Text style={styles.actionIcon}>↗</Text>
          <Text style={styles.actionSub}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>♡</Text>
          <Text style={styles.actionSub}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{item.clipType?.toUpperCase()}</Text>
        </View>
        <Text style={styles.clipTitle}>{item.title}</Text>
        {item.video?.title && (
          <TouchableOpacity
            style={styles.sermonLink}
            onPress={() => navigation.navigate('Sermons', {
              screen: 'VideoPlayer', params: { videoId: item.video.id }
            })}
          >
            <Text style={styles.sermonLinkText}>🎬  Watch full sermon →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Need this import for useEffect in ClipItem
import { useEffect } from 'react';

export default function ClipsScreen({ navigation }: any) {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['clips'],
    queryFn: () => clipsApi.getAll({ limit: 50 }),
    staleTime: 10 * 60 * 1000,
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index);
  }, []);

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

  const clips = data?.items || [];

  if (!clips.length) {
    return (
      <View style={styles.loading}>
        <Text style={styles.emptyText}>⚡  No clips yet</Text>
        <Text style={styles.emptyDesc}>Short sermon highlights will appear here</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={clips}
      keyExtractor={(item) => item.id.toString()}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={SCREEN_H}
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
      renderItem={({ item, index }) => (
        <ClipItem item={item} isActive={index === activeIndex} navigation={navigation} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  emptyText: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { color: Colors.textMuted, fontSize: FontSize.md },
  clipItem: { width: SCREEN_W, height: SCREEN_H, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  rightActions: {
    position: 'absolute', right: Spacing.md, bottom: 120,
    alignItems: 'center', gap: Spacing.lg,
  },
  actionBtn: { alignItems: 'center' },
  actionIcon: { color: Colors.text, fontSize: 28 },
  actionSub: { color: Colors.text, fontSize: FontSize.xs, marginTop: 2 },
  bottomInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 80,
    padding: Spacing.md,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  typeBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.accent,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, marginBottom: 8,
  },
  typeBadgeText: { color: Colors.dark, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 0.8 },
  clipTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', lineHeight: 24, marginBottom: 10 },
  sermonLink: {
    backgroundColor: 'rgba(255,179,0,0.15)', borderRadius: Radius.pill,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: Colors.accent,
  },
  sermonLinkText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '600' },
});
