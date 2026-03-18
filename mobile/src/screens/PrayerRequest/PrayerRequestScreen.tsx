import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import { userApi } from '../../api';

const CATEGORIES = ['Healing', 'Financial', 'Family', 'Career', 'Marriage', 'Salvation', 'Other'];

export default function PrayerRequestScreen({ navigation }: any) {
  const [name, setName]         = useState('');
  const [request, setRequest]   = useState('');
  const [category, setCategory] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!request.trim()) {
      Alert.alert('Please enter your prayer request.');
      return;
    }
    if (!category) {
      Alert.alert('Please select a category.');
      return;
    }

    setLoading(true);
    try {
      await userApi.submitPrayerRequest(name.trim() || 'Anonymous', category, request.trim());
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Could not submit your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prayer Request</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.successContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon glow badge */}
          <View style={styles.successIconWrapper}>
            <MaterialCommunityIcons name="check-circle" size={80} color={Colors.gold} />
          </View>

          <Text style={styles.successTitle}>Request Submitted!</Text>

          <Text style={styles.successText}>
            Your prayer request has been received.{'\n'}
            Our prayer team will stand in agreement with you.
          </Text>

          {/* Verse card */}
          <View style={styles.successVerseCard}>
            <MaterialCommunityIcons name="book-open-variant" size={18} color={Colors.gold} style={{ marginBottom: 6 }} />
            <Text style={styles.successVerse}>
              "The effective, fervent prayer of a righteous man avails much."
            </Text>
            <Text style={styles.successVerseRef}>— James 5:16</Text>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="home" size={20} color={Colors.dark} />
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.anotherBtn}
            onPress={() => { setName(''); setRequest(''); setCategory(''); setSubmitted(false); }}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color={Colors.gold} />
            <Text style={styles.anotherBtnText}>Submit another request</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.heroBanner}>
            <MaterialCommunityIcons name="email-heart-outline" size={52} color={Colors.gold} />
            <Text style={styles.heroTitle}>Submit Prayer Request</Text>
            <Text style={styles.heroSub}>We will agree with you in prayer</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Your Name (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Your Prayer Request</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your prayer request here…"
              placeholderTextColor={Colors.textMuted}
              value={request}
              onChangeText={setRequest}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.promiseCard}>
              <MaterialCommunityIcons name="shield-check" size={20} color={Colors.gold} />
              <Text style={styles.promiseText}>
                Your request is confidential and will be covered in prayer by our team.
              </Text>
            </View>

            <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator size="small" color={Colors.dark} />
                : <><MaterialCommunityIcons name="send" size={20} color={Colors.dark} /><Text style={styles.submitBtnText}>Send Prayer Request</Text></>
              }
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  form:      { paddingHorizontal: Spacing.md },
  label:     { color: Colors.textSecond, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    color: Colors.text, fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  textArea:    { height: 130, paddingTop: 12 },
  categoryRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 },
  categoryChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  categoryChipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryChipText:       { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  categoryChipTextActive: { color: Colors.gold },
  promiseCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.gold,
  },
  promiseText: { flex: 1, color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 20 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 14, gap: Spacing.sm,
  },
  submitBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },

  // ── Success screen ──────────────────────────────────────────
  successContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  successIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  successText: {
    color: Colors.textSecond,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  successVerseCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
  },
  successVerse: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  successVerseRef: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 6,
    fontStyle: 'italic',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.md,
  },
  doneBtnText: {
    color: Colors.dark,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  anotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  anotherBtnText: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});