import { QueryKey, UseQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNetwork } from './useNetworkState';

interface OfflineQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  /** True only when the query errored AND there is no cached data to show. */
  showErrorState: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  /** True when offline */
  isOffline: boolean;
  /** Unix ms timestamp of when data was last successfully fetched, or null */
  dataUpdatedAt: number | null;
}

/**
 * Offline-aware wrapper around useQuery.
 *
 * Differences from plain useQuery:
 * - `placeholderData` keeps the previous page's data visible while refetching
 * - `showErrorState` is false when we have cached data to show (error is silent)
 * - `dataUpdatedAt` lets the UI display "Cached X hours ago" when offline
 * - Adds `isOffline` flag from NetworkContext
 */
export function useOfflineQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryKey' | 'queryFn' | 'placeholderData'>,
): OfflineQueryResult<T> {
  const { isConnected } = useNetwork();
  const queryClient = useQueryClient();

  const result = useQuery<T, Error, T, QueryKey>({
    queryKey,
    queryFn,
    // Show stale cached data while refetching instead of a loading spinner
    placeholderData: (prev) => prev,
    refetchOnReconnect: true,
    ...options,
  });

  // When did we last get fresh data from the server?
  const state = queryClient.getQueryState(queryKey);
  const dataUpdatedAt = state?.dataUpdatedAt ?? null;

  return {
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isRefetching: result.isRefetching,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
    isOffline: !isConnected,
    dataUpdatedAt: dataUpdatedAt ?? null,
    // Only show a full-screen error state when we have NO cached data to fall back on
    showErrorState: result.isError && result.data === undefined,
  };
}
