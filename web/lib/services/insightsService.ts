import { SPONSOR_AI_MODELS } from '@/lib/ai/sponsorModels';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  CategoryInsight,
  InsightPhoto,
  ModelInsight,
  PlatformInsights,
} from '@/types/insights';

interface RoundRow {
  id: string;
  category_id: string;
  image_url: string;
  truth_value: number;
  categories: { name: string; icon: string } | null;
}

interface AiRow {
  round_content_id: string;
  ai_model_id: string;
  answer_value: number;
}

interface CrowdRow {
  round_content_id: string;
  mean_answer: number;
  answer_count: number;
}

function assertSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    );
  }
  return supabase;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function avgAbsError(answers: number[], truth: number): number {
  if (answers.length === 0) return 0;
  return answers.reduce((sum, v) => sum + Math.abs(v - truth), 0) / answers.length;
}

function buildPhoto(
  row: RoundRow,
  opts: {
    score: number;
    statLabel: string;
    statValue: string;
    crowdMean?: number;
    crowdCount?: number;
    aiMean?: number;
    aiSpread?: number;
  },
): InsightPhoto {
  return {
    roundContentId: row.id,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? row.category_id,
    imageUrl: row.image_url,
    truthValue: row.truth_value,
    crowdMean: opts.crowdMean,
    crowdCount: opts.crowdCount,
    aiMean: opts.aiMean,
    aiSpread: opts.aiSpread,
    score: opts.score,
    statLabel: opts.statLabel,
    statValue: opts.statValue,
  };
}

export async function fetchPlatformInsights(): Promise<PlatformInsights> {
  const client = assertSupabase();

  const [
    { data: rounds, error: roundsError },
    { data: aiRows, error: aiError },
    { data: crowdRows, error: crowdError },
    { count: gamesCount },
    { count: profilesCount },
  ] = await Promise.all([
    client
      .from('round_content')
      .select('id, category_id, image_url, truth_value, categories(name, icon)')
      .eq('active', true),
    client.from('ai_answers').select('round_content_id, ai_model_id, answer_value'),
    client.from('crowd_stats').select('round_content_id, mean_answer, answer_count'),
    client.from('games').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    client.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  if (roundsError) throw new Error(`Failed to load images: ${roundsError.message}`);
  if (aiError) throw new Error(`Failed to load AI answers: ${aiError.message}`);
  if (crowdError) throw new Error(`Failed to load crowd stats: ${crowdError.message}`);

  const roundList = (rounds ?? []) as RoundRow[];
  const aiByRound = new Map<string, AiRow[]>();
  for (const row of (aiRows ?? []) as AiRow[]) {
    const list = aiByRound.get(row.round_content_id) ?? [];
    list.push(row);
    aiByRound.set(row.round_content_id, list);
  }

  const crowdByRound = new Map<string, CrowdRow>();
  for (const row of (crowdRows ?? []) as CrowdRow[]) {
    if (row.answer_count > 0) crowdByRound.set(row.round_content_id, row);
  }

  const totalCrowdForecasts = (crowdRows ?? []).reduce(
    (sum, row) => sum + Number((row as CrowdRow).answer_count ?? 0),
    0,
  );
  const crowdActive = totalCrowdForecasts > 0;

  const modelErrors = new Map<string, { total: number; count: number }>();
  for (const model of SPONSOR_AI_MODELS) {
    modelErrors.set(model.id, { total: 0, count: 0 });
  }

  const categoryAgg = new Map<
    string,
    {
      name: string;
      icon: string;
      images: number;
      aiErrorSum: number;
      aiErrorCount: number;
      crowdErrorSum: number;
      crowdErrorCount: number;
      forecasts: number;
    }
  >();

  const enriched = roundList.map((row) => {
    const ai = aiByRound.get(row.id) ?? [];
    const aiValues = ai.map((a) => a.answer_value);
    const aiMean =
      aiValues.length > 0
        ? aiValues.reduce((a, b) => a + b, 0) / aiValues.length
        : undefined;
    const aiSpread = aiValues.length > 1 ? stdDev(aiValues) : 0;

    for (const answer of ai) {
      const bucket = modelErrors.get(answer.ai_model_id);
      if (bucket) {
        bucket.total += Math.abs(answer.answer_value - row.truth_value);
        bucket.count += 1;
      }
    }

    const crowd = crowdByRound.get(row.id);
    const cat =
      categoryAgg.get(row.category_id) ??
      (() => {
        const entry = {
          name: row.categories?.name ?? row.category_id,
          icon: row.categories?.icon ?? '🎮',
          images: 0,
          aiErrorSum: 0,
          aiErrorCount: 0,
          crowdErrorSum: 0,
          crowdErrorCount: 0,
          forecasts: 0,
        };
        categoryAgg.set(row.category_id, entry);
        return entry;
      })();

    cat.images += 1;
    if (aiValues.length > 0) {
      cat.aiErrorSum += avgAbsError(aiValues, row.truth_value);
      cat.aiErrorCount += 1;
    }
    if (crowd) {
      cat.crowdErrorSum += Math.abs(Number(crowd.mean_answer) - row.truth_value);
      cat.crowdErrorCount += 1;
      cat.forecasts += crowd.answer_count;
    }

    return { row, aiMean, aiSpread, crowd };
  });

  const aiModelStats: ModelInsight[] = SPONSOR_AI_MODELS.map((model) => {
    const bucket = modelErrors.get(model.id)!;
    return {
      modelId: model.id,
      modelName: model.name,
      sponsor: model.sponsor,
      avgError: bucket.count > 0 ? bucket.total / bucket.count : 0,
      answerCount: bucket.count,
    };
  }).sort((a, b) => a.avgError - b.avgError);

  const categoryStats: CategoryInsight[] = [...categoryAgg.entries()]
    .map(([categoryId, cat]) => ({
      categoryId,
      categoryName: cat.name,
      icon: cat.icon,
      imageCount: cat.images,
      avgAiError: cat.aiErrorCount > 0 ? cat.aiErrorSum / cat.aiErrorCount : 0,
      avgCrowdError:
        cat.crowdErrorCount > 0 ? cat.crowdErrorSum / cat.crowdErrorCount : undefined,
      forecastCount: cat.forecasts,
    }))
    .sort((a, b) => b.forecastCount - a.forecastCount || a.categoryName.localeCompare(b.categoryName));

  const controversial: InsightPhoto[] = [];
  const agreed: InsightPhoto[] = [];
  const hardestFakes: InsightPhoto[] = [];
  const easiestFakes: InsightPhoto[] = [];

  for (const { row, aiMean, aiSpread, crowd } of enriched) {
    if (crowdActive && crowd) {
      const splitScore =
        crowd.answer_count * (1 - Math.abs(Number(crowd.mean_answer) - 50) / 50);
      controversial.push(
        buildPhoto(row, {
          score: splitScore,
          statLabel: 'Crowd split',
          statValue: `${Math.round(Number(crowd.mean_answer))}% fake · ${crowd.answer_count} forecasts`,
          crowdMean: Number(crowd.mean_answer),
          crowdCount: crowd.answer_count,
          aiMean,
          aiSpread,
        }),
      );

      const consensusScore =
        crowd.answer_count * (100 - Math.abs(Number(crowd.mean_answer) - row.truth_value));
      agreed.push(
        buildPhoto(row, {
          score: consensusScore,
          statLabel: 'Crowd vs truth',
          statValue: `${Math.round(Number(crowd.mean_answer))}% vs ${row.truth_value}% truth`,
          crowdMean: Number(crowd.mean_answer),
          crowdCount: crowd.answer_count,
          aiMean,
          aiSpread,
        }),
      );
    } else if (aiMean !== undefined) {
      controversial.push(
        buildPhoto(row, {
          score: aiSpread,
          statLabel: 'AI disagreement',
          statValue: `±${aiSpread.toFixed(1)} pts across models`,
          aiMean,
          aiSpread,
        }),
      );

      agreed.push(
        buildPhoto(row, {
          score: 100 - aiSpread,
          statLabel: 'AI consensus',
          statValue: `Avg ${Math.round(aiMean)}% fake`,
          aiMean,
          aiSpread,
        }),
      );
    }

    if (row.truth_value > 50 && aiMean !== undefined) {
      hardestFakes.push(
        buildPhoto(row, {
          score: 100 - aiMean,
          statLabel: 'AI fooled',
          statValue: `Models avg ${Math.round(aiMean)}% fake`,
          aiMean,
          aiSpread,
          crowdMean: crowd ? Number(crowd.mean_answer) : undefined,
          crowdCount: crowd?.answer_count,
        }),
      );
      easiestFakes.push(
        buildPhoto(row, {
          score: aiMean,
          statLabel: 'AI spotted',
          statValue: `Models avg ${Math.round(aiMean)}% fake`,
          aiMean,
          aiSpread,
          crowdMean: crowd ? Number(crowd.mean_answer) : undefined,
          crowdCount: crowd?.answer_count,
        }),
      );
    }
  }

  const sortDesc = (items: InsightPhoto[]) =>
    [...items].sort((a, b) => b.score - a.score).slice(0, 6);

  return {
    totalImages: roundList.length,
    totalCrowdForecasts,
    totalGames: gamesCount ?? 0,
    totalAnalysts: profilesCount ?? 0,
    crowdActive,
    aiModelStats,
    categoryStats,
    mostControversial: sortDesc(controversial),
    mostAgreed: sortDesc(agreed),
    hardestFakes: sortDesc(hardestFakes),
    easiestFakes: sortDesc(easiestFakes),
  };
}
