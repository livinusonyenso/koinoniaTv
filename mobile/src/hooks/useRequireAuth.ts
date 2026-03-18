import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

/**
 * Returns a `requireAuth` wrapper.
 * If the user is authenticated the action runs immediately.
 * If not, the AuthModal slides up and the action is dropped.
 *
 * Usage:
 *   const { requireAuth } = useRequireAuth();
 *   <Button onPress={() => requireAuth(() => saveBookmark(id))} />
 */
export function useRequireAuth() {
  const { authState } = useAuthStore();
  const navigation    = useNavigation<any>();

  const requireAuth = useCallback((action: () => void) => {
    if (authState === 'authenticated') {
      action();
    } else {
      navigation.navigate('AuthModal');
    }
  }, [authState, navigation]);

  return { requireAuth };
}
