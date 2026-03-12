import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const CATEGORIES = ['Faith', 'Favor', 'Healing', 'Prayer', 'Wisdom', 'Purpose'];

const WORD_CATEGORIES: Record<string, Array<{ verse: string; ref: string }>> = {
  Faith: [
    { verse: 'Now faith is the substance of things hoped for, the evidence of things not seen.', ref: 'Hebrews 11:1' },
    { verse: 'Faith comes by hearing, and hearing by the word of God.', ref: 'Romans 10:17' },
    { verse: 'Without faith it is impossible to please God.', ref: 'Hebrews 11:6' },
  ],
  Favor: [
    { verse: 'For You, O Lord, will bless the righteous; with favor You will surround him as with a shield.', ref: 'Psalm 5:12' },
    { verse: 'A good man obtains favor from the Lord.', ref: 'Proverbs 12:2' },
    { verse: 'The Lord God is a sun and shield; the Lord bestows favor and honor.', ref: 'Psalm 84:11' },
  ],
  Healing: [
    { verse: 'I am the Lord who heals you.', ref: 'Exodus 15:26' },
    { verse: 'By His stripes we are healed.', ref: 'Isaiah 53:5' },
    { verse: 'He heals all your diseases.', ref: 'Psalm 103:3' },
  ],
  Prayer: [
    { verse: 'Ask and it will be given to you; seek and you will find.', ref: 'Matthew 7:7' },
    { verse: 'The effective, fervent prayer of a righteous man avails much.', ref: 'James 5:16' },
    { verse: 'Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.', ref: 'Philippians 4:6' },
  ],
  Wisdom: [
    { verse: 'If any of you lacks wisdom, let him ask of God, who gives to all liberally.', ref: 'James 1:5' },
    { verse: 'The fear of the Lord is the beginning of wisdom.', ref: 'Proverbs 9:10' },
    { verse: 'In Christ are hidden all the treasures of wisdom and knowledge.', ref: 'Colossians 2:3' },
  ],
  Purpose: [
    { verse: 'For I know the plans I have for you, declares the Lord — plans to prosper you.', ref: 'Jeremiah 29:11' },
    { verse: 'We are His workmanship, created in Christ Jesus for good works.', ref: 'Ephesians 2:10' },
    { verse: 'Many are the plans in a person\'s heart, but it is the Lord\'s purpose that prevails.', ref: 'Proverbs 19:21' },
  ],
};

export default function EngraftedWordScreen({ navigation }: any) {
  const [activeCategory, setActiveCategory] = useState('Faith');
  const verses = WORD_CATEGORIES[activeCategory] || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Engrafted Word</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <MaterialCommunityIcons name="book-open-variant" size={52} color={Colors.gold} />
          <Text style={styles.heroTitle}>The Engrafted Word</Text>
          <Text style={styles.heroSub}>Receive the Word with meekness</Text>
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, activeCategory === cat && styles.tabActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.section}>
          {verses.map((item, i) => (
            <View key={i} style={styles.verseCard}>
              <MaterialCommunityIcons name="format-quote-open" size={28} color={Colors.gold} style={{ marginBottom: 6 }} />
              <Text style={styles.verseText}>{item.verse}</Text>
              <View style={styles.verseFooter}>
                <Text style={styles.verseRef}>{item.ref}</Text>
                <TouchableOpacity style={styles.shareBtn}>
                  <MaterialCommunityIcons name="share-variant-outline" size={16} color={Colors.gold} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Sermons')}
          >
            <MaterialCommunityIcons name="play-circle-outline" size={20} color={Colors.dark} />
            <Text style={styles.actionBtnText}>Watch Teachings</Text>
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
    backgroundColor: Colors.surface, marginBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  heroTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginTop: Spacing.sm },
  heroSub:   { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },
  tabs: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tabActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:       { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  tabTextActive: { color: Colors.gold },
  section:       { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  verseCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  verseText:   { color: Colors.text, fontSize: FontSize.md, lineHeight: 26, fontStyle: 'italic', marginBottom: Spacing.sm },
  verseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verseRef:    { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '700' },
  shareBtn:    { padding: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 14, gap: Spacing.sm,
  },
  actionBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },
});
