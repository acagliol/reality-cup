import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ComparisonSlider } from './ComparisonSlider';
import { getAiModelById } from '../lib/mock/data';
import { formatMs } from '../lib/scoring';
import { theme } from '../lib/theme';
import type { GameRound } from '../types/game';

interface RoundBreakdownProps {
  round: GameRound;
}

function RoundDetailContent({ round }: { round: GameRound }) {
  const answer = round.playerAnswer;
  const c = theme.colors;

  if (!answer) {
    return <Text style={{ color: c.textMuted }}>Not played yet</Text>;
  }

  return (
    <>
      <Image source={{ uri: round.imageUrl }} style={styles.image} contentFit="cover" />

      <View style={styles.scoreRow}>
        <View style={styles.scorePill}>
          <Text style={styles.scorePillLabel}>Accuracy</Text>
          <Text style={styles.scorePillValue}>{answer.accuracyScore ?? '—'}</Text>
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scorePillLabel}>Speed</Text>
          <Text style={styles.scorePillValue}>{answer.speedScore ?? '—'}</Text>
        </View>
        <View style={[styles.scorePill, styles.scorePillTotal]}>
          <Text style={styles.scorePillLabel}>Total</Text>
          <Text style={styles.scorePillValueTotal}>{answer.roundScore}</Text>
        </View>
      </View>

      <ComparisonSlider label="Your Answer" value={answer.answerValue} color={c.accentSoft} />
      <ComparisonSlider
        label="Crowd Answer"
        value={round.crowdMean}
        color={c.warning}
        subtitle="Aggregated from all players"
      />

      {round.aiAnswers.map((ai) => {
        const model = getAiModelById(ai.aiModelId);
        return (
          <ComparisonSlider
            key={ai.aiModelId}
            label={model?.name ?? ai.aiModelId}
            value={ai.answerValue}
            color={c.success}
            subtitle={model ? `${model.provider} · ${model.version}` : undefined}
          />
        );
      })}

      <ComparisonSlider label="Truth" value={round.truthValue} color={c.danger} />

      <Text style={styles.aiTitle}>AI Models Used</Text>
      {round.aiAnswers.map((ai) => {
        const model = getAiModelById(ai.aiModelId);
        return (
          <View key={`row-${ai.aiModelId}`} style={styles.aiRow}>
            <View style={styles.aiInfo}>
              <Text style={styles.aiName}>{model?.name ?? ai.aiModelId}</Text>
              <Text style={styles.aiProvider}>
                {model?.provider} · v{model?.version}
              </Text>
            </View>
            <Text style={styles.aiValue}>{Math.round(ai.answerValue)}</Text>
          </View>
        );
      })}
    </>
  );
}

export function RoundBreakdown({ round }: RoundBreakdownProps) {
  const [expanded, setExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const answer = round.playerAnswer;
  const c = theme.colors;

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roundTitle}>Round {round.roundNumber}</Text>
          {answer ? (
            <Text style={styles.roundMeta}>
              {answer.roundScore} pts · {formatMs(answer.responseTimeMs)}
            </Text>
          ) : (
            <Text style={styles.roundMeta}>Not played</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {answer && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsBadgeText}>{answer.roundScore}</Text>
            </View>
          )}
          <Pressable
            onPress={() => setModalVisible(true)}
            hitSlop={8}
            style={styles.popupBtn}
          >
            <Text style={styles.popupBtnText}>↗</Text>
          </Pressable>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <RoundDetailContent round={round} />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Round {round.roundNumber}</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                <Text style={styles.modalClose}>Done</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <RoundDetailContent round={round} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
    ...theme.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  headerLeft: { flex: 1 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  roundTitle: {
    color: c.text,
    fontWeight: '700',
    fontSize: 16,
  },
  roundMeta: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: c.accentMuted,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsBadgeText: {
    color: c.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  popupBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  popupBtnText: {
    color: c.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  chevron: {
    color: c.textMuted,
    fontSize: 12,
    width: 16,
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  image: {
    height: 160,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: c.surfaceAlt,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  scorePill: {
    flex: 1,
    backgroundColor: c.surfaceAlt,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  scorePillTotal: {
    backgroundColor: c.accentMuted,
  },
  scorePillLabel: {
    color: c.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scorePillValue: {
    color: c.text,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 2,
  },
  scorePillValueTotal: {
    color: c.accent,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 2,
  },
  aiTitle: {
    color: c.text,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  aiInfo: { flex: 1 },
  aiName: {
    color: c.text,
    fontWeight: '600',
    fontSize: 14,
  },
  aiProvider: {
    color: c.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  aiValue: {
    color: c.success,
    fontWeight: '800',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: c.surface,
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
    borderBottomColor: c.border,
  },
  modalTitle: {
    color: c.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalClose: {
    color: c.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  modalScroll: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
});
