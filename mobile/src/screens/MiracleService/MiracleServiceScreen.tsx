import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const SCHEDULE = [
  { day: 'Friday', time: '6:00 PM WAT', label: 'Weekly Miracle Service', live: true },
  { day: 'Sunday', time: '8:00 AM WAT', label: 'Sunday Worship Service', live: false },
  { day: 'Tuesday', time: '6:00 PM WAT', label: 'Mid-Week Power Service', live: false },
];

const PAST_HIGHLIGHTS = [
  'Over 2,000 healings recorded in 2024',
  'Blind eyes opened during Friday Miracle Service',
  'Terminal cancer cases reversed through the Word',
  'Thousands of prayer requests answered globally',
];

export default function MiracleServiceScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Miracle Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <MaterialCommunityIcons name="lightning-bolt" size={52} color={Colors.gold} />
          <Text style={styles.heroTitle}>Koinonia Miracle Service</Text>
          <Text style={styles.heroSub}>With Apostle Joshua Selman</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Service Schedule</Text>
          {SCHEDULE.map((item, i) => (
            <View key={i} style={[styles.scheduleCard, item.live && styles.scheduleCardLive]}>
              <View style={styles.scheduleLeft}>
                <View style={styles.scheduleDay}>
                  <Text style={styles.scheduleDayText}>{item.day.slice(0, 3).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleLabel}>{item.label}</Text>
                  <View style={styles.scheduleTimeRow}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.scheduleTime}> {item.time}</Text>
                  </View>
                </View>
              </View>
              {item.live && (
                <View style={styles.liveBadge}>
                  <MaterialCommunityIcons name="access-point" size={12} color={Colors.text} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Testimonies from Services</Text>
          {PAST_HIGHLIGHTS.map((item, i) => (
            <View key={i} style={styles.highlightRow}>
              <MaterialCommunityIcons name="check-circle" size={18} color={Colors.gold} />
              <Text style={styles.highlightText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <TouchableOpacity
            style={styles.watchBtn}
            onPress={() => navigation.navigate('Live')}
          >
            <MaterialCommunityIcons name="television-play" size={20} color={Colors.dark} />
            <Text style={styles.watchBtnText}>Watch Live Stream</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sermonsBtn}
            onPress={() => navigation.navigate('Sermons')}
          >
            <MaterialCommunityIcons name="play-box-multiple" size={20} color={Colors.gold} />
            <Text style={styles.sermonsBtnText}>Past Services</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  heroBanner: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface, marginBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  heroTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginTop: Spacing.sm, textAlign: 'center' },
  heroSub:   { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },
  section:   { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionLabel: { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  scheduleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    ...Shadow.card,
  },
  scheduleCardLive: { borderLeftColor: Colors.red },
  scheduleLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  scheduleDay: {
    width: 42, height: 42, borderRadius: Radius.sm,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  scheduleDayText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: '800' },
  scheduleLabel:   { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  scheduleTimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  scheduleTime:    { color: Colors.textMuted, fontSize: FontSize.xs },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.red, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  liveBadgeText: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '800' },
  highlightRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  highlightText: { flex: 1, color: Colors.textSecond, fontSize: FontSize.sm, lineHeight: 22 },
  watchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 14, gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  watchBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },
  sermonsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', borderRadius: Radius.pill,
    paddingVertical: 14, gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.gold,
  },
  sermonsBtnText: { color: Colors.gold, fontSize: FontSize.md, fontWeight: '700' },
});
