/** YouTube thumbnail quality helpers */

type YTQuality = 'maxresdefault' | 'hqdefault' | 'mqdefault' | 'sddefault';

export function getYouTubeThumbnail(
  youtubeId: string,
  quality: YTQuality = 'hqdefault',
): string {
  return `https://img.youtube.com/vi/${youtubeId}/${quality}.jpg`;
}

/**
 * Resolve the best available thumbnail URL.
 * If `thumbnailUrl` is already set (from the API / YouTube Data API v3),
 * prefer it — those are already the highest-quality URL stored in the DB.
 * Fall back to constructing a URL from the youtubeId.
 */
export function resolveThumbnail(
  thumbnailUrl: string | null | undefined,
  youtubeId: string | null | undefined,
  quality: YTQuality = 'hqdefault',
): string {
  if (thumbnailUrl) return thumbnailUrl;
  if (youtubeId) return getYouTubeThumbnail(youtubeId, quality);
  return '';
}
