// Verifies accuracy + speed scoring.
// Run: node scripts/verify-scoring.mjs

const ACCURACY_WEIGHT = 0.7;
const SPEED_WEIGHT = 0.3;
const ROUND_TIME_MS = 10_000;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scoreRound(answerValue, truthValue, responseTimeMs) {
  const answer = clamp(Math.round(answerValue), 0, 100);
  const truth = clamp(Math.round(truthValue), 0, 100);

  const accuracyScore = Math.max(0, 100 - Math.abs(answer - truth));
  const elapsed = clamp(responseTimeMs, 0, ROUND_TIME_MS);
  const speedScore = Math.round(((ROUND_TIME_MS - elapsed) / ROUND_TIME_MS) * 100);

  const roundScore = Math.round(
    ACCURACY_WEIGHT * accuracyScore + SPEED_WEIGHT * speedScore,
  );

  return { accuracyScore, speedScore, roundScore };
}

const cases = [
  {
    name: 'Perfect fake guess, instant answer',
    input: [100, 100, 0],
    expectRound: 100,
  },
  {
    name: 'Perfect real guess, instant answer',
    input: [0, 0, 0],
    expectRound: 100,
  },
  {
    name: 'Wrong side, slow answer',
    input: [100, 0, ROUND_TIME_MS],
    expectRound: 0,
  },
  {
    name: 'Close guess, half time left',
    input: [90, 100, ROUND_TIME_MS / 2],
    expectRound: Math.round(0.7 * 90 + 0.3 * 50),
  },
];

let failed = 0;
for (const test of cases) {
  const result = scoreRound(...test.input);
  const ok = result.roundScore === test.expectRound;

  if (ok) {
    console.log(`✔ ${test.name} → ${result.roundScore} (acc ${result.accuracyScore}, spd ${result.speedScore})`);
  } else {
    failed++;
    console.log(`✗ ${test.name}`);
    console.log('  expected', test.expectRound, 'got', result);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('\nAll scoring vectors passed.');
