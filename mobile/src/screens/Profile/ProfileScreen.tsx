import React from 'react';
import {
  View, Text, Switch, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { userApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, authState, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => userApi.getNotificationPrefs(),
    enabled: authState === 'authenticated',
  });

  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      userApi.updateNotificationPrefs({ notificationsEnabled: enabled }),
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-prefs'], data);
    },
  });

  const handleToggle = (value: boolean) => {
    mutation.mutate(value);
  };

  const handleLogout = async () => {
    await logout();
    navigation?.navigate?.('Main');
  };

  if (authState !== 'authenticated') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.guestBox}>
          <MaterialCommunityIcons name="account-circle-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.guestTitle}>You are not signed in</Text>
          <Text style={styles.guestSub}>Sign in to manage your preferences</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation?.navigate?.('AuthModal')}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-circle" size={64} color={Colors.gold} />
        <Text style={styles.name}>{user?.fullName ?? user?.name ?? 'Believer'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Notification preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={Colors.gold} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Push Notifications</Text>
              <Text style={styles.rowSub}>New sermons, live streams & daily word</Text>
            </View>
          </View>
          {prefsLoading ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : (
            <Switch
              value={prefs?.notificationsEnabled ?? true}
              onValueChange={handleToggle}
              disabled={mutation.isPending}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.gold}
            />
          )}
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>

        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="logout" size={22} color={Colors.red} />
            <Text style={[styles.rowLabel, { color: Colors.red }]}>Sign Out</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  email: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  rowSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  guestBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  guestTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  guestSub: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  signInBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  signInBtnText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
