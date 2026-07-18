// Verifies Brier / RBP scoring with known test vectors.
// Run: node scripts/verify-scoring.mjs

const BENCHMARK_CROWD_WEIGHT = 0.45;
const BENCHMARK_MODEL_WEIGHT = 0.55;
const RBP_HARDNESS_MARGIN = 0.015;
const RBP_SCALE = 100;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function truthToBinary(truthValue) {
  return truthValue >= 50 ? 1 : 0;
}

function answerToProbability(answerValue) {
  return clamp(Math.round(answerValue), 1, 99) / 100;
}

function brierScore(probabilityFake, y) {
  const p = clamp(probabilityFake, 0.01, 0.99);
  return (p - y) ** 2;
}

function scoreRound(answerValue, truthValue, crowdMean, aiAnswers) {
  const y = truthToBinary(truthValue);
  const userBrier = brierScore(answerToProbability(answerValue), y);
  const crowdBrier = brierScore(answerToProbability(crowdMean), y);
  const modelBrier =
    aiAnswers.reduce((sum, ai) => sum + brierScore(answerToProbability(ai.answerValue), y), 0) /
    aiAnswers.length;
  const benchmarkBrier = BENCHMARK_CROWD_WEIGHT * crowdBrier + BENCHMARK_MODEL_WEIGHT * modelBrier;
  const roundScore =
    Math.round((benchmarkBrier - userBrier - RBP_HARDNESS_MARGIN) * RBP_SCALE * 10) / 10;

  return { userBrier, crowdBrier, modelBrier, benchmarkBrier, roundScore };
}

const models = [{ answerValue: 85 }, { answerValue: 80 }, { answerValue: 75 }];

const cases = [
  {
    name: 'Fake image — excellent forecast beats benchmark',
    input: [90, 100, 70, models],
    expectPositive: true,
  },
  {
    name: 'Real image — excellent low forecast beats benchmark',
    input: [10, 0, 60, models],
    expectPositive: true,
  },
  {
    name: 'Wrong side — heavily negative',
    input: [90, 0, 50, models],
    expectPositive: false,
    expectBelow: -30,
  },
  {
    name: '51% on fake — weak, usually negative vs benchmark',
    input: [51, 100, 55, models],
    expectPositive: false,
  },
  {
    name: 'Matches crowd on fake — near zero or negative after margin',
    input: [70, 100, 70, models],
    expectBelow: 5,
  },
];

let failed = 0;
for (const test of cases) {
  const result = scoreRound(...test.input);
  let ok = true;

  if (test.expectPositive === true && result.roundScore <= 0) ok = false;
  if (test.expectPositive === false && result.roundScore > 0) ok = false;
  if (test.expectBelow !== undefined && result.roundScore >= test.expectBelow) ok = false;

  if (ok) {
    console.log(`✔ ${test.name} → RBP ${result.roundScore}`);
  } else {
    failed++;
    console.log(`✗ ${test.name}`);
    console.log('  got', result);
  }
}

// Simulate ~50% positive among random-ish forecasts
const sim = [];
for (let i = 0; i < 200; i++) {
  const answer = 1 + (i * 17) % 99;
  const truth = i % 2 === 0 ? 100 : 0;
  const crowd = 30 + (i * 13) % 40;
  const r = scoreRound(answer, truth, crowd, models);
  sim.push(r.roundScore);
}
const positiveRate = sim.filter((s) => s > 0).length / sim.length;
console.log(`\nSimulated positive rate: ${(positiveRate * 100).toFixed(0)}% (target ~50%)`);

if (positiveRate < 0.35 || positiveRate > 0.65) {
  console.log('⚠ Positive rate outside 35–65% band — tune RBP_HARDNESS_MARGIN');
}

if (failed > 0) {
  process.exit(1);
}

console.log('\nAll scoring vectors passed.');
