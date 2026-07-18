const BLOCKED_WORDS = [
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'cock',
  'crap',
  'damn',
  'dick',
  'fuck',
  'fucker',
  'fucking',
  'hell',
  'piss',
  'shit',
  'slut',
  'whore',
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function containsProfanity(name: string): boolean {
  const normalized = normalize(name);
  if (!normalized) return false;
  return BLOCKED_WORDS.some(
    (word) => normalized === word || normalized.includes(word),
  );
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 20) return 'Name must be 20 characters or fewer.';
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed))
    return 'Use only letters, numbers, spaces, hyphens, and underscores.';
  if (containsProfanity(trimmed)) return 'Please choose a different name.';
  return null;
}
