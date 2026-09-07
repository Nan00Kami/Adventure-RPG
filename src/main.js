import { SpriteGenerator } from './engine/Sprites.js';
import { MOVES_DB } from './data/Moves.js';

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const TILE = 32;

// --- STATE INITIALIZATION ---
class WeaponInstance {
  constructor(name, type, rarity, hp, atk, mv, moves) {
    this.name = name;
    this.type = type;
    this.rarity = rarity;
    this.hp = hp;
    this.atk = atk;
    this.mv = mv;
    this.critChance = 0; // Each Keen Core adds +0.25 (up to 1.0)
    this.keenCoresUsed = 0;
    this.moves = moves.map(mKey => ({ ...MOVES_DB[mKey], currentStock: MOVES_DB[mKey].maxStock }));
  }
}

const gameState = {
  keenCores: 3,
  playerX: 4,
  playerY: 4,
  playerBaseHp: 40,
  playerBaseAtk: 10,
  armorResist: 0.15, // 15% damage reduction from equipped armor
  pocket: [
    new WeaponInstance("Tempered Sword", "Sword", "Common", 20, 8, 1.25, ["Slash", "Blade Dance"]),
    new WeaponInstance("Iron Pike", "Lance", "Common", 24, 6, 1.15, ["Javelin Thrust"]),
    new WeaponInstance("Brass Knuckles", "Gauntlet", "Common", 18, 9, 1.30, ["Dempsey Cross"]),
    new WeaponInstance("Jade Talisman", "Talisman", "Rare", 35, 14, 1.40, ["Inner Pulse", "Lotus Burst"]),
    new WeaponInstance("Crystal Staff", "Staff", "Rare", 30, 16, 1.45, ["Arc Flash", "Fireball"])
  ],
  activeIdx: 0,
  currentEnemy: null,
  inCombat: false,
  atkBuffMultiplier: 1.0
};

// --- MASTER STAT AGGREGATION ---
function getMasterHp() {
  return gameState.pocket.reduce((sum, w) => sum + w.hp, gameState.playerBaseHp);
}

function getMasterAtk() {
  return gameState.pocket.reduce((sum, w) => sum + w.atk, gameState.playerBaseAtk);
}

let playerBattleHp = getMasterHp();

// Update Top HUD
function updateHud() {
  document.getElementById("hud-hp").innerText = `${playerBattleHp}/${getMasterHp()}`;
  document.getElementById("hud-atk").innerText = getMasterAtk();
  document.getElementById("hud-cores").innerText = gameState.keenCores;
}

// --- TILEMAP & OVERWORLD ---
// 0: Walkable, 1: Wall, 2: Blacksmith Anvil, 3: Danger Zone
const overworldMap = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,3,3,3,3,3,3,3,0,1],
  [1,0,2,0,0,0,1,0,0,0,0,3,3,3,3,3,3,3,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,3,3,0,3,3,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,3,3,0,3,3,1,1,1,1,0,0,0,0,0,0,0,0,0,1],
  [1,3,3,0,0,0,0,0,0,1,0,3,3,3,3,3,3,0,0,1],
  [1,3,3,0,0,0,0,0,0,1,0,3,3,3,3,3,3,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const playerSprite = SpriteGenerator.createEntitySprite("player", "#5e81ac");
const monsterSprite = SpriteGenerator.createEntitySprite("monster", "#bf616a");

function renderWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < overworldMap.length; r++) {
    for (let c = 0; c < overworldMap[r].length; c++) {
      const tile = overworldMap[r][c];
      if (tile === 0) ctx.fillStyle = "#2e3440";
      if (tile === 1) ctx.fillStyle = "#1b1d24";
      if (tile === 2) ctx.fillStyle = "#d08770"; // Anvil
      if (tile === 3) ctx.fillStyle = "#3b4252"; // Danger
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
  ctx.drawImage(playerSprite, gameState.playerX * TILE, gameState.playerY * TILE);
}

// --- TYPE ADVANTAGE SYSTEM ---
function calculateTypeMultiplier(attackerType, defenderType) {
  // Physical Triangle
  if (attackerType === "Sword" && defenderType === "Gauntlet") return 2.0;
  if (attackerType === "Gauntlet" && defenderType === "Lance") return 2.0;
  if (attackerType === "Lance" && defenderType === "Sword") return 2.0;

  // Arcane / Spiritual
  if (attackerType === "Talisman" && defenderType === "Staff") return 1.5;
  if (attackerType === "Staff" && defenderType === "Talisman") return 1.5;

  return 1.0;
}

// --- COMBAT RESOLUTION ---
function startEncounter() {
  gameState.inCombat = true;
  gameState.atkBuffMultiplier = 1.0;

  gameState.currentEnemy = {
    name: "Wild Centurion",
    type: "Sword",
    hp: 110,
    maxHp: 110,
    atk: 18,
    physicalResist: 0.10,
    spiritResist: 0.0,
    magicResist: -0.10 // 10% weakness to magic
  };

  document.getElementById("battle-overlay").classList.remove("hidden");
  updateBattleScreen();
  writeCombatLog(`Encountered a ${gameState.currentEnemy.name} (${gameState.currentEnemy.type})!`);
}

function updateBattleScreen() {
  const activeWp = gameState.pocket[gameState.activeIdx];
  document.getElementById("active-weapon-name").innerText = `${activeWp.name} (${activeWp.type})`;
  document.getElementById("active-weapon-mv").innerText = `MV: ${Math.round(activeWp.mv * 100)}% | Crit: ${Math.round(activeWp.critChance * 100)}%`;

  document.getElementById("player-hp-fill").style.width = `${(playerBattleHp / getMasterHp()) * 100}%`;
  document.getElementById("player-hp-text").innerText = `${Math.max(0, playerBattleHp)} / ${getMasterHp()}`;

  document.getElementById("enemy-name").innerText = gameState.currentEnemy.name;
  document.getElementById("enemy-type").innerText = gameState.currentEnemy.type;
  document.getElementById("enemy-hp-fill").style.width = `${(gameState.currentEnemy.hp / gameState.currentEnemy.maxHp) * 100}%`;
  document.getElementById("enemy-hp-text").innerText = `${Math.max(0, gameState.currentEnemy.hp)} / ${gameState.currentEnemy.maxHp}`;

  // Render attack buttons
  const movesContainer = document.getElementById("moves-container");
  movesContainer.innerHTML = "";
  activeWp.moves.forEach((move, i) => {
    const btn = document.createElement("button");
    btn.innerHTML = `<strong>${move.name}</strong><br><small>${move.cost}: ${move.currentStock}/${move.maxStock}</small>`;
    btn.disabled = move.currentStock <= 0;
    btn.onclick = () => executePlayerTurn(move);
    movesContainer.appendChild(btn);
  });
}

function writeCombatLog(msg) {
  document.getElementById("combat-log").innerText = msg;
}

function executePlayerTurn(move) {
  const activeWp = gameState.pocket[gameState.activeIdx];
  move.currentStock--;

  // Buff logic
  if (move.buff > 1.0) {
    gameState.atkBuffMultiplier = move.buff;
    writeCombatLog(`Used ${move.name}! Universal ATK boosted to ${Math.round(move.buff * 100)}%!`);
  }

  // Type Advantage
  const typeMult = calculateTypeMultiplier(activeWp.type, gameState.currentEnemy.type);

  // Resistance resolution
  let enemyResist = 0;
  if (["Sword", "Lance", "Gauntlet"].includes(activeWp.type)) enemyResist = gameState.currentEnemy.physicalResist;
  if (activeWp.type === "Talisman") enemyResist = gameState.currentEnemy.spiritResist;
  if (activeWp.type === "Staff") enemyResist = gameState.currentEnemy.magicResist;

  // Critical check
  const isCrit = Math.random() < activeWp.critChance;
  const critMult = isCrit ? 2.0 : 1.0;

  // Final damage calculation: Atk x MV x MovePower x Buff x (1 - Resist) x TypeAdv x Crit
  const rawDmg = (getMasterAtk() * 0.5) * activeWp.mv * (move.power / 10) * gameState.atkBuffMultiplier * (1 - enemyResist) * typeMult * critMult;
  const finalDamage = Math.max(1, Math.floor(rawDmg));

  gameState.currentEnemy.hp -= finalDamage;
  updateBattleScreen();

  let report = `Dealt ${finalDamage} damage with ${move.name}!`;
  if (typeMult > 1.0) report += " (Type Advantage!)";
  if (isCrit) report += " [CRITICAL HIT!]";
  writeCombatLog(report);

  if (gameState.currentEnemy.hp <= 0) {
    setTimeout(victory, 1000);
    return;
  }

  // Enemy Counter-attack
  setTimeout(() => {
    // Enemy damages player mitigated by armor
    const incomingDmg = Math.floor(gameState.currentEnemy.atk * (1 - gameState.armorResist));
    playerBattleHp -= incomingDmg;
    updateBattleScreen();
    writeCombatLog(`${gameState.currentEnemy.name} attacks! You took ${incomingDmg} damage.`);

    if (playerBattleHp <= 0) {
      setTimeout(() => {
        alert("Your consciousness fades... Rescuers drag you to the forge.");
        playerBattleHp = getMasterHp();
        gameState.playerX = 4;
        gameState.playerY = 4;
        endBattle();
      }, 1000);
    }
  }, 800);
}

function victory() {
  writeCombatLog("Victory! Enemy dropped 1 Keen Core!");
  gameState.keenCores++;
  updateHud();
  setTimeout(endBattle, 1200);
}

function endBattle() {
  gameState.inCombat = false;
  document.getElementById("battle-overlay").classList.add("hidden");
  updateHud();
  renderWorld();
}

// Draw weapon from the 5-weapon spatial pocket
document.getElementById("btn-open-weapons").onclick = () => {
  const pocketMenu = document.getElementById("pocket-menu");
  const pocketList = document.getElementById("pocket-list");
  pocketList.innerHTML = "";
  pocketMenu.classList.remove("hidden");

  gameState.pocket.forEach((wp, idx) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<span><strong>${wp.name}</strong> (${wp.type}) - MV: ${Math.round(wp.mv * 100)}%</span>`;
    const drawBtn = document.createElement("button");
    drawBtn.innerText = idx === gameState.activeIdx ? "Drawn" : "Draw";
    drawBtn.disabled = idx === gameState.activeIdx;
    drawBtn.onclick = () => {
      gameState.activeIdx = idx;
      pocketMenu.classList.add("hidden");
      writeCombatLog(`Drew ${wp.name} from the spatial dimension! Enemy counter-attacks on swap!`);
      // Weapon swap consumes turn
      setTimeout(() => {
        const incomingDmg = Math.floor(gameState.currentEnemy.atk * (1 - gameState.armorResist));
        playerBattleHp -= incomingDmg;
        updateBattleScreen();
      }, 600);
    };
    row.appendChild(drawBtn);
    pocketList.appendChild(row);
  });
};

document.getElementById("btn-close-pocket").onclick = () => {
  document.getElementById("pocket-menu").classList.add("hidden");
};

document.getElementById("btn-flee").onclick = () => {
  if (Math.random() < 0.6) {
    writeCombatLog("Retreated successfully!");
    setTimeout(endBattle, 500);
  } else {
    writeCombatLog("Escape failed! The enemy strikes!");
    playerBattleHp -= Math.floor(gameState.currentEnemy.atk * (1 - gameState.armorResist));
    updateBattleScreen();
  }
};

// --- WORKSHOP / BLACKSMITH (CRUCIBLE) ---
function openWorkshop() {
  const modal = document.getElementById("workshop-modal");
  const inv = document.getElementById("workshop-inventory");
  inv.innerHTML = "";
  modal.classList.remove("hidden");

  gameState.pocket.forEach(wp => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<span><strong>${wp.name}</strong> | Crit: ${Math.round(wp.critChance * 100)}% (${wp.keenCoresUsed}/4 Cores)</span>`;
    
    const infuseBtn = document.createElement("button");
    infuseBtn.innerText = "Infuse Core (+25% Crit)";
    infuseBtn.disabled = gameState.keenCores <= 0 || wp.keenCoresUsed >= 4;
    infuseBtn.onclick = () => {
      gameState.keenCores--;
      wp.keenCoresUsed++;
      wp.critChance += 0.25;
      updateHud();
      openWorkshop(); // Re-render
    };
    row.appendChild(infuseBtn);
    inv.appendChild(row);
  });
}

document.getElementById("btn-reforge-all").onclick = () => {
  gameState.pocket.forEach(wp => {
    wp.moves.forEach(m => m.currentStock = m.maxStock);
  });
  playerBattleHp = getMasterHp();
  updateHud();
  alert("All weapon move stocks refreshed & master HP replenished!");
};

document.getElementById("btn-close-workshop").onclick = () => {
  document.getElementById("workshop-modal").classList.add("hidden");
};

// --- INPUT LOOP ---
window.addEventListener("keydown", (e) => {
  if (gameState.inCombat) return;

  let dx = 0;
  let dy = 0;
  if (e.key === "ArrowUp" || e.key === "w") dy = -1;
  if (e.key === "ArrowDown" || e.key === "s") dy = 1;
  if (e.key === "ArrowLeft" || e.key === "a") dx = -1;
  if (e.key === "ArrowRight" || e.key === "d") dx = 1;

  const targetX = gameState.playerX + dx;
  const targetY = gameState.playerY + dy;

  if (overworldMap[targetY] && overworldMap[targetY][targetX] !== undefined) {
    const tile = overworldMap[targetY][targetX];
    if (tile !== 1) {
      gameState.playerX = targetX;
      gameState.playerY = targetY;
      renderWorld();

      if (tile === 2) {
        openWorkshop();
      } else if (tile === 3 && Math.random() < 0.25) {
        startEncounter();
      }
    }
  }
});

// Initial boot
updateHud();
renderWorld();
