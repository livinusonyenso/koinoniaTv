import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../store/authStore';

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     || '';
const WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     || '';

const googleConfigured = !!(ANDROID_CLIENT_ID || IOS_CLIENT_ID || WEB_CLIENT_ID);

// expo-auth-session throws an invariant if ALL client IDs are undefined on a
// given platform. We must always pass at least a non-empty placeholder so the
// hook initialises safely. When googleConfigured=false the button stays
// disabled (ready=false) and signInWithGoogle is a no-op.
const SAFE_ANDROID = ANDROID_CLIENT_ID || 'not-configured';
const SAFE_IOS     = IOS_CLIENT_ID     || undefined;
const SAFE_WEB     = WEB_CLIENT_ID     || undefined;

export function useGoogleAuth() {
  const { loginWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: SAFE_ANDROID,
    iosClientId:     SAFE_IOS,
    webClientId:     SAFE_WEB,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;

    // id_token when webClientId is set; access_token for Android-only flow
    const idToken     = response.params?.id_token;
    const accessToken = response.params?.access_token;
    const token       = idToken || accessToken;
    const tokenType: 'id_token' | 'access_token' = idToken ? 'id_token' : 'access_token';

    if (!token) {
      setError('Google sign-in failed. No token received.');
      return;
    }

    setLoading(true);
    setError('');
    loginWithGoogle(token, tokenType)
      .catch(() => setError('Could not sign in with Google. Please try again.'))
      .finally(() => setLoading(false));
  }, [response]);

  const signInWithGoogle = () => {
    setError('');
    promptAsync();
  };

  return {
    signInWithGoogle,
    loading,
    error,
    ready: googleConfigured && !!request,
  };
}
