import React from 'react';
import { Image, ImageStyle, ImageContentFit } from 'expo-image';
import { StyleProp } from 'react-native';

interface Props {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  /** Set false for above-the-fold / hero images that should load eagerly */
  lazy?: boolean;
  /** Accessible description */
  accessibilityLabel?: string;
}

/**
 * Drop-in replacement for <Image> that uses expo-image's memory+disk cache,
 * smooth 200ms fade-in transition, and lazy loading for off-screen items.
 */
const SmartImage: React.FC<Props> = ({
  uri,
  style,
  contentFit = 'cover',
  lazy = true,
  accessibilityLabel,
}) => (
  <Image
    source={{ uri }}
    style={style}
    contentFit={contentFit}
    cachePolicy="memory-disk"
    transition={200}
    recyclingKey={uri}
    accessible={!!accessibilityLabel}
    accessibilityLabel={accessibilityLabel}
  />
);

export default React.memo(SmartImage);
