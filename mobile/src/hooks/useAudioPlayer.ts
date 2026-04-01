import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AudioTrack {
  videoId: number;
  title: string;
  thumbnailUrl: string;
  audioUrl: string;
}

export interface AudioPlayerState {
  track: AudioTrack | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  isLoading: boolean;
}

export interface AudioPlayerControls {
  play: (track: AudioTrack) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

export const AudioPlayerContext = createContext<AudioPlayerState & AudioPlayerControls>({
  track: null,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  isLoading: false,
  play: async () => {},
  pause: async () => {},
  resume: async () => {},
  stop: async () => {},
  seek: async () => {},
});

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}

// ── Raw hook — used only in App.tsx to create the provider value ───────────────

export function useAudioPlayerState(): AudioPlayerState & AudioPlayerControls {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Configure audio session once on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const onPlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPositionMs(status.positionMillis);
    setDurationMs(status.durationMillis ?? 0);
    // Auto-stop when finished
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMs(0);
    }
  };

  const play = async (newTrack: AudioTrack) => {
    setIsLoading(true);
    try {
      // Unload any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setTrack(newTrack);
      setPositionMs(0);
      setDurationMs(0);

      const { sound } = await Audio.Sound.createAsync(
        { uri: newTrack.audioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        onPlaybackStatus,
      );
      soundRef.current = sound;
    } catch (e) {
      console.warn('[AudioPlayer] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const pause = async () => {
    await soundRef.current?.pauseAsync();
  };

  const resume = async () => {
    await soundRef.current?.playAsync();
  };

  const stop = async () => {
    await soundRef.current?.stopAsync();
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    setTrack(null);
    setIsPlaying(false);
    setPositionMs(0);
    setDurationMs(0);
  };

  const seek = async (ms: number) => {
    await soundRef.current?.setPositionAsync(ms);
  };

  return { track, isPlaying, positionMs, durationMs, isLoading, play, pause, resume, stop, seek };
}
