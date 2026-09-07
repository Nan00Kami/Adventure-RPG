export const MOVES_DB = {
  // Swords (Cost: Stamina)
  "Slash": { name: "Slash", class: "Sword", power: 18, cost: "Stamina", maxStock: 20, buff: 1.0 },
  "Pommel Strike": { name: "Pommel Strike", class: "Sword", power: 12, cost: "Stamina", maxStock: 25, buff: 1.0 },
  "Blade Dance": { name: "Blade Dance", class: "Sword", power: 25, cost: "Stamina", maxStock: 12, buff: 1.25 }, // Universal ATK buff
  "Void Sever": { name: "Void Sever", class: "Sword", power: 55, cost: "Stamina", maxStock: 5, buff: 1.0 },

  // Lances (Cost: Stamina)
  "Javelin Thrust": { name: "Javelin Thrust", class: "Lance", power: 20, cost: "Stamina", maxStock: 18, buff: 1.0 },
  "Phalanx Guard": { name: "Phalanx Guard", class: "Lance", power: 14, cost: "Stamina", maxStock: 22, buff: 1.15 },
  "Gungnir Drop": { name: "Gungnir Drop", class: "Lance", power: 48, cost: "Stamina", maxStock: 6, buff: 1.0 },

  // Gauntlets (Cost: Stamina)
  "Dempsey Cross": { name: "Dempsey Cross", class: "Gauntlet", power: 22, cost: "Stamina", maxStock: 16, buff: 1.0 },
  "Tremor Fist": { name: "Tremor Fist", class: "Gauntlet", power: 28, cost: "Stamina", maxStock: 12, buff: 1.0 },
  "God Hand": { name: "God Hand", class: "Gauntlet", power: 60, cost: "Stamina", maxStock: 4, buff: 1.0 },

  // Talismans (Cost: Ki)
  "Inner Pulse": { name: "Inner Pulse", class: "Talisman", power: 16, cost: "Ki", maxStock: 22, buff: 1.0 },
  "Lotus Burst": { name: "Lotus Burst", class: "Talisman", power: 30, cost: "Ki", maxStock: 14, buff: 1.2 },
  "Nirvana Strike": { name: "Nirvana Strike", class: "Talisman", power: 52, cost: "Ki", maxStock: 5, buff: 1.0 },

  // Staves (Cost: Mana)
  "Arc Flash": { name: "Arc Flash", class: "Staff", power: 17, cost: "Mana", maxStock: 22, buff: 1.0 },
  "Fireball": { name: "Fireball", class: "Staff", power: 32, cost: "Mana", maxStock: 12, buff: 1.0 },
  "Armageddon": { name: "Armageddon", class: "Staff", power: 65, cost: "Mana", maxStock: 3, buff: 1.0 }
};
