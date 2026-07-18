import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProbabilityTrack } from './ProbabilityTrack';
import { CategoryThemeProvider } from '../context/CategoryThemeContext';
import { getSponsorModelById } from '../lib/ai/sponsorModels';
import { formatModelSubtitle } from '../lib/ai/sponsorModels';
import {
  displayTruthValue,
  formatBrier,
  formatMs,
  formatRbp,
  truthLabel,
} from '../lib/scoring';
import { getCategoryTheme, theme } from '../lib/theme';
import type { GameRound } from '../types/game';

interface RoundBreakdownProps {
  round: GameRound;
  categoryId: string;
}

function RoundDetailContent({ round, categoryId }: { round: GameRound; categoryId: string }) {
  const cat = getCategoryTheme(categoryId);
  const answer = round.playerAnswer;
  const truthDisplay = displayTruthValue(round.truthValue);

  if (!answer) {
    return <Text style={{ color: theme.colors.textMuted }}>Not played yet</Text>;
  }

  return (
    <>
      <Image source={{ uri: round.imageUrl }} style={styles.image} contentFit="cover" />

      <View style={styles.scoreRow}>
        <View style={[styles.scorePill, { backgroundColor: cat.primaryMuted }]}>
          <Text style={styles.scorePillLabel}>RBP</Text>
          <Text
            style={[
              styles.scorePillValue,
              { color: answer.roundScore >= 0 ? theme.colors.success : theme.colors.danger },
            ]}
          >
            {formatRbp(answer.roundScore)}
          </Text>
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scorePillLabel}>Your Brier</Text>
          <Text style={styles.scorePillValue}>{formatBrier(answer.userBrier)}</Text>
        </View>
        <View style={[styles.scorePill, { borderColor: cat.primary, borderWidth: 1 }]}>
          <Text style={styles.scorePillLabel}>Benchmark</Text>
          <Text style={[styles.scorePillValue, { color: cat.primary }]}>
            {formatBrier(answer.benchmarkBrier)}
          </Text>
        </View>
      </View>

      <Text style={styles.benchmarkNote}>
        Benchmark = 45% crowd + 55% AI models · Truth: {truthLabel(round.truthValue)} ({truthDisplay})
      </Text>

      <ProbabilityTrack label="Your forecast" value={answer.answerValue} highlight />
      <ProbabilityTrack
        label="Crowd consensus"
        value={round.crowdMean}
        color={theme.colors.warning}
        subtitle="Aggregated player forecasts"
      />

      {round.aiAnswers.map((ai) => {
        const model = getSponsorModelById(ai.aiModelId);
        return (
          <ProbabilityTrack
            key={ai.aiModelId}
            label={model?.name ?? ai.aiModelId}
            value={ai.answerValue}
            color={theme.colors.success}
            subtitle={model ? formatModelSubtitle(model) : undefined}
          />
        );
      })}

      <ProbabilityTrack
        label={`Ground truth (${truthLabel(round.truthValue)})`}
        value={truthDisplay}
        color={theme.colors.danger}
        highlight
      />

      <Text style={styles.aiTitle}>Model forecasts</Text>
      {round.aiAnswers.map((ai) => {
        const model = getSponsorModelById(ai.aiModelId);
        return (
          <View key={`row-${ai.aiModelId}`} style={styles.aiRow}>
            <View style={styles.aiInfo}>
              <Text style={styles.aiName}>{model?.name ?? ai.aiModelId}</Text>
              <Text style={styles.aiProvider}>
                {model ? formatModelSubtitle(model) : ai.aiModelId}
              </Text>
            </View>
            <Text style={[styles.aiValue, { color: cat.primary }]}>
              {Math.round(ai.answerValue)}%
            </Text>
          </View>
        );
      })}
    </>
  );
}

export function RoundBreakdown({ round, categoryId }: RoundBreakdownProps) {
  const [expanded, setExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const answer = round.playerAnswer;
  const cat = getCategoryTheme(categoryId);

  return (
    <CategoryThemeProvider categoryId={categoryId}>
      <View style={[styles.card, { borderLeftColor: cat.primary }]}>
        <View style={styles.header}>
          <Pressable onPress={() => setExpanded((v) => !v)} style={styles.headerMain}>
            <View style={styles.headerLeft}>
              <Text style={styles.roundTitle}>Round {round.roundNumber}</Text>
              {answer ? (
                <Text style={styles.roundMeta}>
                  {formatRbp(answer.roundScore)} RBP · {formatMs(answer.responseTimeMs)}
                </Text>
              ) : (
                <Text style={styles.roundMeta}>Not played</Text>
              )}
            </View>
            <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
          </Pressable>
          <View style={styles.headerRight}>
            {answer && (
              <View
                style={[
                  styles.pointsBadge,
                  {
                    backgroundColor:
                      answer.roundScore >= 0 ? theme.colors.accentMuted : theme.colors.dangerMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pointsBadgeText,
                    {
                      color: answer.roundScore >= 0 ? theme.colors.success : theme.colors.danger,
                    },
                  ]}
                >
                  {formatRbp(answer.roundScore)}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => setModalVisible(true)}
              hitSlop={8}
              style={[styles.popupBtn, { borderColor: cat.primaryMuted }]}
            >
              <Text style={[styles.popupBtnText, { color: cat.primary }]}>↗</Text>
            </Pressable>
          </View>
        </View>

        {expanded && (
          <View style={styles.body}>
            <RoundDetailContent round={round} categoryId={categoryId} />
          </View>
        )}

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          {modalVisible && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Round {round.roundNumber}</Text>
                  <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                    <Text style={[styles.modalClose, { color: cat.primary }]}>Done</Text>
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.modalScroll}>
                  <RoundDetailContent round={round} categoryId={categoryId} />
                </ScrollView>
              </View>
            </View>
          )}
        </Modal>
      </View>
    </CategoryThemeProvider>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    overflow: 'hidden',
    ...theme.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  roundTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  roundMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  pointsBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsBadgeText: {
    fontWeight: '800',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  popupBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  popupBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  chevron: {
    color: theme.colors.textMuted,
    fontSize: 12,
    width: 16,
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  benchmarkNote: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    lineHeight: 16,
  },
  image: {
    height: 160,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  scorePill: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  scorePillLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scorePillValue: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  aiTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  aiInfo: { flex: 1 },
  aiName: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  aiProvider: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  aiValue: {
    fontWeight: '800',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '92%',
    ...theme.shadow.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalClose: {
    fontWeight: '700',
    fontSize: 16,
  },
  modalScroll: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
});
