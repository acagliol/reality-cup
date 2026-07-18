import { writeFileSync } from 'node:fs';
import { buildMockRoundContent, SPONSOR_AI_MODELS, mockAiAnswer } from './lib/sponsorModels.mjs';

const rounds = buildMockRoundContent();

const roundValues = rounds
  .map(
    (r) =>
      `('${r.id}', '${r.category_id}', '${r.image_url}', ${r.truth_value}, ${r.sort_order}, true)`,
  )
  .join(',\n  ');

const roundSql = `insert into public.round_content (id, category_id, image_url, truth_value, sort_order, active) values
  ${roundValues}
on conflict (id) do update set
  category_id = excluded.category_id,
  image_url = excluded.image_url,
  truth_value = excluded.truth_value,
  sort_order = excluded.sort_order,
  active = excluded.active;`;

const answers = [];
for (const r of rounds) {
  for (const m of SPONSOR_AI_MODELS) {
    answers.push(
      `('${r.id}', '${m.id}', ${mockAiAnswer(r.id, m.id)})`,
    );
  }
}

const answerSql = `insert into public.ai_answers (round_content_id, ai_model_id, answer_value) values
  ${answers.join(',\n  ')}
on conflict (round_content_id, ai_model_id) do update set
  answer_value = excluded.answer_value;`;

writeFileSync('scripts/generated-seed-round-content.sql', roundSql);
writeFileSync('scripts/generated-seed-ai-answers.sql', answerSql);
console.log(`Generated ${rounds.length} rounds, ${answers.length} ai answers`);
