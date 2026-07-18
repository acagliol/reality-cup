import type {
  Category,
  CrowdStats,
  LeaderboardEntry,
  RoundContent,
} from '../../types/game';
import { SPONSOR_AI_MODELS, getSponsorModelById } from '../ai/sponsorModels';

export const MOCK_AI_MODELS = SPONSOR_AI_MODELS;

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-nature',
    name: 'Nature & Landscapes',
    description:
      'Can you tell if these scenic photos are real camera shots or AI-generated fantasy?',
    icon: '🌄',
    sortOrder: 1,
  },
  {
    id: 'cat-people',
    name: 'People & Portraits',
    description:
      'Study faces and expressions. AI portraits often hide subtle tells in skin and eyes.',
    icon: '👤',
    sortOrder: 2,
  },
  {
    id: 'cat-animals',
    name: 'Animals & Wildlife',
    description:
      'Fur, feathers, and motion blur — wildlife images push generative models to their limits.',
    icon: '🦁',
    sortOrder: 3,
  },
  {
    id: 'cat-architecture',
    name: 'Architecture',
    description:
      'Buildings with impossible geometry or perfect symmetry might not exist in the real world.',
    icon: '🏛️',
    sortOrder: 4,
  },
  {
    id: 'cat-food',
    name: 'Food Photography',
    description:
      'Hyper-real food shots are a classic AI benchmark. Watch for texture and lighting.',
    icon: '🍕',
    sortOrder: 5,
  },
];

const IMAGE_POOL = [
  'https://picsum.photos/seed/real1/800/600',
  'https://picsum.photos/seed/real2/800/600',
  'https://picsum.photos/seed/real3/800/600',
  'https://picsum.photos/seed/fake1/800/600',
  'https://picsum.photos/seed/fake2/800/600',
  'https://picsum.photos/seed/fake3/800/600',
  'https://picsum.photos/seed/mix1/800/600',
  'https://picsum.photos/seed/mix2/800/600',
  'https://picsum.photos/seed/mix3/800/600',
  'https://picsum.photos/seed/mix4/800/600',
  'https://picsum.photos/seed/mix5/800/600',
  'https://picsum.photos/seed/mix6/800/600',
];

function seededValue(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return Math.round(min + normalized * (max - min));
}

function buildRoundContent(): RoundContent[] {
  const rounds: RoundContent[] = [];
  for (const category of MOCK_CATEGORIES) {
    for (let i = 0; i < 12; i++) {
      const id = `${category.id}-round-${i + 1}`;
      rounds.push({
        id,
        categoryId: category.id,
        imageUrl: IMAGE_POOL[(i + category.sortOrder) % IMAGE_POOL.length],
        truthValue: seededValue(id, 5, 95),
        sortOrder: i + 1,
      });
    }
  }
  return rounds;
}

export const MOCK_ROUND_CONTENT: RoundContent[] = buildRoundContent();

export const MOCK_CROWD_STATS: CrowdStats[] = MOCK_ROUND_CONTENT.map((round) => ({
  roundContentId: round.id,
  meanAnswer: seededValue(`${round.id}-crowd`, 20, 80),
  answerCount: seededValue(`${round.id}-count`, 120, 2400),
}));

export function getAiAnswersForRound(roundContentId: string) {
  return MOCK_AI_MODELS.map((model) => ({
    aiModelId: model.id,
    answerValue: seededValue(`${roundContentId}-${model.id}`, 8, 92),
  }));
}

export function getAiModelById(id: string) {
  return getSponsorModelById(id);
}

export function getCategoryById(id: string): Category | undefined {
  return MOCK_CATEGORIES.find((c) => c.id === id);
}

export function getRoundsForCategory(categoryId: string, count = 10): RoundContent[] {
  return MOCK_ROUND_CONTENT.filter((r) => r.categoryId === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, count);
}

export function getCrowdMean(roundContentId: string): number {
  return (
    MOCK_CROWD_STATS.find((s) => s.roundContentId === roundContentId)?.meanAnswer ?? 50
  );
}

export function buildMockLeaderboard(
  playerName: string,
  playerScore: number,
  categoryId: string,
): LeaderboardEntry[] {
  const botNames = [
    'PixelPro',
    'TruthSeeker',
    'DeepFakeHunter',
    'Visionary',
    'RealOrNot',
    'SynthSpotter',
    'ImageDetective',
    'AIEye',
    'CrowdWisdom',
    'NeuralNet',
    'PhotoForensics',
    'LensLogic',
    'SignalBoost',
    'DeepSight',
    'ProbBot',
    'Calibrated',
    'SharpEye',
    'MetaFilter',
    'SynthScan',
    'GroundTruth',
  ];

  const scores = botNames.map((name) => ({
    playerName: name,
    score: seededValue(`${categoryId}-${name}`, 520, 990),
    isCurrentPlayer: false,
  }));

  scores.push({
    playerName,
    score: playerScore > 0 ? playerScore : seededValue(`${categoryId}-${playerName}`, 180, 480),
    isCurrentPlayer: true,
  });

  scores.sort((a, b) => b.score - a.score);

  return scores.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}
