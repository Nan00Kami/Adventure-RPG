import { EnvironmentRenderer } from './engine/Sprites.js';
import { MOVES_DB } from './data/Moves.js';
import { ALL_WEAPONS } from './data/Weapons.js';
import { REGIONAL_ENEMIES, BOSS_ENCOUNTERS } from './data/Enemies.js';

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 32;
// Expanded world scale: 120 x 80 tiles
const WORLD_COLS = 120;
const WORLD_ROWS = 80;

class WeaponInstance {
  constructor(proto) {
    this.name = proto.name;
    this.type = proto.type;
    this.rarity = proto.rarity;
    this.hp = proto.hp;
    this.atk = proto.atk;
    this.mv = proto.mv;
    this.critChance = 0;
    this.keenCoresUsed = 0;
    this.moves = proto.moves.map(k => ({ ...MOVES_DB[k], currentStock: MOVES_DB[k].maxStock }));
  }
}

// Starter loadout: 1 weapon, 0 cores
const starter = ALL_WEAPONS["Folded Sword #1"] || Object.values(ALL_WEAPONS)[0];
const gameState = {
  playerX: 18,
  playerY: 18,
  playerBaseHp: 50,
  playerBaseAtk: 12,
  armorResist: 0.15,
  keenCores: 0,
  hasBoat: false,
  pocket: [new WeaponInstance(starter)],
  activeIdx: 0,
  currentEnemy: null,
  inCombat: false,
  atkBuff: 1.0,
  unlockedLandmarks: new Set(["Grasslands Village"])
};

function getMasterHp() {
  return gameState.pocket.reduce((acc, w) => acc + w.hp, gameState.playerBaseHp);
}
function getMasterAtk() {
  return gameState.pocket.reduce((acc, w) => acc + w.atk, gameState.playerBaseAtk);
}

let playerBattleHp = getMasterHp();

const LANDMARKS = [
  { id: "Grasslands Village", x: 18, y: 18, region: "grasslands", desc: "Settlement & Master Crucible" },
  { id: "Azure Beach Port", x: 55, y: 18, region: "beach", desc: "Harbor & Vessel Broker" },
  { id: "Ascetic Dojo", x: 18, y: 55, region: "hillside", desc: "Monastic combat grounds" },
  { id: "Sunken Temple", x: 55, y: 55, region: "forest", desc: "Overgrown ancient ruins" },
  { id: "Alpine Laboratory", x: 98, y: 55, region: "mountains", desc: "Frost-bound research facility" },
  { id: "Abyssal Prison", x: 98, y: 18, region: "ocean", desc: "High-security island fortress" }
];

// Region boundary locator across 120 x 80 map
function getZoneAt(x, y) {
  if (x < 40 && y < 40) return "grasslands";
  if (x >= 40 && x < 80 && y < 40) return "beach";
  if (x < 40 && y >= 40) return "hillside";
  if (x >= 40 && x < 80 && y >= 40) return "forest";
  if (x >= 80 && y >= 40) return "mountains";
  return "ocean";
}

// Deterministic Hunting Grounds: Specific tall-grass patches per region
// Walking ANYWHERE outside these zones is completely safe.
function isDangerPatch(x, y) {
  // Do not spawn danger patches on top of landmarks or paths
  for (const lm of LANDMARKS) {
    if (Math.abs(x - lm.x) <= 4 && Math.abs(y - lm.y) <= 4) return false;
  }

  // Grasslands Hunting Fields (East of village)
  if (x >= 24 && x <= 35 && y >= 10 && y <= 28) return true;
  // Beach Coastal Reefs
  if (x >= 62 && x <= 75 && y >= 10 && y <= 25) return true;
  // Hillside Crags
  if (x >= 10 && x <= 32 && y >= 46 && y <= 68) return true;
  // Deep Forest Thick Woods
  if (x >= 46 && x <= 72 && y >= 44 && y <= 70) return true;
  // Mountain Permafrost Wilds
  if (x >= 86 && x <= 112 && y >= 44 && y <= 72) return true;
  // Open Ocean Whirlpools
  if (x >= 86 && x <= 112 && y >= 8 && y <= 32) return true;

  return false;
}

function checkLandmarkUnlocks() {
  LANDMARKS.forEach(lm => {
    if (Math.abs(gameState.playerX - lm.x) <= 2 && Math.abs(gameState.playerY - lm.y) <= 2) {
      if (!gameState.unlockedLandmarks.has(lm.id)) {
        gameState.unlockedLandmarks.add(lm.id);
        alert(`Discovered Landmark: ${lm.id}! Unlocked for Fast Travel.`);
      }
    }
  });
}

function updateHUD() {
  document.getElementById("hud-hp").innerText = `${playerBattleHp}/${getMasterHp()}`;
  document.getElementById("hud-atk").innerText = getMasterAtk();
  document.getElementById("hud-cores").innerText = gameState.keenCores;
  document.getElementById("hud-zone").innerText = getZoneAt(gameState.playerX, gameState.playerY).toUpperCase();
}

// Render loop with clamped camera tracking (prevents black empty voids)
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;
  const maxCamX = WORLD_COLS * TILE_SIZE - canvas.width;
  const maxCamY = WORLD_ROWS * TILE_SIZE - canvas.height;

  // Clamped Camera
  const camX = Math.max(0, Math.min(maxCamX, gameState.playerX * TILE_SIZE + TILE_SIZE / 2 - halfW));
  const camY = Math.max(0, Math.min(maxCamY, gameState.playerY * TILE_SIZE + TILE_SIZE / 2 - halfH));

  const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
  const endCol = Math.min(WORLD_COLS, startCol + Math.ceil(canvas.width / TILE_SIZE) + 1);
  const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
  const endRow = Math.min(WORLD_ROWS, startRow + Math.ceil(canvas.height / TILE_SIZE) + 1);

  // 1. Draw Map Tiles
  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const zone = getZoneAt(c, r);
      const isDanger = isDangerPatch(c, r);
      const scrX = c * TILE_SIZE - camX;
      const scrY = r * TILE_SIZE - camY;
      EnvironmentRenderer.drawEnvironmentTile(ctx, zone, isDanger, scrX, scrY, TILE_SIZE);
    }
  }

  // 2. Draw Landmark Plazas
  LANDMARKS.forEach(lm => {
    const scrX = lm.x * TILE_SIZE - camX;
    const scrY = lm.y * TILE_SIZE - camY;
    if (scrX > -TILE_SIZE && scrX < canvas.width && scrY > -TILE_SIZE && scrY < canvas.height) {
      EnvironmentRenderer.drawEnvironmentTile(ctx, "town", false, scrX, scrY, TILE_SIZE);
    }
  });

  // 3. Draw World Interactables (Anvils & Merchants)
  [[18, 19], [98, 56]].forEach(([bx, by]) => {
    EnvironmentRenderer.drawObject(ctx, "anvil", bx * TILE_SIZE - camX, by * TILE_SIZE - camY, TILE_SIZE);
  });
  EnvironmentRenderer.drawObject(ctx, "boat_merchant", 58 * TILE_SIZE - camX, 18 * TILE_SIZE - camY, TILE_SIZE);

  // 4. Draw Boss Arenas
  const bossLocations = [[28, 20], [68, 20], [25, 60], [60, 60], [105, 60], [105, 20]];
  bossLocations.forEach(([bx, by]) => {
    EnvironmentRenderer.drawObject(ctx, "boss", bx * TILE_SIZE - camX, by * TILE_SIZE - camY, TILE_SIZE);
  });

  // 5. Draw Player Character
  const playerScrX = gameState.playerX * TILE_SIZE - camX;
  const playerScrY = gameState.playerY * TILE_SIZE - camY;

  ctx.fillStyle = "#2e3440"; // Shadow
  ctx.beginPath();
  ctx.arc(playerScrX + 16, playerScrY + 28, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d08770"; // Head
  ctx.fillRect(playerScrX + 11, playerScrY + 4, 10, 8);
  ctx.fillStyle = "#5e81ac"; // Cloak
  ctx.fillRect(playerScrX + 8, playerScrY + 12, 16, 14);
}

// Fast Travel UI (M)
function openWorldMap() {
  const modal = document.getElementById("map-modal");
  const container = document.getElementById("landmarks-grid");
  container.innerHTML = "";
  modal.classList.remove("hidden");

  LANDMARKS.forEach(lm => {
    const isUnlocked = gameState.unlockedLandmarks.has(lm.id);
    const card = document.createElement("div");
    card.className = `landmark-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `<strong>${lm.id}</strong> [${lm.region.toUpperCase()}]<br><small>${isUnlocked ? lm.desc : "Undiscovered Location"}</small>`;

    if (isUnlocked) {
      card.onclick = () => {
        gameState.playerX = lm.x;
        gameState.playerY = lm.y;
        modal.classList.add("hidden");
        updateHUD();
        render();
      };
    }
    container.appendChild(card);
  });
}
document.getElementById("btn-close-map").onclick = () => document.getElementById("map-modal").classList.add("hidden");

// Battle Trigger & Turn Loop
function triggerBattle(enemyProfile) {
  gameState.inCombat = true;
  gameState.atkBuff = 1.0;
  gameState.currentEnemy = { ...enemyProfile, maxHp: enemyProfile.hp };

  document.getElementById("battle-overlay").classList.remove("hidden");
  updateBattleScreen();
  document.getElementById("combat-log").innerText = `Encountered ${enemyProfile.name} (${enemyProfile.type})!`;
}

function updateBattleScreen() {
  const activeWp = gameState.pocket[gameState.activeIdx];
  const wpLabel = document.getElementById("active-weapon-name");
  wpLabel.innerText = `${activeWp.name} (${activeWp.type})`;
  wpLabel.className = activeWp.rarity;

  document.getElementById("active-weapon-mv").innerText = `MV: ${Math.round(activeWp.mv * 100)}% | Crit: ${Math.round(activeWp.critChance * 100)}%`;
  document.getElementById("player-hp-fill").style.width = `${(playerBattleHp / getMasterHp()) * 100}%`;
  document.getElementById("player-hp-text").innerText = `${Math.max(0, playerBattleHp)} / ${getMasterHp()}`;

  document.getElementById("enemy-name").innerText = gameState.currentEnemy.name;
  document.getElementById("enemy-type").innerText = gameState.currentEnemy.type;
  document.getElementById("enemy-hp-fill").style.width = `${(gameState.currentEnemy.hp / gameState.currentEnemy.maxHp) * 100}%`;
  document.getElementById("enemy-hp-text").innerText = `${Math.max(0, gameState.currentEnemy.hp)} / ${gameState.currentEnemy.maxHp}`;

  const movesContainer = document.getElementById("moves-container");
  movesContainer.innerHTML = "";
  activeWp.moves.forEach(m => {
    const btn = document.createElement("button");
    btn.innerHTML = `<strong>${m.name}</strong><br><small>${m.cost}: ${m.currentStock}/${m.maxStock}</small>`;
    btn.disabled = m.currentStock <= 0;
    btn.onclick = () => executeTurn(m);
    movesContainer.appendChild(btn);
  });
}

function executeTurn(move) {
  const wp = gameState.pocket[gameState.activeIdx];
  move.currentStock--;
  if (move.buff > 1.0) gameState.atkBuff = move.buff;

  let typeAdv = 1.0;
  if ((wp.type === "Sword" && gameState.currentEnemy.type === "Gauntlet") ||
      (wp.type === "Gauntlet" && gameState.currentEnemy.type === "Lance") ||
      (wp.type === "Lance" && gameState.currentEnemy.type === "Sword") ||
      (wp.type === "Talisman" && gameState.currentEnemy.type === "Staff") ||
      (wp.type === "Staff" && gameState.currentEnemy.type === "Talisman")) {
    typeAdv = 2.0;
  }

  let resist = 0;
  if (["Sword", "Lance", "Gauntlet"].includes(wp.type)) resist = gameState.currentEnemy.physRes;
  else if (wp.type === "Talisman") resist = gameState.currentEnemy.spiRes;
  else if (wp.type === "Staff") resist = gameState.currentEnemy.magRes;

  const isCrit = Math.random() < wp.critChance;
  const critMult = isCrit ? 2.0 : 1.0;

  const damage = Math.max(1, Math.floor((getMasterAtk() * 0.5) * wp.mv * (move.power / 10) * gameState.atkBuff * (1 - resist) * typeAdv * critMult));
  gameState.currentEnemy.hp -= damage;
  updateBattleScreen();

  document.getElementById("combat-log").innerText = `Dealt ${damage} damage! ${typeAdv > 1 ? '(Type Advantage!) ' : ''}${isCrit ? '[CRIT!]' : ''}`;

  if (gameState.currentEnemy.hp <= 0) {
    setTimeout(defeatEnemy, 700);
    return;
  }

  setTimeout(() => {
    const incoming = Math.max(1, Math.floor(gameState.currentEnemy.atk * (1 - gameState.armorResist)));
    playerBattleHp -= incoming;
    updateBattleScreen();
    document.getElementById("combat-log").innerText = `${gameState.currentEnemy.name} attacks for ${incoming} dmg!`;

    if (playerBattleHp <= 0) {
      alert("Defeated in battle! Regrouping at Grasslands Village...");
      playerBattleHp = getMasterHp();
      gameState.playerX = 18;
      gameState.playerY = 18;
      endBattle();
    }
  }, 700);
}

function defeatEnemy() {
  const lootWpName = gameState.currentEnemy.weaponName;
  let logText = `Defeated ${gameState.currentEnemy.name}!`;

  if (ALL_WEAPONS[lootWpName]) {
    const lootedWeapon = new WeaponInstance(ALL_WEAPONS[lootWpName]);
    if (gameState.pocket.length < 5) {
      gameState.pocket.push(lootedWeapon);
      logText += ` Acquired [${lootedWeapon.name}]!`;
    } else {
      logText += ` [${lootedWeapon.name}] dropped (Pocket is full at 5/5 weapons).`;
    }
  }

  if (gameState.currentEnemy.cores) {
    gameState.keenCores += gameState.currentEnemy.cores;
    logText += ` +${gameState.currentEnemy.cores} Keen Core(s)!`;
  }

  document.getElementById("combat-log").innerText = logText;
  updateHUD();
  setTimeout(endBattle, 1300);
}

function endBattle() {
  gameState.inCombat = false;
  document.getElementById("battle-overlay").classList.add("hidden");
  updateHUD();
  render();
}

// Spatial Pocket Menu
document.getElementById("btn-open-weapons").onclick = () => {
  const menu = document.getElementById("pocket-menu");
  const list = document.getElementById("pocket-list");
  list.innerHTML = "";
  menu.classList.remove("hidden");

  gameState.pocket.forEach((w, idx) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<span class="${w.rarity}"><strong>${w.name}</strong> (${w.type}) | MV: ${Math.round(w.mv * 100)}%</span>`;
    const btn = document.createElement("button");
    btn.innerText = idx === gameState.activeIdx ? "Equipped" : "Draw";
    btn.disabled = idx === gameState.activeIdx;
    btn.onclick = () => {
      gameState.activeIdx = idx;
      menu.classList.add("hidden");
      updateBattleScreen();
    };
    row.appendChild(btn);
    list.appendChild(row);
  });
};
document.getElementById("btn-close-pocket").onclick = () => document.getElementById("pocket-menu").classList.add("hidden");

// Workshop / Blacksmith
function openWorkshop() {
  const modal = document.getElementById("workshop-modal");
  const inv = document.getElementById("workshop-inventory");
  inv.innerHTML = "";
  modal.classList.remove("hidden");

  gameState.pocket.forEach(wp => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<span class="${wp.rarity}"><strong>${wp.name}</strong> | Crit: ${Math.round(wp.critChance * 100)}% (${wp.keenCoresUsed}/4 Cores)</span>`;
    const btn = document.createElement("button");
    btn.innerText = "Infuse Core (+25% Crit)";
    btn.disabled = gameState.keenCores <= 0 || wp.keenCoresUsed >= 4;
    btn.onclick = () => {
      gameState.keenCores--;
      wp.keenCoresUsed++;
      wp.critChance += 0.25;
      updateHUD();
      openWorkshop();
    };
    row.appendChild(btn);
    inv.appendChild(row);
  });
}

document.getElementById("btn-reforge-all").onclick = () => {
  gameState.pocket.forEach(w => w.moves.forEach(m => m.currentStock = m.maxStock));
  playerBattleHp = getMasterHp();
  updateHUD();
  alert("All weapon moves honed and master HP restored!");
};
document.getElementById("btn-close-workshop").onclick = () => document.getElementById("workshop-modal").classList.add("hidden");

// Movement & Interaction Controller
window.addEventListener("keydown", (e) => {
  if (gameState.inCombat) return;

  if (e.key.toLowerCase() === "m") {
    openWorldMap();
    return;
  }

  let dx = 0;
  let dy = 0;
  if (e.key === "w" || e.key === "ArrowUp") dy = -1;
  if (e.key === "s" || e.key === "ArrowDown") dy = 1;
  if (e.key === "a" || e.key === "ArrowLeft") dx = -1;
  if (e.key === "d" || e.key === "ArrowRight") dx = 1;

  if (dx === 0 && dy === 0) return;

  const targetX = Math.max(0, Math.min(WORLD_COLS - 1, gameState.playerX + dx));
  const targetY = Math.max(0, Math.min(WORLD_ROWS - 1, gameState.playerY + dy));
  const targetZone = getZoneAt(targetX, targetY);

  // Ocean Vessel Requirement
  if (targetZone === "ocean" && !gameState.hasBoat) {
    alert("The ocean depths require a boat! Obtain one at Azure Beach Port.");
    return;
  }

  gameState.playerX = targetX;
  gameState.playerY = targetY;
  checkLandmarkUnlocks();
  updateHUD();
  render();

  // Boat Broker interaction at (58, 18)
  if (gameState.playerX === 58 && gameState.playerY === 18 && !gameState.hasBoat) {
    if (confirm("Harbor Master: 'Commission an ocean-faring vessel for 0g?'")) {
      gameState.hasBoat = true;
      alert("Obtained Ocean Vessel! You can now explore oceanic regions.");
    }
  }

  // Blacksmith interaction
  if (e.key.toLowerCase() === "b" || ((gameState.playerX === 18 && gameState.playerY === 19) || (gameState.playerX === 98 && gameState.playerY === 56))) {
    openWorkshop();
  }

  // Boss Arenas
  const bossMap = {
    "28,20": BOSS_ENCOUNTERS.boss_grasslands,
    "68,20": BOSS_ENCOUNTERS.boss_beach,
    "25,60": BOSS_ENCOUNTERS.boss_hillside,
    "60,60": BOSS_ENCOUNTERS.boss_forest,
    "105,20": BOSS_ENCOUNTERS.boss_ocean,
    "105,60": BOSS_ENCOUNTERS.boss_mountains
  };

  const coordKey = `${gameState.playerX},${gameState.playerY}`;
  if (bossMap[coordKey]) {
    triggerBattle(bossMap[coordKey]);
  } else if (isDangerPatch(gameState.playerX, gameState.playerY)) {
    // Battles ONLY happen inside visually marked tall-grass patches
    if (Math.random() < 0.20) {
      const pool = REGIONAL_ENEMIES[targetZone] || REGIONAL_ENEMIES.grasslands;
      const enemy = pool[Math.floor(Math.random() * pool.length)];
      triggerBattle(enemy);
    }
  }
});

// Boot
updateHUD();
render();
