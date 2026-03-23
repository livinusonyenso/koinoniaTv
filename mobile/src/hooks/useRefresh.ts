import { useCallback, useState } from 'react';

/**
 * Reusable pull-to-refresh helper.
 * Wraps the TanStack Query `refetch` function (or any async fn) and manages
 * the refreshing boolean. Always resets to false — even if refetch throws.
 */
export function useRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
