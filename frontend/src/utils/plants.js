export const RARITIES = {
  common:    { label: 'Common',    color: '#4ADE80', border: 'rgba(74,222,128,0.55)',  glow: 'rgba(74,222,128,0.18)'  },
  rare:      { label: 'Rare',      color: '#60A5FA', border: 'rgba(96,165,250,0.6)',   glow: 'rgba(96,165,250,0.22)'  },
  epic:      { label: 'Epic',      color: '#A855F7', border: 'rgba(168,85,247,0.65)',  glow: 'rgba(168,85,247,0.28)'  },
  legendary: { label: 'Legendary', color: '#F59E0B', border: 'rgba(245,158,11,0.7)',   glow: 'rgba(245,158,11,0.28)'  },
  mythic:    { label: 'Mythic',    color: null,      border: null,                      glow: 'rgba(167,139,250,0.25)' },
};

// odds < 1 = requires a lucky roll to get that rarity (otherwise drops one tier)
export const PLANTS = [
  { id: 'flower',    name: 'Wildflower',    emoji: '🌸', rarity: 'common',    odds: 1.00 },
  { id: 'sunflower', name: 'Sunflower',     emoji: '🌻', rarity: 'rare',      odds: 1.00 },
  { id: 'bamboo',    name: 'Lucky Bamboo',  emoji: '🎋', rarity: 'rare',      odds: 1.00 },
  { id: 'cactus',    name: 'Desert Cactus', emoji: '🌵', rarity: 'epic',      odds: 1.00 },
  { id: 'tree',      name: 'Bonsai Tree',   emoji: '🪴', rarity: 'epic',      odds: 1.00 },
  { id: 'crystal',   name: 'Crystal Rose',  emoji: '💎', rarity: 'legendary', odds: 0.20 },
  { id: 'cosmic',    name: 'Cosmic Bloom',  emoji: '✨', rarity: 'mythic',    odds: 0.05 },
];

export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];

export function getPlant(id) {
  return PLANTS.find((p) => p.id === id) ?? PLANTS[0];
}

export function getRarity(key) {
  return RARITIES[key] ?? RARITIES.common;
}

// Returns { granted: bool, actualRarity: string }
export function rollPlant(plant) {
  if (plant.odds >= 1) return { granted: true, actualRarity: plant.rarity };
  if (Math.random() < plant.odds) return { granted: true, actualRarity: plant.rarity };
  // drop one tier
  const idx = RARITY_ORDER.indexOf(plant.rarity);
  const fallback = RARITY_ORDER[Math.max(0, idx - 1)];
  return { granted: false, actualRarity: fallback };
}
