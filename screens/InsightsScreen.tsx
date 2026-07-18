import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { InsightPhotoCard } from '../components/InsightPhotoCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { fetchPlatformInsights } from '../lib/services/insightsService';
import { theme } from '../lib/theme';
import type { InsightPhoto, PlatformInsights } from '../types/insights';

function PhotoStrip({
  title,
  subtitle,
  photos,
}: {
  title: string;
  subtitle: string;
  photos: InsightPhoto[];
}) {
  if (photos.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photoStrip}
      >
        {photos.map((photo, index) => (
          <InsightPhotoCard key={photo.roundContentId} photo={photo} rank={index + 1} />
        ))}
      </ScrollView>
    </View>
  );
}

export function InsightsScreen() {
  const [insights, setInsights] = useState<PlatformInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInsights(await fetchPlatformInsights());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Insights"
          subtitle="Public forecast data and photo analytics"
        />
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.textMuted} size="large" />
        </View>
      </View>
    );
  }

  if (error || !insights) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Insights"
          subtitle="Public forecast data and photo analytics"
        />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Could not load insights</Text>
          <Text style={styles.errorText}>{error ?? 'Unknown error'}</Text>
          <Pressable style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const controversialTitle = insights.crowdActive
    ? 'Most controversial'
    : 'Most AI-disputed';
  const controversialSub = insights.crowdActive
    ? 'Photos where the crowd split closest to 50/50 real vs fake.'
    : 'Photos where GPT-4o, Claude, and Gemini disagreed the most.';
  const agreedTitle = insights.crowdActive ? 'Most agreed upon' : 'Strongest AI consensus';
  const agreedSub = insights.crowdActive
    ? 'Crowd forecasts closest to the ground-truth label.'
    : 'Photos where all three sponsor models landed near the same odds.';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Insights"
          subtitle="Public forecast data and photo analytics"
        />

        <View style={styles.statsGrid}>
          <View style={[styles.statBox, styles.statHighlight]}>
            <Text style={styles.statNum}>{insights.totalImages}</Text>
            <Text style={styles.statLabel}>Images in pool</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{insights.totalCrowdForecasts}</Text>
            <Text style={styles.statLabel}>Crowd forecasts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{insights.totalGames}</Text>
            <Text style={styles.statLabel}>Games played</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{insights.totalAnalysts}</Text>
            <Text style={styles.statLabel}>Analysts</Text>
          </View>
        </View>

        {!insights.crowdActive && (
          <Text style={styles.crowdHint}>
            Crowd analytics will appear once players complete games — AI model stats are live now.
          </Text>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI model calibration</Text>
          <Text style={styles.sectionSub}>
            Average distance from ground truth (lower is better).
          </Text>
          {insights.aiModelStats.map((model, index) => (
            <View key={model.modelId} style={styles.modelRow}>
              <View style={styles.modelRank}>
                <Text style={styles.modelRankText}>{index + 1}</Text>
              </View>
              <View style={styles.modelBody}>
                <Text style={styles.modelName}>
                  {model.modelName}
                  {model.sponsor ? ` · ${model.sponsor}` : ''}
                </Text>
                <View style={styles.modelBarTrack}>
                  <View
                    style={[
                      styles.modelBarFill,
                      { width: `${Math.min(100, model.avgError)}%` },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.modelError}>{model.avgError.toFixed(1)} pts</Text>
            </View>
          ))}
        </View>

        <PhotoStrip
          title={controversialTitle}
          subtitle={controversialSub}
          photos={insights.mostControversial}
        />

        <PhotoStrip title={agreedTitle} subtitle={agreedSub} photos={insights.mostAgreed} />

        <PhotoStrip
          title="Hardest fakes"
          subtitle="AI-generated images that fooled the models most (lowest fake odds)."
          photos={insights.hardestFakes}
        />

        <PhotoStrip
          title="Easiest fakes"
          subtitle="Synthetic images all three models flagged quickly."
          photos={insights.easiestFakes}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By category</Text>
          <Text style={styles.sectionSub}>Pool size and model error by market.</Text>
          {insights.categoryStats.map((cat) => (
            <View key={cat.categoryId} style={styles.categoryRow}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <View style={styles.categoryBody}>
                <Text style={styles.categoryName}>{cat.categoryName}</Text>
                <Text style={styles.categoryMeta}>
                  {cat.imageCount} images · AI err {cat.avgAiError.toFixed(1)} pts
                  {cat.forecastCount > 0
                    ? ` · ${cat.forecastCount} crowd forecasts`
                    : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statHighlight: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: theme.colors.accent,
  },
  statNum: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  crowdHint: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  photoStrip: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.xl,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modelRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelRankText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text,
  },
  modelBody: {
    flex: 1,
    gap: 6,
  },
  modelName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modelBarTrack: {
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.sliderTrack,
    overflow: 'hidden',
  },
  modelBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
  },
  modelError: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryBody: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
  },
  categoryMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.accentText,
  },
  footerSpacer: {
    height: theme.spacing.lg,
  },
});
