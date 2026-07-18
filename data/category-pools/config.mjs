/** Shared category pool config for build + seed scripts. */

export const PER_SIDE = 50;

export const TRUTH_REAL = 5;
export const TRUTH_FAKE = 95;

export const GAME_CATEGORIES = [
  {
    id: 'cat-world-cup',
    name: 'World Cup',
    description:
      'Global football fever — real match photos vs AI-generated tournament scenes.',
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
    description:
      'NBA icon energy and ESPN press-conference vibes — spot the synthetic hoop dreams.',
    icon: '🏀',
    sortOrder: 2,
    realQueries: ['LeBron James basketball', 'NBA basketball game arena', 'basketball player dunk'],
    fakePromptBase:
      'photorealistic NBA basketball player interview press conference ESPN style arena lights',
  },
  {
    id: 'cat-brain-rot',
    name: 'Brain Rot',
    description:
      'Chronically online aesthetics — meme-tier visuals vs uncanny AI slop.',
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
    description:
      'Skyline, streets, landmarks, and city life — authentic NYC or AI cosplay?',
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
    description:
      'Plated perfection and greasy glory — can you taste the difference in the pixels?',
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
