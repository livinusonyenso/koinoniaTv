import { createContext, useContext, useEffect, useRef, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: ConnectionType;
  isSlowConnection: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────
// Exported so App.tsx can create the Provider; screens use useNetwork() below.

export const NetworkContext = createContext<NetworkState>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: 'unknown',
  isSlowConnection: false,
});

/** Read network state from the nearest NetworkContext.Provider (set up in App.tsx). */
export function useNetwork(): NetworkState {
  return useContext(NetworkContext);
}

// ── Slow-connection detection ─────────────────────────────────────────────────

const SLOW_CELL_GENS = new Set(['2g', 'gprs', 'edge', 'iden', 'cdma', 'ehrpd']);

function parseNetInfo(state: NetInfoState): NetworkState {
  const isConnected = state.isConnected ?? false;
  const isInternetReachable = state.isInternetReachable ?? false;

  let connectionType: ConnectionType = 'unknown';
  if (state.type === 'wifi') connectionType = 'wifi';
  else if (state.type === 'cellular') connectionType = 'cellular';
  else if (state.type === 'none') connectionType = 'none';

  // Slow if not connected at all, or on a slow cellular generation
  const cellGen = (state as any).details?.cellularGeneration as string | null;
  const isSlowConnection =
    !isConnected ||
    (connectionType === 'cellular' && !!cellGen && SLOW_CELL_GENS.has(cellGen));

  return { isConnected, isInternetReachable, connectionType, isSlowConnection };
}

// ── Raw hook ──────────────────────────────────────────────────────────────────
// Used only in App.tsx to feed the NetworkContext.Provider.
// Everywhere else, call useNetwork() to read from context.

export function useNetworkState(): NetworkState {
  // Default to connected — never show the banner before we have real data
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
    isSlowConnection: false,
  });

  // Debounce timer for the offline state only.
  // Online state is applied immediately; offline requires 2 s of sustained disconnect
  // to avoid false positives from Android NetInfo init (which fires null → false → true).
  const offlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handle = (s: NetInfoState) => {
      const parsed = parseNetInfo(s);

      if (parsed.isConnected) {
        // Connected — cancel any pending offline timer, apply immediately
        if (offlineTimer.current) {
          clearTimeout(offlineTimer.current);
          offlineTimer.current = null;
        }
        setState(parsed);
      } else {
        // Disconnected — only apply after 2 s of sustained disconnect
        if (offlineTimer.current) return; // timer already running
        offlineTimer.current = setTimeout(() => {
          offlineTimer.current = null;
          setState(parsed);
        }, 2000);
      }
    };

    // Immediate fetch for the current state
    NetInfo.fetch().then(handle);

    // Subscribe to all future changes
    const unsubscribe = NetInfo.addEventListener(handle);

    return () => {
      unsubscribe();
      if (offlineTimer.current) clearTimeout(offlineTimer.current);
    };
  }, []);

  return state;
}
