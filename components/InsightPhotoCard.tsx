import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';
import type { InsightPhoto } from '../types/insights';

interface InsightPhotoCardProps {
  photo: InsightPhoto;
  rank: number;
}

export function InsightPhotoCard({ photo, rank }: InsightPhotoCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>
      <Image source={{ uri: photo.imageUrl }} style={styles.image} contentFit="cover" />
      <View style={styles.meta}>
        <Text style={styles.category} numberOfLines={1}>
          {photo.categoryName}
        </Text>
        <Text style={styles.statLabel}>{photo.statLabel}</Text>
        <Text style={styles.statValue} numberOfLines={2}>
          {photo.statValue}
        </Text>
      </View>
    </View>
  );
}

const CARD_WIDTH = 148;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.accentText,
  },
  image: {
    width: CARD_WIDTH,
    height: 100,
    backgroundColor: theme.colors.surfaceAlt,
  },
  meta: {
    padding: theme.spacing.sm,
    gap: 2,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 16,
  },
});

export const INSIGHT_PHOTO_CARD_WIDTH = CARD_WIDTH;
