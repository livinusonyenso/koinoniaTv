import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:         '#0D0A1A',
  card:       '#16112A',
  cardBorder: '#2D1B55',
  gold:       '#F4C430',
  text:       '#F5F0FF',
  textMute:   '#5E5380',
  red:        '#EF4444',
  redDim:     '#3A1515',
} as const;

// ── Config per error type ─────────────────────────────────────────────────────
type ErrorType = 'network' | 'server' | 'empty' | 'notFound';

const DEFAULTS: Record<ErrorType, { icon: string; iconColor: string; title: string; message: string }> = {
  network: {
    icon:      'wifi-off',
    iconColor: T.red,
    title:     'No Connection',
    message:   'Check your internet and try again.\nCached content is shown below.',
  },
  server: {
    icon:      'server-off',
    iconColor: T.gold,
    title:     'Something went wrong',
    message:   'Our servers had a hiccup.\nPull down to refresh.',
  },
  empty: {
    icon:      'inbox-outline',
    iconColor: T.textMute,
    title:     'Nothing here yet',
    message:   'Content will appear here once available.',
  },
  notFound: {
    icon:      'magnify-close',
    iconColor: T.textMute,
    title:     'No results found',
    message:   'Try a different search or browse by category.',
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface ErrorStateProps {
  type: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => Promise<unknown> | unknown;
  icon?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ErrorState({ type, title, message, onRetry, icon }: ErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const cfg = DEFAULTS[type];

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon circle */}
      <View style={[
        styles.iconCircle,
        type === 'network' && { backgroundColor: T.redDim, borderColor: T.red + '44' },
      ]}>
        <MaterialCommunityIcons
          name={(icon ?? cfg.icon) as any}
          size={36}
          color={cfg.iconColor}
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>{title ?? cfg.title}</Text>

      {/* Message */}
      <Text style={styles.message}>{message ?? cfg.message}</Text>

      {/* Retry button */}
      {!!onRetry && (
        <TouchableOpacity
          style={[styles.retryBtn, isRetrying && styles.retryBtnDisabled]}
          onPress={handleRetry}
          disabled={isRetrying}
          activeOpacity={0.8}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color={T.bg} />
          ) : (
            <MaterialCommunityIcons name="refresh" size={16} color={T.bg} />
          )}
          <Text style={styles.retryText}>{isRetrying ? 'Retrying…' : 'Try Again'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.bg,
    paddingHorizontal: 40,
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: T.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    color: T.textMute,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: T.gold,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: 8,
    minWidth: 140,
    justifyContent: 'center',
  },
  retryBtnDisabled: {
    opacity: 0.75,
  },
  retryText: {
    color: T.bg,
    fontSize: 14,
    fontWeight: '800',
  },
});
