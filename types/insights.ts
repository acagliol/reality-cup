export interface InsightPhoto {
  roundContentId: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  truthValue: number;
  crowdMean?: number;
  crowdCount?: number;
  aiMean?: number;
  aiSpread?: number;
  score: number;
  statLabel: string;
  statValue: string;
}

export interface ModelInsight {
  modelId: string;
  modelName: string;
  sponsor?: string;
  avgError: number;
  answerCount: number;
}

export interface CategoryInsight {
  categoryId: string;
  categoryName: string;
  icon: string;
  imageCount: number;
  avgAiError: number;
  avgCrowdError?: number;
  forecastCount: number;
}

export interface PlatformInsights {
  totalImages: number;
  totalCrowdForecasts: number;
  totalGames: number;
  totalAnalysts: number;
  crowdActive: boolean;
  aiModelStats: ModelInsight[];
  categoryStats: CategoryInsight[];
  mostControversial: InsightPhoto[];
  mostAgreed: InsightPhoto[];
  hardestFakes: InsightPhoto[];
  easiestFakes: InsightPhoto[];
}
