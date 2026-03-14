import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import YoutubePlayer from 'react-native-youtube-iframe';
import { momentsApi } from '../../api';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatDuration(start: number, end: number) {
  return `${Math.round(end - start)}s`;
}

export default function DeclarationsScreen({ navigation }: any) {
  const [playing, setPlaying] = useState<{ youtubeId: string; startTime: number } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['moments-declarations'],
    queryFn: () => momentsApi.getDeclarations({ limit: 40 }),
    staleTime: 10 * 60 * 1000,
  });

  const moments = data?.items ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Declarations</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <View style={styles.heroBanner}>
        <MaterialCommunityIcons name="bullhorn" size={40} color={Colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Prophetic Declarations</Text>
          <Text style={styles.heroSub}>Tap any card to play the clip</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.gold} size="large" />
          <Text style={styles.loadingText}>Loading declarations…</Text>
        </View>
      ) : moments.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="bullhorn-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No declarations yet</Text>
          <Text style={styles.emptyText}>
            Declarations are auto-detected from sermon transcripts.{'\n'}
            Check back after the next sync.
          </Text>
        </View>
      ) : (
        <FlatList
          data={moments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => setPlaying({ youtubeId: item.youtubeId, startTime: item.startTime })}
            >
              <View style={styles.thumbContainer}>
                <Image
                  source={{ uri: item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg` }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
                <View style={styles.playOverlay}>
                  <MaterialCommunityIcons name="play-circle" size={36} color={Colors.gold} />
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{formatDuration(item.startTime, item.endTime)}</Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardSermon} numberOfLines={1}>
                  <MaterialCommunityIcons name="play-box" size={12} color={Colors.textMuted} /> {item.sermonTitle}
                </Text>
                <View style={styles.cardMeta}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.cardTime}> Starts at {formatTime(item.startTime)}</Text>
                </View>
                {!!item.transcriptText && (
                  <Text style={styles.transcript} numberOfLines={2}>
                    "{item.transcriptText}"
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Player Modal */}
      <Modal
        visible={!!playing}
        animationType="slide"
        onRequestClose={() => setPlaying(null)}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.playerModal} edges={['top', 'bottom']}>
          <View style={styles.playerHeader}>
            <TouchableOpacity onPress={() => setPlaying(null)} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.playerTitle}>Declaration Clip</Text>
            <View style={{ width: 40 }} />
          </View>
          {playing && (
            <YoutubePlayer
              height={230}
              videoId={playing.youtubeId}
              initialPlayerParams={{ start: playing.startTime, controls: true }}
              play
            />
          )}
          <View style={styles.playerHint}>
            <MaterialCommunityIcons name="information-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.playerHintText}> Playing declaration moment from the sermon</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  heroBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  heroTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  heroSub:   { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.md },
  emptyTitle:  { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.md },
  emptyText:   { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  list: { padding: Spacing.md, paddingBottom: 40 },
  card: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: Radius.lg, marginBottom: Spacing.sm,
    overflow: 'hidden', ...Shadow.card,
    borderLeftWidth: 3, borderLeftColor: Colors.gold,
  },
  thumbContainer: { width: 120, position: 'relative' },
  thumb:          { width: 120, height: 90, backgroundColor: Colors.surfaceAlt },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 90,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  durationBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  durationText: { color: Colors.text, fontSize: 10, fontWeight: '600' },
  cardInfo:     { flex: 1, padding: Spacing.sm },
  cardTitle:    { color: Colors.text, fontSize: FontSize.sm, fontWeight: '700', marginBottom: 4, lineHeight: 18 },
  cardSermon:   { color: Colors.textMuted, fontSize: 10, marginBottom: 4 },
  cardMeta:     { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTime:     { color: Colors.textMuted, fontSize: 10 },
  transcript:   { color: Colors.textMuted, fontSize: 10, fontStyle: 'italic', lineHeight: 14 },
  playerModal: { flex: 1, backgroundColor: Colors.dark },
  playerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn:     { width: 40, height: 40, justifyContent: 'center' },
  playerTitle:  { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  playerHint: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md,
  },
  playerHintText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
