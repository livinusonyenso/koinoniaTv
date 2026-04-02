import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useQuery } from '@tanstack/react-query';
import { liveApi } from '../../api';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { useNetwork } from '../../hooks/useNetworkState';
import ErrorState from '../../components/common/ErrorState';

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.countUnit}>
      <Text style={styles.countNum}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

export default function LiveScreen() {
  const { isConnected } = useNetwork();

  const { data: status, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['live-status'],
    queryFn: liveApi.getStatus,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: upcoming } = useQuery({
    queryKey: ['live-upcoming'],
    queryFn: liveApi.getUpcoming,
    staleTime: 60000,
  });

  const [countdown, setCountdown] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const nextStream = upcoming?.[0];

  useEffect(() => {
    if (!nextStream?.scheduledStart) return;
    const tick = () => {
      const diff = new Date(nextStream.scheduledStart).getTime() - Date.now();
      if (diff <= 0) return;
      const s = Math.floor(diff / 1000);
      setCountdown({
        days:    Math.floor(s / 86400),
        hours:   Math.floor((s % 86400) / 3600),
        minutes: Math.floor((s % 3600) / 60),
        seconds: s % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextStream]);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.gold} size="large" /></View>;
  }

  if (isError) {
    const isNetworkError = !isConnected || (error as any)?.message === 'Network Error';
    return (
      <ErrorState
        type={isNetworkError ? 'network' : 'server'}
        title="Could not check live status"
        message="We couldn't reach the server to check if a service is live. Pull down to try again."
        onRetry={refetch}
      />
    );
  }

  // ── LIVE NOW ──
  if (status?.isLive && status?.stream) {
    return (
      <View style={styles.container}>
        <View style={styles.liveHeader}>
          <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>● LIVE</Text></View>
          <Text style={styles.liveTitle} numberOfLines={2}>{status.stream.title}</Text>
        </View>
        <YoutubePlayer
          height={220}
          videoId={status.stream.youtubeId}
          play={true}
          webViewProps={{
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            androidLayerType: 'hardware',
            mediaPlaybackRequiresUserAction: false,
          }}
        />
        <View style={styles.liveInfo}>
          <Text style={styles.liveDesc}>Apostle Joshua Selman is live now. Tap fullscreen for the best experience.</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
            <Text style={styles.refreshText}>↻  Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── UPCOMING ──
  if (nextStream) {
    return (
      <View style={styles.container}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingLabel}>NEXT SERVICE</Text>
          <Text style={styles.upcomingTitle}>{nextStream.title}</Text>
          <Text style={styles.upcomingDate}>
            {new Date(nextStream.scheduledStart).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.countdownRow}>
          <CountdownUnit value={countdown.days}    label="DAYS" />
          <Text style={styles.countSep}>:</Text>
          <CountdownUnit value={countdown.hours}   label="HRS"  />
          <Text style={styles.countSep}>:</Text>
          <CountdownUnit value={countdown.minutes} label="MIN"  />
          <Text style={styles.countSep}>:</Text>
          <CountdownUnit value={countdown.seconds} label="SEC"  />
        </View>

        <Text style={styles.upcomingNote}>
          ✦  Set a reminder to join the service. We will notify you when it begins.
        </Text>
        <TouchableOpacity style={styles.notifyBtn}>
          <Text style={styles.notifyText}>🔔  Notify Me</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── OFFLINE (no service right now) ──
  return (
    <View style={styles.center}>
      <Text style={styles.offlineIcon}>📡</Text>
      <Text style={styles.offlineTitle}>No Live Service Right Now</Text>
      <Text style={styles.offlineDesc}>
        Koinonia Global holds services weekly. Check back soon or browse the sermon library.
      </Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
        <Text style={styles.refreshText}>↻  Check Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark, padding: Spacing.xl },
  liveHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, backgroundColor: Colors.surface,
  },
  liveBadge:     { backgroundColor: Colors.live, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  liveBadgeText: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '800' },
  liveTitle:     { flex: 1, color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  liveInfo:      { padding: Spacing.md },
  liveDesc:      { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.md },
  upcomingHeader: { padding: Spacing.xl, alignItems: 'center' },
  upcomingLabel:  { color: Colors.gold, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  upcomingTitle:  { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', textAlign: 'center', marginBottom: 8, lineHeight: 28 },
  upcomingDate:   { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  countdownRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  countUnit:      { alignItems: 'center', width: 70 },
  countNum:       { color: Colors.text, fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
  countLabel:     { color: Colors.textMuted, fontSize: FontSize.xs, letterSpacing: 1, marginTop: 4 },
  countSep:       { color: Colors.gold, fontSize: 36, fontWeight: '700', marginBottom: 16, marginHorizontal: 4 },
  upcomingNote:   { color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg, fontSize: FontSize.sm },
  notifyBtn:      { alignSelf: 'center', backgroundColor: Colors.gold, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.pill },
  notifyText:     { color: Colors.dark, fontSize: FontSize.md, fontWeight: '700' },
  refreshBtn:     { marginTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border },
  refreshText:    { color: Colors.textMuted, fontSize: FontSize.sm },
  offlineIcon:    { fontSize: 64, marginBottom: Spacing.md },
  offlineTitle:   { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.sm, textAlign: 'center' },
  offlineDesc:    { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
});
