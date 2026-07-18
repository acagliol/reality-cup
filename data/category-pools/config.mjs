/** Shared category pool config for build + seed scripts. */

export const PER_SIDE = 50;

export const TRUTH_REAL = 0;
export const TRUTH_FAKE = 100;

/** Shown on category cards and detail screens — gameplay only, not theme copy. */
export const HOW_TO_PLAY =
  '10 rounds, 10 seconds each. Slide to set the odds each image is AI-generated, then tap Confirm.';

export const RANDOM_HOW_TO_PLAY =
  '10 rounds pulled from every category. Slide your odds each image is AI-generated, then tap Confirm before time runs out.';

export const GAME_CATEGORIES = [
  {
    id: 'cat-world-cup',
    name: 'World Cup',
    description: HOW_TO_PLAY,
    icon: '⚽',
    sortOrder: 1,
    realQueries: [
      'FIFA World Cup match',
      'World Cup football fans stadium',
      'FIFA World Cup final trophy',
      'soccer World Cup goal celebration',
      'international football stadium crowd',
    ],
    fakePromptBase:
      'photorealistic FIFA World Cup soccer match, stadium crowd celebrating, sports photography',
  },
  {
    id: 'cat-lebron-decision',
    name: 'LeBron / The Decision',
    description: HOW_TO_PLAY,
    icon: '🏀',
    sortOrder: 2,
    realQueries: ['LeBron James basketball', 'NBA basketball game arena', 'basketball player dunk'],
    fakePromptBase:
      'photorealistic NBA basketball player interview press conference ESPN style arena lights',
  },
  {
    id: 'cat-brain-rot',
    name: 'Brain Rot',
    description: HOW_TO_PLAY,
    icon: '🧠',
    sortOrder: 3,
    realQueries: [
      'Doge meme Shiba Inu',
      'Grumpy Cat Tardar',
      'Success Kid meme',
      'Distracted boyfriend meme',
      'Pepe the Frog meme',
      'Keyboard Cat meme',
      'LOLcat caption',
      'Nyan Cat pop tart',
      'Wojak meme',
      'This is fine dog meme',
      'Expanding brain meme',
      'Surprised Pikachu meme',
    ],
    fakePromptBase:
      'surreal gen-z brain rot internet meme aesthetic, chaotic viral thumbnail, hyper-saturated AI art',
  },
  {
    id: 'cat-nyc-core',
    name: 'NYC Core',
    description: HOW_TO_PLAY,
    icon: '🗽',
    sortOrder: 4,
    realQueries: [
      'New York City skyline',
      'Times Square New York',
      'Brooklyn Bridge Manhattan',
      'Central Park New York',
      'Statue of Liberty New York',
      'Empire State Building',
      'Manhattan street photography',
      'New York City aerial view',
    ],
    fakePromptBase:
      'photorealistic New York City street, skyline, Times Square, Brooklyn Bridge, urban photography',
  },
  {
    id: 'cat-food',
    name: 'Food',
    description: HOW_TO_PLAY,
    icon: '🍕',
    sortOrder: 5,
    realQueries: ['gourmet food plate', 'restaurant dish photography', 'pizza burger sushi meal'],
    fakePromptBase:
      'hyper-realistic gourmet food photography, studio lighting, Michelin plate, AI generated food',
  },
];

/** Legacy categories replaced by the five above. */
export const LEGACY_CATEGORY_IDS = [
  'cat-nature',
  'cat-people',
  'cat-animals',
  'cat-architecture',
];

/** Virtual category — pulls fakes from all pool categories at play time. */
export const RANDOM_CATEGORY = {
  id: 'cat-random',
  name: 'Random Mix',
  description: RANDOM_HOW_TO_PLAY,
  icon: '🎲',
  sortOrder: 0,
};

export const POOL_CATEGORY_IDS = GAME_CATEGORIES.map((c) => c.id);
