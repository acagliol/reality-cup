// Verifies player scoring formula with known test vectors.
// Run: node scripts/verify-scoring.mjs

const ACCURACY_WEIGHT = 0.7;
const SPEED_WEIGHT = 0.3;
const MAX_ROUND_SCORE = 100;
const ROUND_TIME_MS = 10_000;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scoreRound(answerValue, truthValue, responseTimeMs) {
  const answer = clamp(Math.round(answerValue), 0, MAX_ROUND_SCORE);
  const truth = clamp(Math.round(truthValue), 0, MAX_ROUND_SCORE);
  const responseMs = clamp(responseTimeMs, 0, ROUND_TIME_MS);

  const accuracyRaw = Math.max(0, MAX_ROUND_SCORE - Math.abs(answer - truth));
  const timeRemainingMs = ROUND_TIME_MS - responseMs;
  const speedRaw = (timeRemainingMs / ROUND_TIME_MS) * MAX_ROUND_SCORE;

  const roundScore = Math.round(accuracyRaw * ACCURACY_WEIGHT + speedRaw * SPEED_WEIGHT);
  const accuracyScore = Math.round(accuracyRaw);
  const speedScore = Math.round(speedRaw * 10) / 10;

  return { accuracyScore, speedScore, roundScore };
}

const cases = [
  {
    name: 'Perfect + instant',
    input: [50, 50, 0],
    expect: { accuracyScore: 100, speedScore: 100, roundScore: 100 },
  },
  {
    name: 'Perfect + 5s',
    input: [80, 80, 5000],
    expect: { accuracyScore: 100, speedScore: 50, roundScore: 85 },
  },
  {
    name: 'Off by 10 + instant',
    input: [40, 50, 0],
    expect: { accuracyScore: 90, speedScore: 100, roundScore: 93 },
  },
  {
    name: 'Off by 50 + timeout',
    input: [0, 50, 10000],
    expect: { accuracyScore: 50, speedScore: 0, roundScore: 35 },
  },
  {
    name: 'Clamps late response',
    input: [50, 50, 15000],
    expect: { accuracyScore: 100, speedScore: 0, roundScore: 70 },
  },
  {
    name: 'Max game total path',
    input: [100, 100, 0],
    expect: { accuracyScore: 100, speedScore: 100, roundScore: 100 },
  },
];

let failed = 0;
for (const test of cases) {
  const result = scoreRound(...test.input);
  const ok =
    result.accuracyScore === test.expect.accuracyScore &&
    result.speedScore === test.expect.speedScore &&
    result.roundScore === test.expect.roundScore;

  if (ok) {
    console.log(`✔ ${test.name}`);
  } else {
    failed++;
    console.log(`✗ ${test.name}`);
    console.log('  expected', test.expect);
    console.log('  got     ', result);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('\nAll scoring vectors passed. Max game score = 1000 (10 × 100).');
