import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const TESTIMONIES = [
  { name: 'Sister Blessing', location: 'Lagos, Nigeria', title: 'God Healed Me Instantly', story: 'I had been diagnosed with a terminal illness for 2 years. After attending a Koinonia miracle service and applying the Word, I went for a check-up and the doctors found no trace of the disease.' },
  { name: 'Brother Emmanuel', location: 'Abuja, Nigeria', title: 'Financial Turnaround', story: 'My business had been struggling for 3 years. After consistently watching and practicing the teachings on the Engrafted Word, doors of favour opened in ways I cannot explain.' },
  { name: 'Sister Grace', location: 'Kaduna, Nigeria', title: 'Marital Restoration', story: 'My marriage was on the verge of collapse. Through prayer and God\'s intervention via this ministry, our home is fully restored and stronger than ever.' },
  { name: 'Brother David', location: 'Port Harcourt', title: 'Supernatural Breakthrough', story: 'I had been unemployed for 18 months. Two weeks after my prayer request, I received three job offers simultaneously. God is faithful!' },
];

export default function TestimonialsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Testimonies</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <MaterialCommunityIcons name="star-circle" size={52} color={Colors.gold} />
          <Text style={styles.heroTitle}>Testimonies</Text>
          <Text style={styles.heroSub}>God's faithfulness on display</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recent Testimonies</Text>
          {TESTIMONIES.map((item, i) => (
            <View key={i} style={styles.testimonyCard}>
              <View style={styles.testimonyHeader}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="account" size={20} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.testimonyName}>{item.name}</Text>
                  <Text style={styles.testimonyLocation}>
                    <MaterialCommunityIcons name="map-marker" size={11} color={Colors.textMuted} /> {item.location}
                  </Text>
                </View>
                <MaterialCommunityIcons name="star" size={16} color={Colors.gold} />
              </View>
              <Text style={styles.testimonyTitle}>{item.title}</Text>
              <Text style={styles.testimonyStory}>{item.story}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="pencil-plus" size={18} color={Colors.dark} />
            <Text style={styles.actionBtnText}>Share Your Testimony</Text>
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
  testimonyCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  testimonyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  testimonyName:     { color: Colors.text, fontSize: FontSize.sm, fontWeight: '700' },
  testimonyLocation: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  testimonyTitle:    { color: Colors.gold, fontSize: FontSize.md, fontWeight: '700', marginBottom: 6 },
  testimonyStory:    { color: Colors.textSecond, fontSize: FontSize.sm, lineHeight: 22 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 14, gap: Spacing.sm,
  },
  actionBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },
});
