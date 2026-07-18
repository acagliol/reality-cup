const SCORING_PROMPT = `You are an expert at detecting AI-generated images.

Look at the image and estimate the probability (0–100) that it is AI-generated or synthetic rather than a real photograph.

Respond with ONLY valid JSON in this exact shape:
{"probability_fake": <integer from 0 to 100>}

Where:
- 0 = certainly a real photograph
- 100 = certainly AI-generated
- 50 = completely uncertain`;

export function buildVisionMessages(imageUrl) {
  return [
    {
      role: 'user',
      content: [
        { type: 'text', text: SCORING_PROMPT },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];
}

export function parseProbabilityFake(text) {
  const trimmed = text.trim();

  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.probability_fake === 'number') {
        return clampInt(parsed.probability_fake);
      }
    }
  } catch {
    // fall through
  }

  const numberMatch = trimmed.match(/\b(\d{1,3})\b/);
  if (numberMatch) return clampInt(Number(numberMatch[1]));

  throw new Error(`Could not parse model output: ${trimmed.slice(0, 200)}`);
}

function clampInt(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function extractMessageContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.text ?? ''))
      .join('')
      .trim();
  }
  if (content && typeof content === 'object' && typeof content.text === 'string') {
    return content.text;
  }
  return '';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scoreImageWithOpenRouterOnce({ apiKey, openrouterModel, imageUrl, referer }) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer ?? 'https://ramphackathon.local',
      'X-Title': 'Real or Fake - Builders Cup',
    },
    body: JSON.stringify({
      model: openrouterModel,
      temperature: 0.1,
      max_tokens: 128,
      messages: buildVisionMessages(imageUrl),
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error?.message ?? `OpenRouter HTTP ${response.status}`);
  }

  const content = extractMessageContent(body.choices?.[0]?.message?.content);
  if (!content) throw new Error('OpenRouter returned empty content');

  return parseProbabilityFake(content);
}

export async function scoreImageWithOpenRouter({
  apiKey,
  openrouterModel,
  imageUrl,
  referer,
  maxAttempts = 3,
}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await scoreImageWithOpenRouterOnce({ apiKey, openrouterModel, imageUrl, referer });
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(1000 * attempt);
      }
    }
  }

  throw lastError;
}
