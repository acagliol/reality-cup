'use client';

import { useState } from 'react';
import { ProbabilityTrack } from '@/components/ProbabilityTrack';
import { CategoryThemeProvider } from '@/context/CategoryThemeContext';
import { getSponsorModelById, formatModelSubtitle } from '@/lib/ai/sponsorModels';
import {
  displayTruthValue,
  formatBrier,
  formatMs,
  formatRbp,
  truthLabel,
} from '@/lib/scoring';
import { getCategoryTheme } from '@/lib/theme';
import type { GameRound } from '@/types/game';
import styles from './RoundBreakdown.module.css';

interface RoundBreakdownProps {
  round: GameRound;
  categoryId: string;
}

function RoundDetailContent({ round, categoryId }: { round: GameRound; categoryId: string }) {
  const cat = getCategoryTheme(categoryId);
  const answer = round.playerAnswer;
  const truthDisplay = displayTruthValue(round.truthValue);

  if (!answer) {
    return <p className={styles.notPlayed}>Not played yet</p>;
  }

  return (
    <>
      <div className={styles.imageWrap}>
        <img src={round.imageUrl} alt="" className={styles.image} />
      </div>

      <div className={styles.scoreRow}>
        <div className={styles.scorePill} style={{ backgroundColor: cat.primaryMuted }}>
          <span className={styles.scorePillLabel}>RBP</span>
          <span
            className={`${styles.scorePillValue} mono`}
            style={{ color: answer.roundScore >= 0 ? '#16a34a' : '#dc2626' }}
          >
            {formatRbp(answer.roundScore)}
          </span>
        </div>
        <div className={styles.scorePill}>
          <span className={styles.scorePillLabel}>Your Brier</span>
          <span className={`${styles.scorePillValue} mono`}>{formatBrier(answer.userBrier)}</span>
        </div>
        <div
          className={styles.scorePill}
          style={{ borderColor: cat.primary, borderWidth: 1 }}
        >
          <span className={styles.scorePillLabel}>Benchmark</span>
          <span className={`${styles.scorePillValue} mono`} style={{ color: cat.primary }}>
            {formatBrier(answer.benchmarkBrier)}
          </span>
        </div>
      </div>

      <p className={styles.benchmarkNote}>
        Benchmark = 45% crowd + 55% AI models · Truth: {truthLabel(round.truthValue)} ({truthDisplay})
      </p>

      <ProbabilityTrack label="Your forecast" value={answer.answerValue} highlight />
      <ProbabilityTrack
        label="Crowd consensus"
        value={round.crowdMean}
        color="#d97706"
        subtitle="Aggregated player forecasts"
      />

      {round.aiAnswers.map((ai) => {
        const model = getSponsorModelById(ai.aiModelId);
        return (
          <ProbabilityTrack
            key={ai.aiModelId}
            label={model?.name ?? ai.aiModelId}
            value={ai.answerValue}
            color="#16a34a"
            subtitle={model ? formatModelSubtitle(model) : undefined}
          />
        );
      })}

      <ProbabilityTrack
        label={`Ground truth (${truthLabel(round.truthValue)})`}
        value={truthDisplay}
        color="#dc2626"
        highlight
      />

      <p className={styles.aiTitle}>Model forecasts</p>
      {round.aiAnswers.map((ai) => {
        const model = getSponsorModelById(ai.aiModelId);
        return (
          <div key={`row-${ai.aiModelId}`} className={styles.aiRow}>
            <div className={styles.aiInfo}>
              <span className={styles.aiName}>{model?.name ?? ai.aiModelId}</span>
              <span className={styles.aiProvider}>
                {model ? formatModelSubtitle(model) : ai.aiModelId}
              </span>
            </div>
            <span className={`${styles.aiValue} mono`} style={{ color: cat.primary }}>
              {Math.round(ai.answerValue)}%
            </span>
          </div>
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
      <div className={styles.card} style={{ borderLeftColor: cat.primary }}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.headerMain}
            onClick={() => setExpanded((v) => !v)}
          >
            <div className={styles.headerLeft}>
              <span className={styles.roundTitle}>Round {round.roundNumber}</span>
              {answer ? (
                <span className={`${styles.roundMeta} mono`}>
                  {formatRbp(answer.roundScore)} RBP · {formatMs(answer.responseTimeMs)}
                </span>
              ) : (
                <span className={styles.roundMeta}>Not played</span>
              )}
            </div>
            <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
          </button>
          <div className={styles.headerRight}>
            {answer && (
              <div
                className={styles.pointsBadge}
                style={{
                  backgroundColor:
                    answer.roundScore >= 0 ? '#f7ffde' : '#fee2e2',
                }}
              >
                <span
                  className={`${styles.pointsBadgeText} mono`}
                  style={{
                    color: answer.roundScore >= 0 ? '#16a34a' : '#dc2626',
                  }}
                >
                  {formatRbp(answer.roundScore)}
                </span>
              </div>
            )}
            <button
              type="button"
              className={styles.popupBtn}
              style={{ borderColor: cat.primaryMuted }}
              onClick={() => setModalVisible(true)}
            >
              <span className={styles.popupBtnText} style={{ color: cat.primary }}>
                ↗
              </span>
            </button>
          </div>
        </div>

        {expanded && (
          <div className={styles.body}>
            <RoundDetailContent round={round} categoryId={categoryId} />
          </div>
        )}

        {modalVisible && (
          <div className={styles.modalOverlay} onClick={() => setModalVisible(false)}>
            <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <span className={styles.modalTitle}>Round {round.roundNumber}</span>
                <button type="button" onClick={() => setModalVisible(false)}>
                  <span className={styles.modalClose} style={{ color: cat.primary }}>
                    Done
                  </span>
                </button>
              </div>
              <div className={styles.modalScroll}>
                <RoundDetailContent round={round} categoryId={categoryId} />
              </div>
            </div>
          </div>
        )}
      </div>
    </CategoryThemeProvider>
  );
}
