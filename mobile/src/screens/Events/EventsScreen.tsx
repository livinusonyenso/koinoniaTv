import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Linking,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../../api';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { useNetwork } from '../../hooks/useNetworkState';
import { useRefresh } from '../../hooks/useRefresh';
import ErrorState from '../../components/common/ErrorState';

const EVENT_TYPES = ['All', 'Service', 'Conference', 'External', 'Special'];

function CountdownBadge({ startDatetime }: { startDatetime: string }) {
  const [cd, setCd] = React.useState({ d: 0, h: 0, m: 0 });
  React.useEffect(() => {
    const tick = () => {
      const diff = new Date(startDatetime).getTime() - Date.now();
      if (diff <= 0) return;
      const s = Math.floor(diff / 1000);
      setCd({ d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60) });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [startDatetime]);

  const isPast = new Date(startDatetime) < new Date();
  if (isPast) return <View style={styles.badgePast}><Text style={styles.badgePastText}>Past</Text></View>;

  return (
    <View style={styles.cdBadge}>
      <Text style={styles.cdText}>{cd.d}d {cd.h}h {cd.m}m</Text>
    </View>
  );
}

function EventCard({ event, onPress }: any) {
  const isPast = new Date(event.startDatetime) < new Date();
  return (
    <TouchableOpacity style={[styles.card, isPast && styles.cardPast]} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.cardAccent, { backgroundColor: isPast ? Colors.border : Colors.gold }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardTypeBadge}>
            <Text style={styles.cardTypeText}>{event.eventType.toUpperCase()}</Text>
          </View>
          <CountdownBadge startDatetime={event.startDatetime} />
        </View>
        <Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardDate}>
          📅  {new Date(event.startDatetime).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>
        {event.locationName && (
          <Text style={styles.cardLocation}>📍  {event.locationName}{event.locationCity ? `, ${event.locationCity}` : ''}</Text>
        )}
        {event.isOnline && <Text style={styles.onlineBadge}>🌐  Online Event</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen({ navigation }: any) {
  const [filter, setFilter] = useState('All');
  const { isConnected } = useNetwork();

  const { data: events, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['events', filter],
    queryFn: () => eventsApi.getAll(filter !== 'All' ? { type: filter.toLowerCase() } : undefined),
    staleTime: 5 * 60 * 1000,
  });
  const { refreshing, onRefresh } = useRefresh(refetch);

  const isNetworkError = !isConnected || (error as any)?.message === 'Network Error';

  return (
    <View style={styles.container}>
      {/* Filter Row */}
      <View style={styles.filterRow}>
        {EVENT_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.filterBtn, filter === t && styles.filterBtnActive]}
            onPress={() => setFilter(t)}
          >
            <Text style={[styles.filterLabel, filter === t && styles.filterLabelActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.gold} size="large" style={{ marginTop: 60 }} />
      ) : isError ? (
        <ErrorState type={isNetworkError ? 'network' : 'server'} onRetry={refetch} />
      ) : (
        <FlatList
          data={events || []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.gold}
              colors={[Colors.gold]}
              progressBackgroundColor={Colors.card}
            />
          }
          ListEmptyComponent={
            <ErrorState type="empty" title="No events found" message="Events will appear here when scheduled." />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.dark },
  filterRow:  { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.sm, gap: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterLabel:       { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '500' },
  filterLabelActive: { color: Colors.text },
  list: { padding: Spacing.md, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, marginBottom: Spacing.sm, flexDirection: 'row', overflow: 'hidden' },
  cardPast:  { opacity: 0.6 },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: Spacing.md },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTypeBadge: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  cardTypeText:  { color: Colors.gold, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.8 },
  cdBadge:     { backgroundColor: 'rgba(244,196,48,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  cdText:      { color: Colors.gold, fontSize: FontSize.xs, fontWeight: '600' },
  badgePast:     { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  badgePastText: { color: Colors.textMuted, fontSize: FontSize.xs },
  cardTitle:    { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', lineHeight: 24, marginBottom: 8 },
  cardDate:     { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 4 },
  cardLocation: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 4 },
  onlineBadge:  { color: Colors.green, fontSize: FontSize.sm, marginTop: 4 },
});
