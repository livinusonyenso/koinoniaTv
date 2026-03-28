import React from 'react';
import {
  View, Text, Switch, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function NotificationsScreen({ navigation }: any) {
  const { authState } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: userApi.getNotificationPrefs,
    enabled: authState === 'authenticated',
  });

  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      userApi.updateNotificationPrefs({ notificationsEnabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-prefs'] }),
  });

  const isEnabled = data?.notificationsEnabled ?? true;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Push Notifications toggle */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="bell-outline" size={20} color={Colors.gold} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Push Notifications</Text>
                <Text style={styles.rowSub}>
                  Get notified about new sermons and live events
                </Text>
              </View>
            </View>

            {isLoading || mutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.gold} />
            ) : authState !== 'authenticated' ? (
              <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.textMuted} />
            ) : (
              <Switch
                value={isEnabled}
                onValueChange={(val) => mutation.mutate(val)}
                trackColor={{ false: Colors.border, true: Colors.gold + '88' }}
                thumbColor={isEnabled ? Colors.gold : Colors.textMuted}
              />
            )}
          </View>
        </View>

        {/* Notification types info */}
        <Text style={styles.sectionLabel}>You will be notified about</Text>
        {[
          { icon: 'play-circle-outline',  label: 'New sermon uploads' },
          { icon: 'television-play',       label: 'Live stream alerts' },
          { icon: 'calendar-star',         label: 'Upcoming events & programs' },
          { icon: 'lightning-bolt-outline',label: 'Miracle service announcements' },
        ].map((item) => (
          <View key={item.label} style={styles.infoRow}>
            <MaterialCommunityIcons name={item.icon as any} size={18} color={Colors.gold} />
            <Text style={styles.infoText}>{item.label}</Text>
          </View>
        ))}

        {/* Sign-in prompt for guests */}
        {authState !== 'authenticated' && (
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('AuthModal')}
            activeOpacity={0.85}
          >
            <Text style={styles.signInText}>Sign in to manage notifications</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  title:   { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  scroll:  { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, marginRight: Spacing.sm },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.gold + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  rowText:  { flex: 1 },
  rowTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  rowSub:   { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },

  sectionLabel: {
    color: Colors.textSecond, fontSize: FontSize.sm,
    fontWeight: '600', marginTop: Spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, paddingVertical: 6,
  },
  infoText: { color: Colors.textSecond, fontSize: FontSize.sm },

  signInBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.gold,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signInText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },
});
