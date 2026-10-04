const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 600;

// UI elements
const uiEl = document.getElementById('ui');
const levelEl = document.getElementById('level');
const healthEl = document.getElementById('health');
const sizeEl = document.getElementById('size');
const scoreEl = document.getElementById('score');
const weaponEl = document.getElementById('weapon');
const inventoryEl = document.getElementById('inventory');
const messageEl = document.getElementById('message');

// ===== AUDIO =====
const themeMusic = new Audio('theme.mp3');
themeMusic.loop = true;
themeMusic.volume = 0.55;

const bgm = new Audio('bgm.mp3');
bgm.loop = true;
bgm.volume = 0.45;

// Game state
let gameState = 'title';
let score = 0;
let level = 1;
let cameraX = 0;
let keys = {};
let particles = [];
let lastEnemySpawn = 0;
let levelLength = 3500;
let frame = 0;
let titleAlpha = 0;

// Weapon types
const WEAPON_TYPES = [
  { name: "Spark Wand", power: 15, type: "fire", color: "#ff6600" },
  { name: "Frost Rod", power: 18, type: "ice", color: "#66ccff" },
  { name: "Thunder Staff", power: 22, type: "electric", color: "#ffff00" },
  { name: "Shadow Blade", power: 20, type: "dark", color: "#9900ff" },
  { name: "Holy Mace", power: 25, type: "light", color: "#ffffff" },
  { name: "Poison Dagger", power: 12, type: "poison", color: "#33cc33" },
  { name: "Boom Stick", power: 30, type: "explosive", color: "#ff0000" }
];

// Enemy types
const ENEMY_TYPES = [
  { name: "Slime", color: "#44aa44", hp: 40, speed: 1.2, weak: "fire", strong: "ice" },
  { name: "Ice Bat", color: "#88ccff", hp: 35, speed: 2.0, weak: "fire", strong: "electric" },
  { name: "Flame Imp", color: "#ff4422", hp: 50, speed: 1.5, weak: "ice", strong: "fire" },
  { name: "Shadow Wolf", color: "#333344", hp: 60, speed: 1.8, weak: "light", strong: "dark" },
  { name: "Thunder Bug", color: "#ffff66", hp: 45, speed: 2.2, weak: "poison", strong: "electric" }
];

// Player
const player = {
  x: 150,
  y: 400,
  baseWidth: 42,
  baseHeight: 78,
  scale: 1.0,
  vx: 0,
  vy: 0,
  speed: 4.5,
  jumpPower: -13,
  onGround: false,
  health: 100,
  maxHealth: 100,
  facing: 1,
  weapons: [null, null],
  currentSlot: 0,
  invincible: 0,
  attackCooldown: 0,
  attackAnim: 0,
  walkCycle: 0
};

let enemies = [];
let weapons = [];
let foods = [];
let boss = null;

// Input
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;

  if (gameState === 'title') {
    startGame();
  }

  if (gameState === 'playing') {
    if (e.key === '1') player.currentSlot = 0;
    if (e.key === '2') player.currentSlot = 1;
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function showMessage(text, duration = 2000) {
  messageEl.textContent = text;
  messageEl.style.display = 'block';

  if (duration < 90000) {
    setTimeout(() => {
      if (gameState === 'playing') {
        messageEl.style.display = 'none';
      }
    }, duration);
  }
}

function spawnParticles(x, y, color, count = 14) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: rand(-5, 5),
      vy: rand(-7, 2),
      life: rand(25, 50),
      maxLife: 50,
      color,
      size: rand(3, 8)
    });
  }
}

function getCurrentWeapon() {
  return player.weapons[player.currentSlot];
}

function updateInventoryUI() {
  const w1 = player.weapons[0] ? player.weapons[0].name : "-";
  const w2 = player.weapons[1] ? player.weapons[1].name : "-";

  inventoryEl.textContent = `Inventory: ${w1} | ${w2}`;

  const current = getCurrentWeapon();
  weaponEl.textContent = current
    ? `Weapon: ${current.name}`
    : "Weapon: None";
}

// ========== DRAWING ==========

function drawCloud(x, y, scale = 1) {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();

  ctx.arc(x, y, 28 * scale, 0, Math.PI * 2);
  ctx.arc(x + 25 * scale, y - 8 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.arc(x + 50 * scale, y, 26 * scale, 0, Math.PI * 2);
  ctx.arc(x + 25 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);

  ctx.fill();
}

function drawPlayer() {
  const s = player.scale;
  const w = player.baseWidth * s;
  const h = player.baseHeight * s;

  const x = player.x - cameraX;
  const y = player.y;

  ctx.save();

  if (player.facing === -1) {
    ctx.translate(x + w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), 0);
  }

  const walk = player.onGround && Math.abs(player.vx) > 0.3;

  if (walk) {
    player.walkCycle += 0.18;
  }

  const legSwing = walk
    ? Math.sin(player.walkCycle) * 9 * s
    : 0;

  const armSwing = walk
    ? Math.sin(player.walkCycle) * 7 * s
    : 0;

  const attacking = player.attackAnim > 0;
  const attackArm = attacking ? 25 * s : 0;

  // Legs
  ctx.fillStyle = "#ffb6c1";

  ctx.fillRect(
    x + w * 0.28 + legSwing * 0.4,
    y + h * 0.58,
    w * 0.18,
    h * 0.42
  );

  ctx.fillRect(
    x + w * 0.54 - legSwing * 0.4,
    y + h * 0.58,
    w * 0.18,
    h * 0.42
  );

  // Dress
  ctx.fillStyle = "#ff69b4";

  ctx.beginPath();
  ctx.moveTo(x + w * 0.18, y + h * 0.32);

  ctx.quadraticCurveTo(
    x + w * 0.5,
    y + h * 0.28,
    x + w * 0.82,
    y + h * 0.32
  );

  ctx.lineTo(x + w * 0.95, y + h * 0.72);

  ctx.quadraticCurveTo(
    x + w * 0.5,
    y + h * 0.78,
    x + w * 0.05,
    y + h * 0.72
  );

  ctx.closePath();
  ctx.fill();

  // Dress highlight
  ctx.fillStyle = "rgba(255,255,255,0.25)";

  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + h * 0.35);
  ctx.lineTo(x + w * 0.55, y + h * 0.33);
  ctx.lineTo(x + w * 0.5, y + h * 0.55);
  ctx.lineTo(x + w * 0.28, y + h * 0.55);
  ctx.closePath();
  ctx.fill();

  // Arms
  ctx.fillStyle = "#ffb6c1";

  ctx.fillRect(
    x + w * 0.12,
    y + h * 0.36 + armSwing * 0.3,
    w * 0.13,
    h * 0.28
  );

  ctx.fillRect(
    x + w * 0.75 + attackArm * 0.4,
    y + h * 0.36 - armSwing * 0.3,
    w * 0.13,
    h * 0.28
  );

  // Head
  ctx.fillStyle = "#ffb6c1";

  ctx.beginPath();
  ctx.arc(
    x + w / 2,
    y + h * 0.22,
    w * 0.29,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Hair
  ctx.fillStyle = "#6b3a1f";

  ctx.beginPath();
  ctx.arc(
    x + w / 2,
    y + h * 0.17,
    w * 0.33,
    Math.PI * 1.05,
    Math.PI * 1.95
  );
  ctx.fill();

  ctx.beginPath();

  ctx.ellipse(
    x + w * 0.22,
    y + h * 0.28,
    w * 0.12,
    h * 0.16,
    -0.3,
    0,
    Math.PI * 2
  );

  ctx.ellipse(
    x + w * 0.78,
    y + h * 0.28,
    w * 0.12,
    h * 0.16,
    0.3,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Eyes
  ctx.fillStyle = "#fff";

  ctx.beginPath();

  ctx.ellipse(
    x + w * 0.38,
    y + h * 0.20,
    5.5 * s,
    6.5 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.ellipse(
    x + w * 0.62,
    y + h * 0.20,
    5.5 * s,
    6.5 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#333";

  ctx.beginPath();

  ctx.arc(
    x + w * 0.38 + player.facing * 1.5,
    y + h * 0.20,
    2.8 * s,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + w * 0.62 + player.facing * 1.5,
    y + h * 0.20,
    2.8 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Cheeks
  ctx.fillStyle = "rgba(255,120,140,0.45)";

  ctx.beginPath();

  ctx.arc(
    x + w * 0.30,
    y + h * 0.26,
    5 * s,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + w * 0.70,
    y + h * 0.26,
    5 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Smile
  ctx.strokeStyle = "#c45c6a";
  ctx.lineWidth = 2 * s;

  ctx.beginPath();

  ctx.arc(
    x + w / 2,
    y + h * 0.27,
    7 * s,
    0.15,
    Math.PI - 0.15
  );

  ctx.stroke();

  // Weapon
  const current = getCurrentWeapon();

  if (current) {
    ctx.fillStyle = current.color;

    ctx.fillRect(
      x + w * 0.82 + attackArm,
      y + h * 0.38,
      9 * s,
      28 * s
    );

    ctx.fillStyle = "#ddd";

    ctx.fillRect(
      x + w * 0.82 + attackArm,
      y + h * 0.38,
      9 * s,
      5 * s
    );
  }

  ctx.restore();

  if (
    player.invincible > 0 &&
    Math.floor(player.invincible / 4) % 2 === 0
  ) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#fff";

    ctx.fillRect(
      x - 5,
      y - 5,
      w + 10,
      h + 10
    );

    ctx.globalAlpha = 1;
  }
}

function drawEnemy(e) {
  const x = e.x - cameraX;

  ctx.fillStyle = e.color;

  ctx.beginPath();

  ctx.ellipse(
    x + e.w / 2,
    e.y + e.h / 2,
    e.w / 2,
    e.h / 2,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#fff";

  ctx.beginPath();

  ctx.arc(
    x + e.w * 0.32,
    e.y + e.h * 0.32,
    7,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + e.w * 0.68,
    e.y + e.h * 0.32,
    7,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#111";

  ctx.beginPath();

  ctx.arc(
    x + e.w * 0.32,
    e.y + e.h * 0.32,
    3.5,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + e.w * 0.68,
    e.y + e.h * 0.32,
    3.5,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawBoss() {
  if (!boss) return;

  const x = boss.x - cameraX;

  ctx.fillStyle = boss.color;

  ctx.beginPath();

  ctx.ellipse(
    x + boss.w / 2,
    boss.y + boss.h / 2,
    boss.w / 2,
    boss.h / 2,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#ffd700";

  for (let i = 0; i < 5; i++) {
    const sx = x + boss.w * (0.15 + i * 0.17);

    ctx.beginPath();
    ctx.moveTo(sx, boss.y - 5);
    ctx.lineTo(sx + 10, boss.y - 28);
    ctx.lineTo(sx + 20, boss.y - 5);
    ctx.fill();
  }

  ctx.fillStyle = "#ff2222";

  ctx.beginPath();

  ctx.arc(
    x + boss.w * 0.32,
    boss.y + boss.h * 0.28,
    11,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + boss.w * 0.68,
    boss.y + boss.h * 0.28,
    11,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

// ========== GAME LOGIC ==========

function createFood(x, y) {
  foods.push({
    x,
    y,
    w: 32,
    h: 26,
    vy: -3.5,
    life: 700
  });
}

function spawnWeaponDrop(x, y) {
  const type =
    WEAPON_TYPES[randInt(0, WEAPON_TYPES.length - 1)];

  weapons.push({
    x,
    y,
    w: 30,
    h: 30,
    type: { ...type },
    vy: -2.5
  });
}

function playerAttack() {
  const current = getCurrentWeapon();

  if (player.attackCooldown > 0 || !current) return;

  player.attackCooldown = 22;
  player.attackAnim = 18;

  const range = 85 * player.scale;
  const damage = current.power;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    if (
      Math.abs(e.x - player.x) < range + e.w &&
      Math.abs(e.y - player.y) < 70
    ) {
      let mult = 1;
      let feedback = "";

      if (e.weak === current.type) {
        mult = 2.1;
        feedback = "STRONG!";
      }

      if (e.strong === current.type) {
        mult = 0.35;
        feedback = "Weak...";
      }

      e.hp -= damage * mult;

      spawnParticles(
        e.x + e.w / 2,
        e.y + e.h / 2,
        current.color,
        12
      );

      if (feedback) {
        showMessage(feedback, 700);
      }

      if (e.hp <= 0) {
        createFood(e.x, e.y);
        enemies.splice(i, 1);
        score += 50;
      }
    }
  }

  if (
    boss &&
    Math.abs(boss.x - player.x) < range + boss.w
  ) {
    let mult =
      boss.weak === current.type ? 1.9 : 1;

    if (mult > 1.5) {
      showMessage("STRONG!", 700);
    }

    boss.hp -= damage * mult;

    spawnParticles(
      boss.x + boss.w / 2,
      boss.y + boss.h / 2,
      current.color,
      18
    );

    if (boss.hp <= 0) {
      createFood(boss.x, boss.y);
      boss = null;
      score += 500;

      showMessage(
        "Boss Defeated!\nLevel Complete!",
        2500
      );

      setTimeout(nextLevel, 2600);
    }
  }
}

function nextLevel() {
  level++;

  if (level > 3) {
    gameState = 'victory';
    bgm.pause();

    showMessage(
      "YOU WIN!\nLovey is delighted!",
      99999
    );

    return;
  }

  levelEl.textContent = level;

  player.x = 150;
  cameraX = 0;

  enemies = [];
  weapons = [];
  foods = [];
  boss = null;

  levelLength = 3500 + level * 450;

  showMessage(`Level ${level}`, 1600);
}

function spawnBoss() {
  const bosses = [
    {
      name: "Glutton King",
      color: "#aa6622",
      hp: 320,
      weak: "fire"
    },
    {
      name: "Frost Queen",
      color: "#66aaff",
      hp: 420,
      weak: "fire"
    },
    {
      name: "Shadow Overlord",
      color: "#220033",
      hp: 580,
      weak: "light"
    }
  ];

  const b = bosses[level - 1] || bosses[0];

  boss = {
    x: levelLength + 220,
    y: 360,
    w: 130,
    h: 150,
    hp: b.hp,
    maxHp: b.hp,
    color: b.color,
    weak: b.weak,
    speed: 1.15
  };

  showMessage(`BOSS: ${b.name}`, 2500);
}

function startGame() {
  gameState = 'playing';

  uiEl.style.display = 'block';
  messageEl.style.display = 'none';

  themeMusic.pause();
  themeMusic.currentTime = 0;

  bgm.currentTime = 0;
  bgm.play().catch(() => {});

  player.x = 150;
  player.y = 400;
  player.scale = 1.0;
  player.health = 100;
  player.weapons = [null, null];
  player.currentSlot = 0;
  player.invincible = 0;

  score = 0;
  level = 1;

  levelEl.textContent = "1";

  cameraX = 0;

  enemies = [];
  weapons = [];
  foods = [];
  boss = null;

  levelLength = 3500;

  updateInventoryUI();

  showMessage("Go!", 1000);
}

function update() {
  if (gameState === 'title') {
    titleAlpha = Math.min(1, titleAlpha + 0.02);
    return;
  }

  if (gameState !== 'playing') return;

  frame++;

  // Movement
  player.vx = 0;

  if (keys['a'] || keys['arrowleft']) {
    player.vx = -player.speed;
    player.facing = -1;
  }

  if (keys['d'] || keys['arrowright']) {
    player.vx = player.speed;
    player.facing = 1;
  }

  if (
    (keys['w'] ||
      keys['arrowup'] ||
      keys[' ']) &&
    player.onGround
  ) {
    player.vy = player.jumpPower;
    player.onGround = false;
  }

  player.x += player.vx;

  player.vy += 0.55;
  player.y += player.vy;

  const groundY = 485;

  if (
    player.y +
      player.baseHeight * player.scale >
    groundY
  ) {
    player.y =
      groundY -
      player.baseHeight * player.scale;

    player.vy = 0;
    player.onGround = true;
  }

  cameraX = Math.max(0, player.x - 320);

  if (
    keys['j'] ||
    keys['k'] ||
    keys['enter']
  ) {
    playerAttack();
  }

  if (player.attackCooldown > 0) {
    player.attackCooldown--;
  }

  if (player.attackAnim > 0) {
    player.attackAnim--;
  }

  if (player.invincible > 0) {
    player.invincible--;
  }

  // Enemy spawn
  if (
    Date.now() - lastEnemySpawn >
      2100 + level * 280 &&
    player.x < levelLength - 450
  ) {
    const type =
      ENEMY_TYPES[
        randInt(0, ENEMY_TYPES.length - 1)
      ];

    enemies.push({
      x: player.x + 720 + rand(0, 180),
      y: groundY - 55,
      w: 52,
      h: 52,
      hp: type.hp + level * 12,
      speed:
        type.speed *
        (0.9 + Math.random() * 0.3),
      color: type.color,
      weak: type.weak,
      strong: type.strong
    });

    lastEnemySpawn = Date.now();
  }

  enemies.forEach(e => {
    const dir =
      e.x > player.x ? -1 : 1;

    e.x += dir * e.speed;
  });

  if (boss) {
    boss.x +=
      boss.x > player.x
        ? -boss.speed
        : boss.speed;
  }

  if (
    !boss &&
    player.x > levelLength - 120
  ) {
    spawnBoss();
  }

  // Weapon pickup
  for (
    let i = weapons.length - 1;
    i >= 0;
    i--
  ) {
    const w = weapons[i];

    w.y += w.vy;
    w.vy += 0.22;

    if (w.y > groundY - 32) {
      w.y = groundY - 32;
      w.vy = 0;
    }

    if (
      Math.abs(w.x - player.x) < 45 &&
      Math.abs(w.y - player.y) < 55
    ) {
      if (!player.weapons[0]) {
        player.weapons[0] = w.type;
        player.currentSlot = 0;
      } else if (!player.weapons[1]) {
        player.weapons[1] = w.type;
        player.currentSlot = 1;
      } else {
        player.weapons[player.currentSlot] =
          w.type;
      }

      updateInventoryUI();

      weapons.splice(i, 1);

      showMessage(
        `Got ${w.type.name}!`,
        1100
      );
    }
  }

  // Food → GROW
  for (
    let i = foods.length - 1;
    i >= 0;
    i--
  ) {
    const f = foods[i];

    f.y += f.vy;
    f.vy += 0.25;

    if (f.y > groundY - 28) {
      f.y = groundY - 28;
      f.vy = 0;
    }

    f.life--;

    if (f.life <= 0) {
      foods.splice(i, 1);
      continue;
    }

    if (
      Math.abs(f.x - player.x) < 48 &&
      Math.abs(f.y - player.y) < 60
    ) {
      player.scale += 0.13;

      player.health = Math.min(
        player.maxHealth,
        player.health + 18
      );

      score += 35;

      foods.splice(i, 1);

      spawnParticles(
        player.x,
        player.y + 20,
        "#ffaa55",
        20
      );

      showMessage("+Size!", 700);

      if (player.scale > 4.9) {
        gameState = 'gameover';

        bgm.pause();

        spawnParticles(
          player.x,
          player.y,
          "#ff6699",
          80
        );

        showMessage(
          "POP!\nShe got too big...",
          99999
        );
      }
    }
  }

  if (Math.random() < 0.0028) {
    spawnWeaponDrop(
      player.x + rand(420, 750),
      180
    );
  }

  // Collisions
  enemies.forEach(e => {
    if (
      player.invincible <= 0 &&
      Math.abs(e.x - player.x) <
        42 * player.scale &&
      Math.abs(e.y - player.y) <
        55 * player.scale
    ) {
      player.health -= 11;
      player.invincible = 45;

      spawnParticles(
        player.x,
        player.y,
        "#ff3333",
        10
      );

      if (player.health <= 0) {
        gameState = 'gameover';
        bgm.pause();
        showMessage("Game Over", 99999);
      }
    }
  });

  if (
    boss &&
    player.invincible <= 0 &&
    Math.abs(boss.x - player.x) < 75 &&
    Math.abs(boss.y - player.y) < 90
  ) {
    player.health -= 18;
    player.invincible = 55;

    if (player.health <= 0) {
      gameState = 'gameover';
      bgm.pause();
      showMessage("Game Over", 99999);
    }
  }

  // Particles
  for (
    let i = particles.length - 1;
    i >= 0;
    i--
  ) {
    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.16;
    p.life--;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // UI
  healthEl.textContent =
    Math.max(0, Math.floor(player.health));

  sizeEl.textContent =
    player.scale.toFixed(1);

  scoreEl.textContent = score;
}

function drawTitleScreen() {
  const grd =
    ctx.createLinearGradient(
      0,
      0,
      0,
      canvas.height
    );

  grd.addColorStop(0, "#7ec8e3");
  grd.addColorStop(1, "#d4f0c8");

  ctx.fillStyle = grd;
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  drawCloud(150, 100, 1.2);
  drawCloud(700, 80, 1.0);
  drawCloud(400, 140, 0.9);

  ctx.globalAlpha = titleAlpha;

  ctx.fillStyle = "#ff69b4";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 6;

  ctx.font =
    "bold 72px Segoe UI, Arial";

  ctx.textAlign = "center";

  ctx.strokeText(
    "Lovey's Delight",
    canvas.width / 2,
    220
  );

  ctx.fillText(
    "Lovey's Delight",
    canvas.width / 2,
    220
  );

  ctx.font =
    "24px Segoe UI, Arial";

  ctx.fillStyle = "#333";

  ctx.fillText(
    "A growing adventure",
    canvas.width / 2,
    270
  );

  ctx.font =
    "20px Segoe UI, Arial";

  ctx.fillStyle = "#222";

  ctx.fillText(
    "Press any key to start",
    canvas.width / 2,
    380
  );

  ctx.font =
    "16px Segoe UI, Arial";

  ctx.fillText(
    "A/D or Arrows = Move  •  Space = Jump  •  J/K = Attack  •  1/2 = Switch Weapon",
    canvas.width / 2,
    430
  );

  ctx.globalAlpha = 1;
}

function draw() {
  if (gameState === 'title') {
    drawTitleScreen();
    return;
  }

  // Sky
  const grd =
    ctx.createLinearGradient(
      0,
      0,
      0,
      canvas.height
    );

  grd.addColorStop(0, "#7ec8e3");
  grd.addColorStop(0.7, "#b5e8c8");
  grd.addColorStop(1, "#d4f0c8");

  ctx.fillStyle = grd;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Clouds
  for (let i = 0; i < 6; i++) {
    const cx =
      (i * 320 -
        cameraX * 0.15) %
        1400 -
      100;

    drawCloud(
      cx,
      70 + (i % 3) * 35,
      0.9 + (i % 2) * 0.3
    );
  }

  // Hills
  ctx.fillStyle = "#7bc67b";

  for (let i = 0; i < 9; i++) {
    const hx =
      i * 280 -
      (cameraX * 0.25) % 2520;

    ctx.beginPath();

    ctx.ellipse(
      hx,
      510,
      160,
      85,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.fillStyle = "#5aaa5a";

  for (let i = 0; i < 7; i++) {
    const hx =
      i * 340 -
      (cameraX * 0.4) % 2380;

    ctx.beginPath();

    ctx.ellipse(
      hx,
      530,
      190,
      100,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  // Ground
  ctx.fillStyle = "#4a8c3a";

  ctx.fillRect(
    0,
    485,
    canvas.width,
    115
  );

  // Grass
  ctx.strokeStyle = "#3d7a30";
  ctx.lineWidth = 2;

  for (
    let i = 0;
    i < canvas.width;
    i += 18
  ) {
    const gx =
      i - (cameraX % 18);

    ctx.beginPath();

    ctx.moveTo(gx, 485);
    ctx.lineTo(gx + 3, 472);
    ctx.lineTo(gx + 7, 485);

    ctx.stroke();
  }

  // Foods
  foods.forEach(f => {
    const fx = f.x - cameraX;

    ctx.fillStyle = "#e67e22";

    ctx.beginPath();

    ctx.ellipse(
      fx + 16,
      f.y + 13,
      17,
      13,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#f39c12";

    ctx.fillRect(
      fx + 9,
      f.y + 6,
      15,
      7
    );
  });

  // Weapon drops
  weapons.forEach(w => {
    const wx = w.x - cameraX;

    ctx.fillStyle = w.type.color;

    ctx.beginPath();

    ctx.roundRect(
      wx,
      w.y,
      28,
      28,
      6
    );

    ctx.fill();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  enemies.forEach(drawEnemy);

  drawBoss();
  drawPlayer();

  // Particles
  particles.forEach(p => {
    ctx.globalAlpha =
      p.life / p.maxLife;

    ctx.fillStyle = p.color;

    ctx.beginPath();

    ctx.arc(
      p.x - cameraX,
      p.y,
      p.size,
      0,
      Math.PI * 2
    );

    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Try to start title music
themeMusic.play().catch(() => {});

loop();
