import { Image } from 'expo-image';

/**
 * Prefetch a list of thumbnail URLs into expo-image's disk cache.
 * Call this after a list of videos loads so thumbnails are ready
 * before the user scrolls to them.
 */
export async function prefetchThumbnails(urls: string[]): Promise<void> {
  const valid = urls.filter(Boolean);
  if (valid.length === 0) return;
  try {
    await Image.prefetch(valid);
  } catch {
    // prefetch is best-effort — never crash the caller
  }
}
