/** Hotlinkable Pexels CDN URLs (free license: https://www.pexels.com/license/) */

export function pexelsUrl(id) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;
}

function pexelsEntries(ids) {
  return [...new Set(ids)].map((id) => ({
    url: pexelsUrl(id),
    source: 'pexels',
    query: `pexels:${id}`,
  }));
}

/** General NYC — skyline, streets, landmarks, bridges, parks. */
const NYC_PEXELS_IDS = [
  2190283, 2190293, 466685, 37151835, 29029042, 33878664, 31727410, 20851474, 36790767,
  64271, 290757, 466677, 1021067, 312779, 1381463, 161963, 769014, 761856, 235986,
  3637822, 3031139, 136725, 697059, 374631, 2806905, 3275719, 433308, 1784578, 5144,
  169647, 1890462, 584905, 290887, 3251851, 3568444, 507706, 248021, 2253822, 3763623,
  2422615, 631786, 149036, 2909342, 632368, 257003, 2807001, 274744, 1770310, 2343468,
  290386, 753331, 1761030, 1963082, 2372715, 912364, 1780584, 268434, 290386,
];

/** World Cup / international football — stadiums, crowds, matches. */
const WORLD_CUP_PEXELS_IDS = [
  15926254, 31228537, 47730, 2745063, 186129, 399187, 274462, 1884574, 2570139, 3627522,
  3627963, 2689923, 399332, 362103, 46798, 296086, 1618264, 573786, 248548, 268083,
  209956, 1436069, 362110, 2747444, 399187, 1884574, 3627522, 46798, 296086, 573786,
  248548, 268083, 209956, 1436069, 47730, 186129, 274462, 1618264, 399332, 362103,
  15926254, 31228537, 2745063, 3627963, 2689923, 362110, 2570139, 2747444, 399187,
  1884574,
];

export const CURATED_REAL = {
  'cat-nyc-core': pexelsEntries(NYC_PEXELS_IDS),
  'cat-world-cup': pexelsEntries(WORLD_CUP_PEXELS_IDS),
  'cat-brain-rot': [],
};
