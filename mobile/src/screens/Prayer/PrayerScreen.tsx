import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const PRAYER_POINTS = [
  'Lord, I thank You for Your presence in my life today.',
  'Father, let Your will be done in every area of my life.',
  'I receive strength, clarity, and divine direction today.',
  'Lord, let every mountain before me become a plain.',
  'Father, I commit my family into Your hands. Protect and guide them.',
  'Let the fire of the Holy Spirit purge and refine me.',
  'Lord, open doors of favour and opportunity for me today.',
];

export default function PrayerScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <MaterialCommunityIcons name="hands-pray" size={52} color={Colors.gold} />
          <Text style={styles.heroTitle}>Daily Prayer Guide</Text>
          <Text style={styles.heroSub}>Enter His presence with thanksgiving</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Today's Prayer Points</Text>
          {PRAYER_POINTS.map((point, i) => (
            <View key={i} style={styles.prayerCard}>
              <View style={styles.prayerNumber}>
                <Text style={styles.prayerNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.prayerText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="share-variant" size={18} color={Colors.dark} />
            <Text style={styles.actionBtnText}>Share Prayer Points</Text>
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
  heroTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginTop: Spacing.sm },
  heroSub:   { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },
  section:   { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionLabel: { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  prayerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    ...Shadow.card,
  },
  prayerNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  prayerNumText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: '800' },
  prayerText:    { flex: 1, color: Colors.text, fontSize: FontSize.sm, lineHeight: 22 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 14, gap: Spacing.sm,
  },
  actionBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },
});
