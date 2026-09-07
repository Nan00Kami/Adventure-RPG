import { EnvironmentRenderer } from './engine/Sprites.js';
import { MOVES_DB } from './data/Moves.js';
import { ALL_WEAPONS } from './data/Weapons.js';
import { REGIONAL_ENEMIES, BOSS_ENCOUNTERS } from './data/Enemies.js';

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const TILE_SIZE = 32;

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

// Starter loadout
const starter = ALL_WEAPONS["Folded Sword #1"] || Object.values(ALL_WEAPONS)[0];
const gameState = {
  playerX: 5,
  playerY: 6,
  playerBaseHp: 60,
  playerBaseAtk: 14,
  armorResist: 0.15,
  keenCores: 0,
  currentScene: "forest_dungeon", // "forest_dungeon" | "snow_mountains"
  pocket: [new WeaponInstance(starter)],
  activeIdx: 0,
  currentEnemy: null,
  inCombat: false,
  turnResolving: false, // Prevents input spamming during battle
  atkBuff: 1.0,
  unlockedLandmarks: new Set(["Sunken Temple Shrine"])
};

function getMasterHp() {
  return gameState.pocket.reduce((acc, w) => acc + w.hp, gameState.playerBaseHp);
}
function getMasterAtk() {
  return gameState.pocket.reduce((acc, w) => acc + w.atk, gameState.playerBaseAtk);
}

let playerBattleHp = getMasterHp();

// SCENE MAPS: Organic Winding Corridors Shaped by Dense Canopies (Tile 1)
// 0: Path, 1: Tree Wall, 2: Ruins, 3: Hunting Grass, 5: Cobble, 6: Anvil, 7: Boss, 8: Gate
const SCENES = {
  forest_dungeon: {
    biome: "forest",
    cols: 32,
    rows: 24,
    templePos: { x: 13, y: 3 },
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,0,0,0,0,0,0,0,0,5,5,5,5,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,0,0,1,1,1,0,0,0,0,5,6,5,5,0,0,1,1,1,0,0,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,1,1,1,0,0,0,5,5,5,5,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1],
      [1,1,1,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
      [1,1,0,0,1,1,3,3,3,1,1,1,0,0,0,0,1,1,1,3,3,3,1,1,0,0,1,1,1,1,1,1],
      [1,1,0,0,1,3,3,3,3,3,1,1,0,0,0,0,1,1,3,3,3,3,3,1,0,0,1,1,1,1,1,1],
      [1,1,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,1,1,1,1,1,1],
      [1,1,1,0,0,1,3,3,3,1,0,0,1,1,1,1,0,0,1,3,3,3,1,0,0,1,1,1,1,1,1,1],
      [1,1,1,1,0,0,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,0,0,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,0,0,0,0,0,7,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,8,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  },
  snow_mountains: {
    biome: "mountains",
    cols: 30,
    rows: 20,
    templePos: null,
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,8,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,0,0,0,1,1,1,1,0,0,0,0,1,1,1,0,0,0,1,1,1,1,1,1,1,1],
      [1,1,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,3,3,3,1,1,0,0,0,0,1,1,3,3,1,0,0,1,1,1,1,1,1,1],
      [1,1,0,0,1,1,3,3,3,3,3,0,0,5,5,0,0,3,3,3,1,1,0,0,1,1,1,1,1,1],
      [1,1,0,0,1,1,3,3,3,3,3,0,5,5,6,5,0,3,3,3,1,1,0,0,1,1,1,1,1,1],
      [1,1,0,0,0,0,0,3,3,3,0,0,5,5,5,5,0,0,3,3,0,0,0,0,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,1,1,1,1,1],
      [1,1,1,1,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1,1,1,1,1,1],
      [1,1,1,1,1,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,0,0,0,0,0,0,0,7,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  }
};

const LANDMARKS = [
  { id: "Sunken Temple Shrine", scene: "forest_dungeon", x: 14, y: 7, desc: "Ancient overworld sanctum" },
  { id: "Frost Peak Outpost", scene: "snow_mountains", x: 14, y: 7, desc: "High alpine research ridge" }
];

function updateHUD() {
  document.getElementById("hud-hp").innerText = `${playerBattleHp}/${getMasterHp()}`;
  document.getElementById("hud-atk").innerText = getMasterAtk();
  document.getElementById("hud-cores").innerText = gameState.keenCores;
  document.getElementById("hud-zone").innerText = gameState.currentScene.toUpperCase().replace("_", " ");
}

// Clamped Camera View
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scene = SCENES[gameState.currentScene];
  const maxCamX = scene.cols * TILE_SIZE - canvas.width;
  const maxCamY = scene.rows * TILE_SIZE - canvas.height;

  const camX = Math.max(0, Math.min(maxCamX, gameState.playerX * TILE_SIZE + TILE_SIZE / 2 - canvas.width / 2));
  const camY = Math.max(0, Math.min(maxCamY, gameState.playerY * TILE_SIZE + TILE_SIZE / 2 - canvas.height / 2));

  // Render Base Map
  for (let r = 0; r < scene.rows; r++) {
    for (let c = 0; c < scene.cols; c++) {
      const tileId = scene.map[r][c];
      const scrX = c * TILE_SIZE - camX;
      const scrY = r * TILE_SIZE - camY;
      if (scrX > -TILE_SIZE && scrX < canvas.width && scrY > -TILE_SIZE && scrY < canvas.height) {
        EnvironmentRenderer.drawTile(ctx, tileId, scene.biome, scrX, scrY, TILE_SIZE);
      }
    }
  }

  // Render Multi-Tile Temple Structure if in forest
  if (scene.templePos) {
    const tScrX = scene.templePos.x * TILE_SIZE - camX;
    const tScrY = scene.templePos.y * TILE_SIZE - camY;
    EnvironmentRenderer.drawTempleStructure(ctx, tScrX, tScrY);
  }

  // Render Player Sprite
  const pScrX = gameState.playerX * TILE_SIZE - camX;
  const pScrY = gameState.playerY * TILE_SIZE - camY;

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.arc(pScrX + 16, pScrY + 28, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d08770";
  ctx.fillRect(pScrX + 11, pScrY + 4, 10, 8);
  ctx.fillStyle = "#5e81ac";
  ctx.fillRect(pScrX + 8, pScrY + 12, 16, 14);
}

// Fast Travel UI (M)
function openWorldMap() {
  const modal = document.getElementById("map-modal");
  const container = document.getElementById("landmarks-grid");
  container.innerHTML = "";
  modal.classList.remove("hidden");

  LANDMARKS.forEach(lm => {
    const card = document.createElement("div");
    card.className = "landmark-card unlocked";
    card.innerHTML = `<strong>${lm.id}</strong><br><small>${lm.desc}</small>`;
    card.onclick = () => {
      gameState.currentScene = lm.scene;
      gameState.playerX = lm.x;
      gameState.playerY = lm.y;
      modal.classList.add("hidden");
      updateHUD();
      render();
    };
    container.appendChild(card);
  });
}
document.getElementById("btn-close-map").onclick = () => document.getElementById("map-modal").classList.add("hidden");

// Battle Engine Gated with Input Lock
function triggerBattle(enemyProfile) {
  gameState.inCombat = true;
  gameState.turnResolving = false;
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
    // Lock all buttons if turn is resolving or out of stock
    btn.disabled = gameState.turnResolving || m.currentStock <= 0;
    btn.onclick = () => executeTurn(m);
    movesContainer.appendChild(btn);
  });

  document.getElementById("btn-open-weapons").disabled = gameState.turnResolving;
  document.getElementById("btn-flee").disabled = gameState.turnResolving;
}

function executeTurn(move) {
  // Input Lock Check: Ignore spam clicks completely
  if (gameState.turnResolving) return;
  gameState.turnResolving = true; // Lock combat

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
  if (["Sword", "Lance", "Gauntlet"].includes(wp.type)) resist = gameState.currentEnemy.physRes || 0;
  else if (wp.type === "Talisman") resist = gameState.currentEnemy.spiRes || 0;
  else if (wp.type === "Staff") resist = gameState.currentEnemy.magRes || 0;

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

  // Enemy counter-attack
  setTimeout(() => {
    const incoming = Math.max(1, Math.floor(gameState.currentEnemy.atk * (1 - gameState.armorResist)));
    playerBattleHp -= incoming;
    document.getElementById("combat-log").innerText = `${gameState.currentEnemy.name} counter-attacks for ${incoming} dmg!`;

    if (playerBattleHp <= 0) {
      alert("Defeated! Returning to Temple entrance...");
      playerBattleHp = getMasterHp();
      gameState.playerX = 14;
      gameState.playerY = 7;
      endBattle();
    } else {
      // Turn complete: Unlock buttons for next player action
      gameState.turnResolving = false;
      updateBattleScreen();
    }
  }, 750);
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
      logText += ` [${lootedWeapon.name}] dropped (Pocket is full at 5/5).`;
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
  gameState.turnResolving = false;
  document.getElementById("battle-overlay").classList.add("hidden");
  updateHUD();
  render();
}

// Spatial Pocket Draw
document.getElementById("btn-open-weapons").onclick = () => {
  if (gameState.turnResolving) return;
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

// Workshop Crucible
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

// Overworld Movement & Collision
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

  const scene = SCENES[gameState.currentScene];
  const targetX = gameState.playerX + dx;
  const targetY = gameState.playerY + dy;

  // Boundary check
  if (targetX < 0 || targetX >= scene.cols || targetY < 0 || targetY >= scene.rows) return;

  const targetTile = scene.map[targetY][targetX];

  // Collision: Cannot walk through trees (1) or stone walls (2)
  if (targetTile === 1 || targetTile === 2) return;

  // Scene Portal Transition (Tile 8)
  if (targetTile === 8) {
    if (gameState.currentScene === "forest_dungeon") {
      gameState.currentScene = "snow_mountains";
      gameState.playerX = 14;
      gameState.playerY = 2;
    } else {
      gameState.currentScene = "forest_dungeon";
      gameState.playerX = 14;
      gameState.playerY = 20;
    }
    updateHUD();
    render();
    return;
  }

  gameState.playerX = targetX;
  gameState.playerY = targetY;
  updateHUD();
  render();

  // Forge interaction (Tile 6)
  if (targetTile === 6 || e.key.toLowerCase() === "b") {
    openWorkshop();
  }

  // Boss Battle (Tile 7)
  if (targetTile === 7) {
    const boss = gameState.currentScene === "forest_dungeon"
      ? BOSS_ENCOUNTERS.boss_forest
      : BOSS_ENCOUNTERS.boss_mountains;
    triggerBattle(boss);
  } else if (targetTile === 3 && Math.random() < 0.22) {
    // Hunting Ground Encounter
    const pool = REGIONAL_ENEMIES[gameState.currentScene === "forest_dungeon" ? "forest" : "mountains"];
    const enemy = pool[Math.floor(Math.random() * pool.length)];
    triggerBattle(enemy);
  }
});

// Boot
updateHUD();
render();
