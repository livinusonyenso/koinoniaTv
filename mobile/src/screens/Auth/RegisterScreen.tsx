import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { authApi } from '../../api';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

export default function RegisterScreen({ navigation }: any) {
  const { signInWithGoogle, loading: googleLoading, error: googleError, ready } = useGoogleAuth();

  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  /** Close the AuthModal after successful register → Login with success msg. */
  const goToLogin = () =>
    navigation.navigate('Login', { successMessage: 'Account created! Please sign in.' });

  const handleRegister = async () => {
    setError('');
    if (!fullName.trim())   { setError('Please enter your full name.');            return; }
    if (!email.trim())      { setError('Please enter your email.');                return; }
    if (!password)          { setError('Please enter a password.');                return; }
    if (password.length < 6){ setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm){ setError('Passwords do not match.');                return; }

    setLoading(true);
    try {
      await authApi.register(email.trim().toLowerCase(), password, fullName.trim());
      goToLogin();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Registration failed. Please try again.';
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

            {/* ── Form card ── */}
            <View style={styles.form}>
              <Text style={styles.formTitle}>Create an account</Text>

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
                accessibilityLabel="Sign up with Google"
              >
                {googleLoading
                  ? <ActivityIndicator size="small" color={Colors.dark} />
                  : <>
                      <MaterialCommunityIcons name="google" size={18} color={Colors.dark} />
                      <Text style={styles.googleBtnText}>Sign up with Google</Text>
                    </>
                }
              </TouchableOpacity>

              {/* ── Divider ── */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or sign up with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* ── Fields ── */}
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="John Doe"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Full name"
              />

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

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  returnKeyType="next"
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

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repeat your password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showConf}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  accessibilityLabel="Confirm password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConf(p => !p)}
                  accessibilityLabel={showConf ? 'Hide confirm password' : 'Show confirm password'}
                >
                  <MaterialCommunityIcons
                    name={showConf ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.registerBtn, loading && { opacity: 0.75 }]}
                onPress={handleRegister}
                disabled={loading}
                accessibilityLabel="Create account button"
              >
                {loading
                  ? <ActivityIndicator size="small" color={Colors.dark} />
                  : <Text style={styles.registerBtnText}>Create Account</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Login</Text>
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
  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSize.xs, marginHorizontal: Spacing.sm },

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

  registerBtn: {
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 15, alignItems: 'center', marginTop: Spacing.sm,
  },
  registerBtnText: { color: Colors.dark, fontSize: FontSize.md, fontWeight: '800' },

  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: { color: Colors.textMuted, fontSize: FontSize.sm },
  footerLink: { color: Colors.gold, fontSize: FontSize.sm, fontWeight: '700' },
});
