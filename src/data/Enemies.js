export const REGIONAL_ENEMIES = {
  grasslands: [
    { name: "Grassland Highwayman", type: "Sword", hp: 70, atk: 12, physRes: 0.05, spiRes: 0.0, magRes: 0.0, weaponName: "Folded Sword #4" },
    { name: "Wild Brawler", type: "Gauntlet", hp: 85, atk: 14, physRes: 0.10, spiRes: 0.0, magRes: -0.1, weaponName: "Crag-Iron Gauntlet #3" }
  ],
  beach: [
    { name: "Tide Raider", type: "Lance", hp: 110, atk: 17, physRes: 0.08, spiRes: 0.0, magRes: 0.1, weaponName: "Halberd-Pattern Lance #6" },
    { name: "Shore Shaman", type: "Staff", hp: 90, atk: 22, physRes: -0.1, spiRes: 0.1, magRes: 0.2, weaponName: "Ley-Channeled Staff #5" }
  ],
  hillside: [
    { name: "Mountain Ascetic", type: "Talisman", hp: 130, atk: 24, physRes: 0.05, spiRes: 0.25, magRes: 0.0, weaponName: "Five-Phase Talisman #7" }
  ],
  forest: [
    { name: "Ancient Treant Guard", type: "Lance", hp: 280, atk: 35, physRes: 0.20, spiRes: -0.1, magRes: 0.1, weaponName: "Gilded Lance #12" },
    { name: "Forest Mystic", type: "Staff", hp: 220, atk: 42, physRes: -0.1, spiRes: 0.15, magRes: 0.3, weaponName: "Eclipse Staff #14" }
  ],
  mountains: [
    { name: "Frost Vanguard", type: "Gauntlet", hp: 440, atk: 52, physRes: 0.25, spiRes: 0.1, magRes: -0.1, weaponName: "Colossus Gauntlet #18" }
  ],
  ocean: [
    { name: "Deep Trench Leviathan", type: "Talisman", hp: 550, atk: 60, physRes: 0.15, spiRes: 0.3, magRes: 0.1, weaponName: "Zenith Talisman #16" }
  ]
};

export const BOSS_ENCOUNTERS = {
  // Early Region Bosses
  boss_grasslands: { name: "Bandit King Rogan", isBoss: true, type: "Sword", hp: 220, atk: 22, physRes: 0.1, spiRes: 0.0, magRes: 0.0, weaponName: "Vindicator's Sword #10", cores: 1 },
  boss_beach: { name: "Corsair Admiral Morgan", isBoss: true, type: "Lance", hp: 320, atk: 28, physRes: 0.15, spiRes: 0.0, magRes: 0.0, weaponName: "Sky-Piercer Lance #11", cores: 1 },
  boss_hillside: { name: "Dojo Grandmaster Jin", isBoss: true, type: "Gauntlet", hp: 420, atk: 36, physRes: 0.2, spiRes: 0.1, magRes: 0.0, weaponName: "Asura Gauntlet #13", cores: 2 },
  
  // Mid Region Bosses
  boss_forest: { name: "Keeper of the Sunken Shrine", isBoss: true, type: "Talisman", hp: 850, atk: 55, physRes: 0.1, spiRes: 0.35, magRes: 0.1, weaponName: "Karma-Loop Talisman #20", cores: 2 },
  boss_ocean: { name: "Prison Warden Tartarus", isBoss: true, type: "Sword", hp: 1100, atk: 68, physRes: 0.25, spiRes: 0.1, magRes: 0.1, weaponName: "Void-Etched Sword #21", cores: 3 },
  boss_mountains: { name: "Chief Scientist Vex", isBoss: true, type: "Staff", hp: 1350, atk: 78, physRes: 0.0, spiRes: 0.2, magRes: 0.4, weaponName: "Chronos Staff #22", cores: 3 }
};
