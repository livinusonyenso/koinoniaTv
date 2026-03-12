import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const DECLARATIONS = [
  { text: 'I am more than a conqueror through Christ who loves me.', ref: 'Romans 8:37' },
  { text: 'The Lord is my light and my salvation; whom shall I fear?', ref: 'Psalm 27:1' },
  { text: 'I am the head and not the tail, above only and not beneath.', ref: 'Deuteronomy 28:13' },
  { text: 'No weapon formed against me shall prosper.', ref: 'Isaiah 54:17' },
  { text: 'I am blessed coming in and blessed going out.', ref: 'Deuteronomy 28:6' },
  { text: 'With long life God satisfies me and shows me His salvation.', ref: 'Psalm 91:16' },
  { text: 'I am the righteousness of God in Christ Jesus.', ref: '2 Corinthians 5:21' },
];

export default function DeclarationsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Declarations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <MaterialCommunityIcons name="bullhorn" size={52} color={Colors.gold} />
          <Text style={styles.heroTitle}>Faith Declarations</Text>
          <Text style={styles.heroSub}>Speak the Word over your life daily</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Declare Today</Text>
          {DECLARATIONS.map((item, i) => (
            <View key={i} style={styles.declarationCard}>
              <MaterialCommunityIcons name="format-quote-open" size={24} color={Colors.gold} style={{ marginBottom: 6 }} />
              <Text style={styles.declarationText}>{item.text}</Text>
              <Text style={styles.declarationRef}>{item.ref}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="share-variant" size={18} color={Colors.dark} />
            <Text style={styles.actionBtnText}>Share Declarations</Text>
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
  declarationCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderTopWidth: 2, borderTopColor: Colors.gold,
    ...Shadow.card,
  },
  declarationText: { color: Colors.text, fontSize: FontSize.md, lineHeight: 24, marginBottom: 8, fontStyle: 'italic' },
  declarationRef:  { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 14, gap: Spacing.sm,
  },
  actionBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },
});
