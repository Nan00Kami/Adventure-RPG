import { EnvironmentRenderer } from './engine/Sprites.js';
import { MOVES_DB } from './data/Moves.js';
import { ALL_WEAPONS } from './data/Weapons.js';
import { REGIONAL_ENEMIES, BOSS_ENCOUNTERS } from './data/Enemies.js';

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 32;
const WORLD_COLS = 90;
const WORLD_ROWS = 60;

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

// 5. Initial conditions: 1 starting weapon, 0 Keen Cores
const starter = ALL_WEAPONS["Folded Sword #1"] || Object.values(ALL_WEAPONS)[0];
const gameState = {
  playerX: 12,
  playerY: 14,
  playerBaseHp: 40,
  playerBaseAtk: 10,
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

// Master stats computation
function getMasterHp() {
  return gameState.pocket.reduce((acc, w) => acc + w.hp, gameState.playerBaseHp);
}
function getMasterAtk() {
  return gameState.pocket.reduce((acc, w) => acc + w.atk, gameState.playerBaseAtk);
}

let playerBattleHp = getMasterHp();

// Landmarks configuration
const LANDMARKS = [
  { id: "Grasslands Village", x: 12, y: 14, region: "grasslands", desc: "Starting village & Master Forge" },
  { id: "Azure Beach Port", x: 38, y: 14, region: "beach", desc: "Harbor & Boat Vendor" },
  { id: "Ascetic Dojo", x: 12, y: 38, region: "hillside", desc: "High mountain trial" },
  { id: "Sunken Temple", x: 38, y: 38, region: "forest", desc: "Ancient sanctum" },
  { id: "Alpine Laboratory", x: 68, y: 38, region: "mountains", desc: "Cryo research facility" },
  { id: "Abyssal Prison", x: 68, y: 14, region: "ocean", desc: "Isolated oceanic prison" }
];

// Region boundary locator based on the layout
function getZoneAt(x, y) {
  if (x < 30 && y < 25) return "grasslands";
  if (x >= 30 && x < 55 && y < 25) return "beach";
  if (x < 30 && y >= 25) return "hillside";
  if (x >= 30 && x < 55 && y >= 25) return "forest";
  if (x >= 55 && y >= 25) return "mountains";
  return "ocean";
}

// Check landmark unlock on player step
function checkLandmarkUnlocks() {
  LANDMARKS.forEach(lm => {
    if (Math.abs(gameState.playerX - lm.x) <= 2 && Math.abs(gameState.playerY - lm.y) <= 2) {
      if (!gameState.unlockedLandmarks.has(lm.id)) {
        gameState.unlockedLandmarks.add(lm.id);
        alert(`New Fast Travel Landmark Discovered: ${lm.id}!`);
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

// Camera tracking
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const camX = gameState.playerX * TILE_SIZE - canvas.width / 2;
  const camY = gameState.playerY * TILE_SIZE - canvas.height / 2;

  const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
  const endCol = Math.min(WORLD_COLS, startCol + Math.ceil(canvas.width / TILE_SIZE) + 1);
  const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
  const endRow = Math.min(WORLD_ROWS, startRow + Math.ceil(canvas.height / TILE_SIZE) + 1);

  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const zone = getZoneAt(c, r);
      const scrX = c * TILE_SIZE - camX;
      const scrY = r * TILE_SIZE - camY;
      EnvironmentRenderer.drawEnvironmentTile(ctx, zone, scrX, scrY, TILE_SIZE);
    }
  }

  // Draw Landmarks & interactables
  LANDMARKS.forEach(lm => {
    const scrX = lm.x * TILE_SIZE - camX;
    const scrY = lm.y * TILE_SIZE - camY;
    EnvironmentRenderer.drawEnvironmentTile(ctx, "town", scrX, scrY, TILE_SIZE);
  });

  // Blacksmiths at Grasslands and Alpine Lab
  [[12, 15], [68, 39]].forEach(([bx, by]) => {
    EnvironmentRenderer.drawObject(ctx, "anvil", bx * TILE_SIZE - camX, by * TILE_SIZE - camY, TILE_SIZE);
  });

  // Boat merchant at Beach
  EnvironmentRenderer.drawObject(ctx, "boat_merchant", 40 * TILE_SIZE - camX, 14 * TILE_SIZE - camY, TILE_SIZE);

  // Regional Bosses
  const bossPos = [[18, 18], [45, 18], [18, 48], [45, 48], [75, 48], [75, 18]];
  bossPos.forEach(([bx, by]) => {
    EnvironmentRenderer.drawObject(ctx, "boss", bx * TILE_SIZE - camX, by * TILE_SIZE - camY, TILE_SIZE);
  });

  // Player character
  ctx.fillStyle = "#eceff4";
  ctx.fillRect(canvas.width / 2 - 8, canvas.height / 2 - 8, 16, 16);
  ctx.fillStyle = "#5e81ac";
  ctx.fillRect(canvas.width / 2 - 6, canvas.height / 2 - 6, 12, 12);
}

// Fast Travel UI (M key)
function openWorldMap() {
  const modal = document.getElementById("map-modal");
  const container = document.getElementById("landmarks-grid");
  container.innerHTML = "";
  modal.classList.remove("hidden");

  LANDMARKS.forEach(lm => {
    const isUnlocked = gameState.unlockedLandmarks.has(lm.id);
    const card = document.createElement("div");
    card.className = `landmark-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `<strong>${lm.id}</strong> [${lm.region}]<br><small>${isUnlocked ? lm.desc : "Undiscovered Territory"}</small>`;

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

// Turn-Based Combat Logic
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
  wpLabel.className = activeWp.rarity; // Rarity color indicator

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

  // Type triangle
  let typeAdv = 1.0;
  if ((wp.type === "Sword" && gameState.currentEnemy.type === "Gauntlet") ||
      (wp.type === "Gauntlet" && gameState.currentEnemy.type === "Lance") ||
      (wp.type === "Lance" && gameState.currentEnemy.type === "Sword") ||
      (wp.type === "Talisman" && gameState.currentEnemy.type === "Staff") ||
      (wp.type === "Staff" && gameState.currentEnemy.type === "Talisman")) {
    typeAdv = 2.0;
  }

  // Resistances
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
    setTimeout(defeatEnemy, 800);
    return;
  }

  // Enemy counter
  setTimeout(() => {
    const incoming = Math.max(1, Math.floor(gameState.currentEnemy.atk * (1 - gameState.armorResist)));
    playerBattleHp -= incoming;
    updateBattleScreen();
    document.getElementById("combat-log").innerText = `${gameState.currentEnemy.name} counter-attacks for ${incoming} dmg!`;

    if (playerBattleHp <= 0) {
      alert("Defeated! Reviving in Grasslands Village...");
      playerBattleHp = getMasterHp();
      gameState.playerX = 12;
      gameState.playerY = 14;
      endBattle();
    }
  }, 700);
}

// 3. Acquire enemy's weapon + drop Keen Cores if boss
function defeatEnemy() {
  const lootWpName = gameState.currentEnemy.weaponName;
  let logText = `Victory! Defeated ${gameState.currentEnemy.name}!`;

  if (ALL_WEAPONS[lootWpName]) {
    const lootedWeapon = new WeaponInstance(ALL_WEAPONS[lootWpName]);
    if (gameState.pocket.length < 5) {
      gameState.pocket.push(lootedWeapon);
      logText += ` Claimed [${lootedWeapon.name}] into spatial pocket!`;
    } else {
      logText += ` [${lootedWeapon.name}] discovered! (Pocket full - visit forge to manage).`;
    }
  }

  if (gameState.currentEnemy.cores) {
    gameState.keenCores += gameState.currentEnemy.cores;
    logText += ` Acquired ${gameState.currentEnemy.cores} Keen Core(s)!`;
  }

  document.getElementById("combat-log").innerText = logText;
  updateHUD();
  setTimeout(endBattle, 1400);
}

function endBattle() {
  gameState.inCombat = false;
  document.getElementById("battle-overlay").classList.add("hidden");
  updateHUD();
  render();
}

// Draw weapon in combat
document.getElementById("btn-open-weapons").onclick = () => {
  const menu = document.getElementById("pocket-menu");
  const list = document.getElementById("pocket-list");
  list.innerHTML = "";
  menu.classList.remove("hidden");

  gameState.pocket.forEach((w, idx) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<span class="${w.rarity}"><strong>${w.name}</strong> (${w.type}) | MV: ${Math.round(w.mv*100)}%</span>`;
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

// Workshop / Forge
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
  alert("All weapon moves refreshed and master HP restored!");
};
document.getElementById("btn-close-workshop").onclick = () => document.getElementById("workshop-modal").classList.add("hidden");

// Controls & Movement
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

  const targetX = Math.max(0, Math.min(WORLD_COLS - 1, gameState.playerX + dx));
  const targetY = Math.max(0, Math.min(WORLD_ROWS - 1, gameState.playerY + dy));
  const targetZone = getZoneAt(targetX, targetY);

  // Ocean barrier check: needs boat
  if (targetZone === "ocean" && !gameState.hasBoat) {
    alert("The ocean depths require a seaworthy vessel! Purchase one from the Beach merchant.");
    return;
  }

  gameState.playerX = targetX;
  gameState.playerY = targetY;
  checkLandmarkUnlocks();
  updateHUD();
  render();

  // Check Boat Merchant interaction at (40, 14)
  if (gameState.playerX === 40 && gameState.playerY === 14 && !gameState.hasBoat) {
    if (confirm("Boat Merchant: 'Would you like to commission an ocean vessel for exploration?'")) {
      gameState.hasBoat = true;
      alert("Acquired the Ocean Vessel! You can now freely sail across the ocean.");
    }
  }

  // Blacksmith trigger
  if (e.key.toLowerCase() === "b" || ((gameState.playerX === 12 && gameState.playerY === 15) || (gameState.playerX === 68 && gameState.playerY === 39))) {
    openWorkshop();
  }

  // Encounter check
  const bossMap = {
    "18,18": BOSS_ENCOUNTERS.boss_grasslands,
    "45,18": BOSS_ENCOUNTERS.boss_beach,
    "18,48": BOSS_ENCOUNTERS.boss_hillside,
    "45,48": BOSS_ENCOUNTERS.boss_forest,
    "75,18": BOSS_ENCOUNTERS.boss_ocean,
    "75,48": BOSS_ENCOUNTERS.boss_mountains
  };

  const key = `${gameState.playerX},${gameState.playerY}`;
  if (bossMap[key]) {
    triggerBattle(bossMap[key]);
  } else if (Math.random() < 0.12) {
    const list = REGIONAL_ENEMIES[targetZone];
    if (list && list.length > 0) {
      const enemy = list[Math.floor(Math.random() * list.length)];
      triggerBattle(enemy);
    }
  }
});

// Initial boot
updateHUD();
render();
