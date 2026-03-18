import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../store/authStore';

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const googleConfigured = !!(ANDROID_CLIENT_ID || IOS_CLIENT_ID || WEB_CLIENT_ID);

export function useGoogleAuth() {
  const { loginWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest(
    googleConfigured
      ? { androidClientId: ANDROID_CLIENT_ID, iosClientId: IOS_CLIENT_ID, webClientId: WEB_CLIENT_ID }
      : null,
  );

  useEffect(() => {
    if (response?.type !== 'success') return;

    // webClientId present  → id_token available (preferred)
    // androidClientId only → only access_token available
    const token =
      response.params?.id_token ||
      response.authentication?.idToken ||
      response.params?.access_token ||
      response.authentication?.accessToken;

    if (!token) {
      setError('Google sign-in failed. No token received.');
      return;
    }

    const tokenType = response.params?.id_token || response.authentication?.idToken
      ? 'id_token'
      : 'access_token';

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
