'use client';

import { RoundBreakdown } from '@/components/RoundBreakdown';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { formatRbp } from '@/lib/scoring';
import styles from './GameHistoryDetailScreen.module.css';

interface GameHistoryDetailScreenProps {
  gameId: string;
}

export function GameHistoryDetailScreen({ gameId }: GameHistoryDetailScreenProps) {
  const { gameHistory, goBack } = useApp();
  const game = gameHistory.find((g) => g.id === gameId);

  if (!game) {
    return (
      <div className={styles.container}>
        <ScreenHeader title="History" onBack={goBack} />
        <p className={styles.missing}>Game not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ScreenHeader
        title={game.categoryName}
        subtitle={`${formatRbp(game.totalScore)} pts · ${game.status === 'completed' ? 'Completed' : 'In progress'}`}
        onBack={goBack}
      />

      <div className={styles.scroll}>
        {game.rounds.map((round) => (
          <RoundBreakdown
            key={round.roundContentId}
            round={round}
            categoryId={game.categoryId}
          />
        ))}
      </div>
    </div>
  );
}
