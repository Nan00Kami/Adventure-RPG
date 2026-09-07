import { MOVES_DB } from './Moves.js';

const classes = ["Sword", "Lance", "Gauntlet", "Talisman", "Staff"];
const tiers = [
  { rarity: "Common", count: 80, hp: [15, 30], atk: [6, 12], mv: [1.05, 1.25], moves: {
    Sword: ["Slash", "Blade Dance"], Lance: ["Javelin Thrust", "Phalanx Guard"],
    Gauntlet: ["Jab", "Dempsey Cross"], Talisman: ["Inner Pulse", "Lotus Burst"], Staff: ["Ember Spark", "Fireball"]
  }},
  { rarity: "Rare", count: 80, hp: [35, 65], atk: [14, 25], mv: [1.25, 1.45], moves: {
    Sword: ["Slash", "Cross Cut"], Lance: ["Javelin Thrust", "Spiral Pierce"],
    Gauntlet: ["Jab", "Mountain Breaker"], Talisman: ["Inner Pulse", "Meridian Strike"], Staff: ["Ember Spark", "Abyssal Surge"]
  }},
  { rarity: "Epic", count: 50, hp: [70, 110], atk: [28, 45], mv: [1.45, 1.70], moves: {
    Sword: ["Blade Dance", "Cross Cut"], Lance: ["Phalanx Guard", "Spiral Pierce"],
    Gauntlet: ["Dempsey Cross", "Mountain Breaker"], Talisman: ["Lotus Burst", "Meridian Strike"], Staff: ["Fireball", "Abyssal Surge"]
  }},
  { rarity: "Legendary", count: 40, hp: [120, 180], atk: [50, 80], mv: [1.70, 2.10], moves: {
    Sword: ["Blade Dance", "Void Sever"], Lance: ["Spiral Pierce", "Gungnir Drop"],
    Gauntlet: ["Mountain Breaker", "God Hand"], Talisman: ["Meridian Strike", "Nirvana Cataclysm"], Staff: ["Abyssal Surge", "Armageddon"]
  }}
];

const prefixes = {
  Sword: ["Folded", "Tempered", "Vindicator's", "Astral", "Void-Etched", "Celestine", "Dragon-Tooth"],
  Lance: ["Wooden", "Halberd-Pattern", "Gilded", "Sky-Piercer", "Sun-Spire", "Wyrm-Spur"],
  Gauntlet: ["Padded", "Crag-Iron", "Iron-Tiger", "Asura", "Colossus", "Titan", "Cataclysm"],
  Talisman: ["Parchment", "Jade-Carved", "Five-Phase", "Zenith", "Karma-Loop", "Nirvana"],
  Staff: ["Oak", "Ley-Channeled", "Eclipse", "Archmage", "Aether", "Chronos", "Genesis"]
};

export function buildCompleteArmory() {
  const armory = {};
  let globalId = 1;

  tiers.forEach(tier => {
    for (let i = 0; i < tier.count; i++) {
      const cls = classes[i % classes.length];
      const pfx = prefixes[cls][i % prefixes[cls].length];
      const name = `${pfx} ${cls} #${Math.floor(i / classes.length) + 1}`;
      const hp = Math.floor(tier.hp[0] + Math.random() * (tier.hp[1] - tier.hp[0]));
      const atk = Math.floor(tier.atk[0] + Math.random() * (tier.atk[1] - tier.atk[0]));
      const mv = parseFloat((tier.mv[0] + Math.random() * (tier.mv[1] - tier.mv[0])).toFixed(2));

      armory[name] = {
        id: globalId++,
        name,
        type: cls,
        rarity: tier.rarity,
        hp,
        atk,
        mv,
        moves: tier.moves[cls]
      };
    }
  });
  return armory;
}

export const ALL_WEAPONS = buildCompleteArmory();
