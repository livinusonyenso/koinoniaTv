import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

export default function LoginScreen({ navigation, route }: any) {
  const { login } = useAuthStore();
  const { signInWithGoogle, loading: googleLoading, error: googleError, ready } = useGoogleAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const successMsg: string | undefined = route?.params?.successMessage;

  /** Close the AuthModal (or go back if opened standalone). */
  const closeModal = () => navigation.getParent()?.goBack();

  const handleLogin = async () => {
    setError('');
    if (!email.trim())    { setError('Please enter your email.');    return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      closeModal();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Invalid email or password.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const combinedError = error || googleError;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Back ── */}
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* ── Brand ── */}
            <View style={styles.brand}>
              <View style={styles.logoBox}>
                <MaterialCommunityIcons name="television-play" size={32} color={Colors.gold} />
              </View>
              <Text style={styles.wordmark}>KOINONIA TV</Text>
            </View>

            {/* ── Success banner from Register ── */}
            {!!successMsg && (
              <View style={styles.successBanner}>
                <MaterialCommunityIcons name="check-circle" size={16} color={Colors.green} />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* ── Form card ── */}
            <View style={styles.form}>
              <Text style={styles.formTitle}>Welcome back</Text>

              {!!combinedError && (
                <View style={styles.errorBanner}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.red} />
                  <Text style={styles.errorText}>{combinedError}</Text>
                </View>
              )}

              {/* ── Google ── */}
              <TouchableOpacity
                style={[styles.googleBtn, (!ready || googleLoading) && { opacity: 0.6 }]}
                onPress={signInWithGoogle}
                disabled={!ready || googleLoading}
                accessibilityLabel="Continue with Google"
              >
                {googleLoading
                  ? <ActivityIndicator size="small" color={Colors.dark} />
                  : <>
                      <MaterialCommunityIcons name="google" size={18} color={Colors.dark} />
                      <Text style={styles.googleBtnText}>Continue with Google</Text>
                    </>
                }
              </TouchableOpacity>

              {/* ── Divider ── */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* ── Email ── */}
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                accessibilityLabel="Email address"
              />

              {/* ── Password ── */}
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPass(p => !p)}
                  accessibilityLabel={showPass ? 'Hide password' : 'Show password'}
                >
                  <MaterialCommunityIcons
                    name={showPass ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* ── Login button ── */}
              <TouchableOpacity
                style={[styles.loginBtn, loading && { opacity: 0.75 }]}
                onPress={handleLogin}
                disabled={loading}
                accessibilityLabel="Login button"
              >
                {loading
                  ? <ActivityIndicator size="small" color={Colors.dark} />
                  : <Text style={styles.loginBtnText}>Login</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  scroll:  { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  backBtn: { marginBottom: Spacing.sm },

  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox: {
    width: 64, height: 64, borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  wordmark: {
    color: Colors.gold, fontSize: FontSize.xl,
    fontWeight: '900', letterSpacing: 3,
  },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: Radius.md, padding: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.green,
    marginBottom: Spacing.md,
  },
  successText: { color: Colors.green, fontSize: FontSize.sm, flex: 1 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: Radius.md, padding: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.red,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.red, fontSize: FontSize.sm, flex: 1 },

  form:      { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg },
  formTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.lg },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.gold,
    borderRadius: Radius.pill, paddingVertical: 13,
    marginBottom: Spacing.md,
  },
  googleBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSize.xs, marginHorizontal: Spacing.sm },

  // Inputs
  label: {
    color: Colors.textSecond ?? Colors.textMuted,
    fontSize: FontSize.sm, fontWeight: '600', marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card ?? Colors.dark,
    borderWidth: 1, borderColor: Colors.border ?? '#2D2540',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    color: Colors.text, fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  passwordRow:   { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn:        { position: 'absolute', right: 14, top: 13 },

  loginBtn: {
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 15, alignItems: 'center', marginTop: Spacing.sm,
  },
  loginBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },

  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: { color: Colors.textMuted, fontSize: FontSize.sm },
  footerLink: { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '700' },
});
