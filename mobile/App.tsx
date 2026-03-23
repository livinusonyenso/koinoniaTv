import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { NetworkContext, useNetworkState } from './src/hooks/useNetworkState';
import OfflineBanner from './src/components/common/OfflineBanner';
import SlowConnectionBanner from './src/components/common/SlowConnectionBanner';

// ── QueryClient — 24h gcTime, smart retry, offline-friendly ───────────────────
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays in memory for 24h — users can browse cached content offline
      gcTime: 24 * 60 * 60 * 1000,

      // Treat data as fresh for 5 min before refetching in the background
      staleTime: 5 * 60 * 1000,

      // Retry up to 2× for network/server errors; never retry 4xx (client errors)
      retry: (failureCount, error: any) => {
        const status = error?.response?.status ?? error?.status;
        if (status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: 1000,

      // Mobile apps don't have a "window focus" concept — skip that refetch
      refetchOnWindowFocus: false,

      // Automatically refetch stale queries when network reconnects
      refetchOnReconnect: true,
    },
    mutations: {
      // Never auto-retry mutations — side-effects must be explicit
      retry: 0,
    },
  },
});

// ── Inner component reads from NetInfo and feeds context + banners ─────────────
function AppInner() {
  const network = useNetworkState();

  return (
    <NetworkContext.Provider value={network}>
      <View style={{ flex: 1 }}>
        <AppNavigator />
        {/* Banners overlay the nav — never push content down */}
        <OfflineBanner isConnected={network.isConnected} />
        <SlowConnectionBanner
          isSlowConnection={network.isSlowConnection}
          isConnected={network.isConnected}
        />
      </View>
    </NetworkContext.Provider>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AppInner />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
