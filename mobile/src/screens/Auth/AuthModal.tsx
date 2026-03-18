import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

/**
 * Bottom-sheet style auth prompt.
 * Three choices:  Google  |  Email  |  Maybe Later
 *
 * Presented as a modal from the RootStack. Login / Register screens
 * are pushed on top of this inside the AuthInnerStack.
 */
export default function AuthModal({ navigation }: any) {
  const { signInWithGoogle, loading, error, ready } = useGoogleAuth();

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        {/* ── Handle bar ── */}
        <View style={styles.handle} />

        {/* ── Brand ── */}
        <View style={styles.brand}>
          <MaterialCommunityIcons name="television-play" size={32} color={Colors.gold} />
          <Text style={styles.wordmark}>KOINONIA TV</Text>
          <Text style={styles.tagline}>Watch · Grow · Be Transformed</Text>
        </View>

        <Text style={styles.heading}>Sign in to unlock all features</Text>
        <Text style={styles.sub}>
          Bookmark sermons, submit prayer requests, and track your journey.
        </Text>

        {/* ── Google error ── */}
        {!!error && (
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle" size={14} color={Colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Google button ── */}
        <TouchableOpacity
          style={[styles.googleBtn, (!ready || loading) && { opacity: 0.6 }]}
          onPress={signInWithGoogle}
          disabled={!ready || loading}
          accessibilityLabel="Continue with Google"
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.dark} />
          ) : (
            <>
              <MaterialCommunityIcons name="google" size={20} color={Colors.dark} />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Email button ── */}
        <TouchableOpacity
          style={styles.emailBtn}
          onPress={() => navigation.navigate('Login')}
          accessibilityLabel="Continue with email"
        >
          <MaterialCommunityIcons name="email-outline" size={20} color={Colors.gold} />
          <Text style={styles.emailBtnText}>Continue with Email</Text>
        </TouchableOpacity>

        {/* ── Skip ── */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.getParent()?.goBack()}
          accessibilityLabel="Maybe later"
        >
          <Text style={styles.skipText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },

  // Brand
  brand: { alignItems: 'center', marginBottom: Spacing.lg },
  wordmark: {
    color: Colors.gold, fontSize: FontSize.lg,
    fontWeight: '900', letterSpacing: 2, marginTop: Spacing.sm,
  },
  tagline: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  heading: {
    color: Colors.text, fontSize: FontSize.xl, fontWeight: '800',
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  sub: {
    color: Colors.textMuted, fontSize: FontSize.sm,
    textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg,
  },

  // Error
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Spacing.sm,
  },
  errorText: { color: Colors.red, fontSize: FontSize.xs, flex: 1 },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.gold,
    borderRadius: Radius.pill, paddingVertical: 15,
    marginBottom: Spacing.md,
  },
  googleBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },

  // Divider
  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSize.xs, marginHorizontal: Spacing.sm },

  // Email
  emailBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.gold,
    borderRadius: Radius.pill, paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  emailBtnText: { color: Colors.gold, fontSize: FontSize.md, fontWeight: '700' },

  // Skip
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
