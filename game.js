const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;

// =========================
// UI
// =========================

const uiEl = document.getElementById("ui");
const levelEl = document.getElementById("level");
const healthEl = document.getElementById("health");
const sizeEl = document.getElementById("size");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");

// =========================
// AUDIO
// =========================

// Theme music intentionally removed.
// Background music is optional.
// If bgm.mp3 does not exist, the game will still work.

const bgm = new Audio("bgm.mp3");
bgm.loop = true;
bgm.volume = 0.45;

// =========================
// GAME STATE
// =========================

let gameState = "title";

let score = 0;
let level = 1;

let cameraX = 0;

let keys = {};
let frame = 0;

let particles = [];
let enemies = [];
let foods = [];
let tomatoes = [];

let boss = null;

let bossSpawned = false;
let levelTransitioning = false;

let lastEnemySpawn = 0;

const MAX_TOMATOES = 12;
const MAX_PARTICLES = 250;

let levelLength = 3800;

// =========================
// PLAYER
// =========================

const player = {
  x: 150,
  y: 400,

  baseWidth: 44,
  baseHeight: 80,

  scale: 1,

  vx: 0,
  vy: 0,

  speed: 4.6,
  jumpPower: -13.5,

  onGround: false,

  health: 100,
  maxHealth: 100,

  facing: 1,

  invincible: 0,

  attackCooldown: 0,
  attackAnim: 0,

  walkCycle: 0
};

// =========================
// INPUT
// =========================

window.addEventListener("keydown", function (e) {

  const key = e.key.toLowerCase();

  // Prevent browser scrolling from Space / arrows
  if (
    key === " " ||
    key === "arrowup" ||
    key === "arrowdown" ||
    key === "arrowleft" ||
    key === "arrowright"
  ) {
    e.preventDefault();
  }

  // Prevent key-repeat from triggering actions repeatedly
  const wasAlreadyDown = keys[key];

  keys[key] = true;

  // Start game
  if (gameState === "title") {
    startGame();
    return;
  }

  // Restart
  if (
    (gameState === "gameover" || gameState === "victory") &&
    key === "r"
  ) {
    startGame();
    return;
  }

  // Shoot only on initial key press
  if (
    gameState === "playing" &&
    !wasAlreadyDown &&
    (key === "j" || key === "k" || key === "enter")
  ) {
    shootTomato();
  }
});

window.addEventListener("keyup", function (e) {
  keys[e.key.toLowerCase()] = false;
});

// =========================
// UTILITY
// =========================

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function showMessage(text, duration = 2000) {

  messageEl.textContent = text;
  messageEl.style.display = "block";

  if (duration < 90000) {

    setTimeout(function () {

      if (gameState === "playing") {
        messageEl.style.display = "none";
      }

    }, duration);
  }
}

function spawnParticles(x, y, color, count = 12) {

  // Prevent unlimited particle accumulation
  if (particles.length >= MAX_PARTICLES) {
    return;
  }

  const available = MAX_PARTICLES - particles.length;
  const amount = Math.min(count, available);

  for (let i = 0; i < amount; i++) {

    particles.push({
      x: x,
      y: y,

      vx: rand(-5, 5),
      vy: rand(-7, 2),

      life: rand(20, 45),
      maxLife: 45,

      color: color,
      size: rand(3, 7)
    });
  }
}

// =========================
// DRAWING
// =========================

function drawCloud(x, y, s = 1) {

  ctx.fillStyle = "rgba(255,255,255,0.85)";

  ctx.beginPath();

  ctx.arc(x, y, 28 * s, 0, Math.PI * 2);
  ctx.arc(x + 25 * s, y - 8 * s, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 50 * s, y, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 25 * s, y + 10 * s, 20 * s, 0, Math.PI * 2);

  ctx.fill();
}

// =========================
// PLAYER
// =========================

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

  const walking =
    player.onGround &&
    Math.abs(player.vx) > 0.3;

  if (walking) {
    player.walkCycle += 0.17;
  }

  const legSwing =
    walking
      ? Math.sin(player.walkCycle) * 8 * s
      : 0;

  const armSwing =
    walking
      ? Math.sin(player.walkCycle) * 6 * s
      : 0;

  const attacking =
    player.attackAnim > 0;

  const attackArm =
    attacking
      ? 18 * s
      : 0;

  // Legs
  ctx.fillStyle = "#ffb6c1";

  ctx.fillRect(
    x + w * 0.27 + legSwing * 0.35,
    y + h * 0.58,
    w * 0.19,
    h * 0.42
  );

  ctx.fillRect(
    x + w * 0.54 - legSwing * 0.35,
    y + h * 0.58,
    w * 0.19,
    h * 0.42
  );

  // Dress
  ctx.fillStyle = "#ff69b4";

  ctx.beginPath();

  ctx.moveTo(
    x + w * 0.16,
    y + h * 0.30
  );

  ctx.quadraticCurveTo(
    x + w * 0.5,
    y + h * 0.26,
    x + w * 0.84,
    y + h * 0.30
  );

  ctx.lineTo(
    x + w * 0.97,
    y + h * 0.70
  );

  ctx.quadraticCurveTo(
    x + w * 0.5,
    y + h * 0.78,
    x + w * 0.03,
    y + h * 0.70
  );

  ctx.closePath();
  ctx.fill();

  // Dress highlight
  ctx.fillStyle = "rgba(255,255,255,0.22)";

  ctx.beginPath();

  ctx.moveTo(
    x + w * 0.28,
    y + h * 0.33
  );

  ctx.lineTo(
    x + w * 0.55,
    y + h * 0.31
  );

  ctx.lineTo(
    x + w * 0.48,
    y + h * 0.55
  );

  ctx.lineTo(
    x + w * 0.26,
    y + h * 0.55
  );

  ctx.fill();

  // Arms
  ctx.fillStyle = "#ffb6c1";

  ctx.fillRect(
    x + w * 0.10,
    y + h * 0.35 + armSwing * 0.3,
    w * 0.14,
    h * 0.27
  );

  ctx.fillRect(
    x + w * 0.76 + attackArm,
    y + h * 0.35 - armSwing * 0.3,
    w * 0.14,
    h * 0.27
  );

  // Head
  ctx.fillStyle = "#ffb6c1";

  ctx.beginPath();

  ctx.arc(
    x + w / 2,
    y + h * 0.21,
    w * 0.28,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Hair
  ctx.fillStyle = "#6b3a1f";

  ctx.beginPath();

  ctx.arc(
    x + w / 2,
    y + h * 0.16,
    w * 0.32,
    Math.PI * 1.05,
    Math.PI * 1.95
  );

  ctx.fill();

  ctx.beginPath();

  ctx.ellipse(
    x + w * 0.20,
    y + h * 0.27,
    w * 0.11,
    h * 0.15,
    -0.3,
    0,
    Math.PI * 2
  );

  ctx.ellipse(
    x + w * 0.80,
    y + h * 0.27,
    w * 0.11,
    h * 0.15,
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
    y + h * 0.19,
    5.2 * s,
    6.2 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.ellipse(
    x + w * 0.62,
    y + h * 0.19,
    5.2 * s,
    6.2 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#222";

  ctx.beginPath();

  ctx.arc(
    x + w * 0.38 + player.facing * 1.2,
    y + h * 0.19,
    2.6 * s,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + w * 0.62 + player.facing * 1.2,
    y + h * 0.19,
    2.6 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Cheeks
  ctx.fillStyle = "rgba(255,120,140,0.4)";

  ctx.beginPath();

  ctx.arc(
    x + w * 0.29,
    y + h * 0.25,
    4.5 * s,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + w * 0.71,
    y + h * 0.25,
    4.5 * s,
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
    y + h * 0.26,
    6.5 * s,
    0.15,
    Math.PI - 0.15
  );

  ctx.stroke();

  // Tomato gun
  ctx.fillStyle = "#555";

  ctx.fillRect(
    x + w * 0.78 + attackArm,
    y + h * 0.38,
    22 * s,
    8 * s
  );

  ctx.fillStyle = "#c0392b";

  ctx.beginPath();

  ctx.arc(
    x + w * 0.78 +
      attackArm +
      22 * s,
    y + h * 0.42,
    7 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();

  // Damage flash
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

// =========================
// TOMATO
// =========================

function drawTomato(t) {

  const x = t.x - cameraX;

  ctx.fillStyle = "#e74c3c";

  ctx.beginPath();

  ctx.arc(
    x,
    t.y,
    11,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#27ae60";

  ctx.beginPath();

  ctx.ellipse(
    x,
    t.y - 9,
    6,
    4,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

// =========================
// ENEMY
// =========================

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

  ctx.strokeStyle =
    "rgba(0,0,0,0.3)";

  ctx.lineWidth = 2;
  ctx.stroke();

  // Eyes
  ctx.fillStyle = "#fff";

  ctx.beginPath();

  ctx.arc(
    x + e.w * 0.33,
    e.y + e.h * 0.35,
    6,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + e.w * 0.67,
    e.y + e.h * 0.35,
    6,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#111";

  ctx.beginPath();

  ctx.arc(
    x + e.w * 0.33,
    e.y + e.h * 0.35,
    3,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + e.w * 0.67,
    e.y + e.h * 0.35,
    3,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

// =========================
// BOSS
// =========================

function drawBoss() {

  if (!boss) return;

  const x = boss.x - cameraX;
  const y = boss.y;

  ctx.fillStyle = boss.color;

  ctx.beginPath();

  ctx.ellipse(
    x + boss.w / 2,
    y + boss.h / 2,
    boss.w / 2,
    boss.h / 2,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Stem
  ctx.fillStyle = "#27ae60";

  ctx.fillRect(
    x + boss.w / 2 - 8,
    y - 25,
    16,
    30
  );

  // Leaves
  ctx.beginPath();

  ctx.ellipse(
    x + boss.w / 2 - 18,
    y - 15,
    14,
    8,
    -0.5,
    0,
    Math.PI * 2
  );

  ctx.ellipse(
    x + boss.w / 2 + 18,
    y - 15,
    14,
    8,
    0.5,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Eyes
  ctx.fillStyle = "#fff";

  ctx.beginPath();

  ctx.arc(
    x + boss.w * 0.32,
    y + boss.h * 0.32,
    12,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + boss.w * 0.68,
    y + boss.h * 0.32,
    12,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#c0392b";

  ctx.beginPath();

  ctx.arc(
    x + boss.w * 0.32,
    y + boss.h * 0.32,
    6,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + boss.w * 0.68,
    y + boss.h * 0.32,
    6,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Boss health bar
  const barWidth = 220;
  const barHeight = 14;

  const barX =
    canvas.width / 2 -
    barWidth / 2;

  const barY = 20;

  ctx.fillStyle = "#222";

  ctx.fillRect(
    barX,
    barY,
    barWidth,
    barHeight
  );

  ctx.fillStyle = "#e74c3c";

  ctx.fillRect(
    barX,
    barY,
    barWidth *
      Math.max(
        0,
        boss.hp / boss.maxHp
      ),
    barHeight
  );

  ctx.strokeStyle = "#fff";
  ctx.strokeRect(
    barX,
    barY,
    barWidth,
    barHeight
  );

  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    boss.name,
    canvas.width / 2,
    barY + 12
  );
}

// =========================
// FOOD
// =========================

function drawFood(f) {

  const x = f.x - cameraX;

  ctx.fillStyle = "#e67e22";

  ctx.beginPath();

  ctx.ellipse(
    x + 16,
    f.y + 14,
    18,
    13,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#f39c12";

  ctx.fillRect(
    x + 8,
    f.y + 6,
    16,
    8
  );

  // Steam
  ctx.fillStyle =
    "rgba(255,255,255,0.5)";

  ctx.beginPath();

  ctx.arc(
    x + 12,
    f.y - 2,
    3,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + 22,
    f.y - 6,
    2.5,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

// =========================
// SHOOTING
// =========================

function shootTomato() {

  if (gameState !== "playing") {
    return;
  }

  if (player.attackCooldown > 0) {
    return;
  }

  // Prevent projectile buildup
  if (tomatoes.length >= MAX_TOMATOES) {
    return;
  }

  player.attackCooldown = 18;
  player.attackAnim = 12;

  const s = player.scale;

  const startX =
    player.x +
    (player.facing === 1
      ? 50
      : -20) * s;

  const startY =
    player.y + 35 * s;

  tomatoes.push({
    x: startX,
    y: startY,

    vx: player.facing * 11,

    life: 90
  });
}

// =========================
// FOOD
// =========================

function createFood(x, y) {

  foods.push({
    x: x,
    y: y,

    vy: -3.2,

    life: 800
  });
}

// =========================
// ENEMIES
// =========================

function spawnEnemy() {

  const colors = [
    "#e74c3c",
    "#27ae60",
    "#f1c40f",
    "#8e44ad",
    "#e67e22"
  ];

  enemies.push({

    x:
      player.x +
      780 +
      rand(0, 150),

    y: 430,

    w: 48,
    h: 48,

    hp:
      35 +
      level * 12,

    speed:
      1.1 +
      Math.random() * 0.6,

    color:
      colors[
        randInt(
          0,
          colors.length - 1
        )
      ]
  });
}

// =========================
// BOSS
// =========================

function spawnBoss() {

  if (boss || bossSpawned) {
    return;
  }

  bossSpawned = true;

  const bosses = [

    {
      name: "Giant Tomato Tyrant",
      color: "#c0392b",
      hp: 280
    },

    {
      name: "Broccoli Behemoth",
      color: "#27ae60",
      hp: 380
    },

    {
      name: "Pumpkin Overlord",
      color: "#e67e22",
      hp: 520
    }

  ];

  const b =
    bosses[level - 1] ||
    bosses[0];

  boss = {

    x:
      levelLength + 200,

    y: 340,

    w: 140,
    h: 150,

    hp: b.hp,
    maxHp: b.hp,

    color: b.color,

    speed: 1.05,

    name: b.name
  };

  showMessage(
    `BOSS: ${b.name}`,
    2200
  );
}

// =========================
// LEVEL TRANSITION
// =========================

function nextLevel() {

  if (levelTransitioning) {
    return;
  }

  levelTransitioning = true;

  level++;

  if (level > 3) {

    gameState = "victory";

    bgm.pause();

    showMessage(
      "YOU WIN!\nLovey is delighted!\n\nPress R to play again",
      99999
    );

    return;
  }

  player.x = 150;
  player.y = 400;

  player.vx = 0;
  player.vy = 0;

  player.health =
    player.maxHealth;

  cameraX = 0;

  enemies = [];
  foods = [];
  tomatoes = [];
  particles = [];

  boss = null;
  bossSpawned = false;

  levelLength =
    3800 +
    level * 500;

  lastEnemySpawn =
    performance.now();

  levelEl.textContent =
    level;

  showMessage(
    `Level ${level}`,
    1500
  );

  setTimeout(function () {

    levelTransitioning = false;

  }, 1600);
}

// =========================
// START / RESET
// =========================

function startGame() {

  gameState = "playing";

  uiEl.style.display = "block";

  messageEl.style.display =
    "none";

  // Reset player
  player.x = 150;
  player.y = 400;

  player.scale = 1;

  player.vx = 0;
  player.vy = 0;

  player.health =
    player.maxHealth;

  player.invincible = 0;

  player.attackCooldown = 0;
  player.attackAnim = 0;

  player.walkCycle = 0;

  player.facing = 1;

  // Reset world
  score = 0;
  level = 1;

  cameraX = 0;

  enemies = [];
  foods = [];
  tomatoes = [];
  particles = [];

  boss = null;

  bossSpawned = false;
  levelTransitioning = false;

  levelLength = 3800;

  lastEnemySpawn =
    performance.now();

  frame = 0;

  levelEl.textContent = "1";
  healthEl.textContent = "100";
  sizeEl.textContent = "1.0";
  scoreEl.textContent = "0";

  // Reset BGM
  bgm.pause();

  bgm.currentTime = 0;

  bgm.play().catch(function () {
    // Audio is optional.
  });

  showMessage(
    "Go!",
    900
  );
}

// =========================
// UPDATE
// =========================

function update() {

  // Title screen
  if (gameState === "title") {

    titleAlpha =
      Math.min(
        1,
        titleAlpha + 0.02
      );

    return;
  }

  // Game over / victory
  if (gameState !== "playing") {
    return;
  }

  frame++;

  // =====================
  // MOVEMENT
  // =====================

  player.vx = 0;

  if (
    keys["a"] ||
    keys["arrowleft"]
  ) {

    player.vx =
      -player.speed;

    player.facing = -1;
  }

  if (
    keys["d"] ||
    keys["arrowright"]
  ) {

    player.vx =
      player.speed;

    player.facing = 1;
  }

  // Jump
  if (
    (
      keys["w"] ||
      keys[" "] ||
      keys["arrowup"]
    ) &&
    player.onGround
  ) {

    player.vy =
      player.jumpPower;

    player.onGround = false;
  }

  player.x +=
    player.vx;

  // Keep player inside the level
  player.x =
    Math.max(
      0,
      Math.min(
        player.x,
        levelLength + 300
      )
    );

  // Gravity
  player.vy += 0.55;

  player.y +=
    player.vy;

  const groundY = 485;

  const playerH =
    player.baseHeight *
    player.scale;

  if (
    player.y +
      playerH >
    groundY
  ) {

    player.y =
      groundY -
      playerH;

    player.vy = 0;

    player.onGround = true;

  } else {

    player.onGround = false;
  }

  // Camera
  cameraX =
    Math.max(
      0,
      player.x - 300
    );

  // =====================
  // ATTACK COOLDOWN
  // =====================

  if (
    player.attackCooldown > 0
  ) {
    player.attackCooldown--;
  }

  if (
    player.attackAnim > 0
  ) {
    player.attackAnim--;
  }

  if (
    player.invincible > 0
  ) {
    player.invincible--;
  }

  // =====================
  // TOMATOES
  // =====================

  for (
    let i =
      tomatoes.length - 1;
    i >= 0;
    i--
  ) {

    const t =
      tomatoes[i];

    t.x += t.vx;

    t.life--;

    let tomatoHit = false;

    // Enemy collision
    for (
      let j =
        enemies.length - 1;
      j >= 0;
      j--
    ) {

      const e =
        enemies[j];

      const hit =
        Math.abs(
          t.x -
          (e.x + e.w / 2)
        ) < 28 &&
        Math.abs(
          t.y -
          (e.y + e.h / 2)
        ) < 28;

      if (hit) {

        e.hp -= 18;

        spawnParticles(
          t.x,
          t.y,
          "#e74c3c",
          8
        );

        tomatoHit = true;

        if (e.hp <= 0) {

          createFood(
            e.x,
            e.y
          );

          enemies.splice(
            j,
            1
          );

          score += 40;
        }

        break;
      }
    }

    // Boss collision
    if (
      !tomatoHit &&
      boss
    ) {

      const hitBoss =
        Math.abs(
          t.x -
          (boss.x + boss.w / 2)
        ) < 60 &&
        Math.abs(
          t.y -
          (boss.y + boss.h / 2)
        ) < 60;

      if (hitBoss) {

        boss.hp -= 14;

        spawnParticles(
          t.x,
          t.y,
          "#e74c3c",
          10
        );

        tomatoHit = true;

        if (
          boss.hp <= 0 &&
          !levelTransitioning
        ) {

          createFood(
            boss.x,
            boss.y
          );

          score += 400;

          showMessage(
            "Boss Defeated!",
            2000
          );

          boss = null;

          levelTransitioning =
            true;

          setTimeout(
            nextLevel,
            2200
          );
        }
      }
    }

    // Remove tomato
    if (
      tomatoHit ||
      t.life <= 0 ||
      t.x <
        cameraX - 200 ||
      t.x >
        cameraX +
          canvas.width +
          300
    ) {

      tomatoes.splice(
        i,
        1
      );
    }
  }

  // =====================
  // ENEMY SPAWNING
  // =====================

  const now =
    performance.now();

  const spawnDelay =
    4800 +
    level * 600;

  if (
    now -
      lastEnemySpawn >
      spawnDelay &&
    player.x <
      levelLength - 500 &&
    enemies.length < 8
  ) {

    spawnEnemy();

    lastEnemySpawn =
      now;
  }

  // =====================
  // ENEMY MOVEMENT
  // =====================

  enemies.forEach(
    function (e) {

      if (
        e.x >
        player.x
      ) {

        e.x -=
          e.speed;

      } else {

        e.x +=
          e.speed;
      }
    }
  );

  // =====================
  // BOSS MOVEMENT
  // =====================

  if (boss) {

    if (
      boss.x >
      player.x
    ) {

      boss.x -=
        boss.speed;

    } else {

      boss.x +=
        boss.speed;
    }
  }

  // Spawn boss once
  if (
    !boss &&
    !bossSpawned &&
    !levelTransitioning &&
    player.x >
      levelLength - 150
  ) {

    spawnBoss();
  }

  // =====================
  // FOOD
  // =====================

  const pw =
    player.baseWidth *
    player.scale;

  const ph =
    player.baseHeight *
    player.scale;

  for (
    let i =
      foods.length - 1;
    i >= 0;
    i--
  ) {

    const f =
      foods[i];

    f.y +=
      f.vy;

    f.vy +=
      0.22;

    if (
      f.y >
      groundY - 25
    ) {

      f.y =
        groundY - 25;

      f.vy = 0;
    }

    f.life--;

    if (
      f.life <= 0
    ) {

      foods.splice(
        i,
        1
      );

      continue;
    }

    const foodHit =
      Math.abs(
        (f.x + 16) -
        (player.x + pw / 2)
      ) <
        pw / 2 + 25 &&
      Math.abs(
        (f.y + 12) -
        (player.y + ph / 2)
      ) <
        ph / 2 + 25;

    if (foodHit) {

      player.scale +=
        0.14;

      player.health =
        Math.min(
          player.maxHealth,
          player.health + 20
        );

      score += 30;

      foods.splice(
        i,
        1
      );

      spawnParticles(
        player.x + pw / 2,
        player.y + ph / 2,
        "#f39c12",
        16
      );

      showMessage(
        "+Size!",
        600
      );

      if (
        player.scale > 5
      ) {

        gameState =
          "gameover";

        bgm.pause();

        spawnParticles(
          player.x,
          player.y,
          "#ff6699",
          70
        );

        showMessage(
          "POP!\nShe got too big!\n\nPress R to restart",
          99999
        );
      }
    }
  }

  // =====================
  // ENEMY DAMAGE
  // =====================

  enemies.forEach(
    function (e) {

      if (
        player.invincible <= 0 &&
        Math.abs(
          (e.x + e.w / 2) -
          (player.x + pw / 2)
        ) <
          pw / 2 + 25 &&
        Math.abs(
          (e.y + e.h / 2) -
          (player.y + ph / 2)
        ) <
          ph / 2 + 25
      ) {

        player.health -= 10;

        player.invincible =
          50;

        spawnParticles(
          player.x,
          player.y,
          "#ff3333",
          8
        );

        if (
          player.health <= 0
        ) {

          gameState =
            "gameover";

          bgm.pause();

          showMessage(
            "Game Over\n\nPress R to restart",
            99999
          );
        }
      }
    }
  );

  // =====================
  // BOSS DAMAGE
  // =====================

  if (
    boss &&
    player.invincible <= 0 &&
    Math.abs(
      (boss.x + boss.w / 2) -
      (player.x + pw / 2)
    ) <
      pw / 2 + 50 &&
    Math.abs(
      (boss.y + boss.h / 2) -
      (player.y + ph / 2)
    ) <
      ph / 2 + 50
  ) {

    player.health -= 16;

    player.invincible =
      60;

    if (
      player.health <= 0
    ) {

      gameState =
        "gameover";

      bgm.pause();

      showMessage(
        "Game Over\n\nPress R to restart",
        99999
      );
    }
  }

  // =====================
  // PARTICLES
  // =====================

  for (
    let i =
      particles.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      particles[i];

    p.x += p.vx;
    p.y += p.vy;

    p.vy +=
      0.15;

    p.life--;

    if (
      p.life <= 0
    ) {

      particles.splice(
        i,
        1
      );
    }
  }

  // =====================
  // UI
  // =====================

  healthEl.textContent =
    Math.max(
      0,
      Math.floor(
        player.health
      )
    );

  sizeEl.textContent =
    player.scale.toFixed(1);

  scoreEl.textContent =
    score;
}

// =========================
// TITLE SCREEN
// =========================

function drawTitleScreen() {

  const grd =
    ctx.createLinearGradient(
      0,
      0,
      0,
      canvas.height
    );

  grd.addColorStop(
    0,
    "#7ec8e3"
  );

  grd.addColorStop(
    1,
    "#d4f0c8"
  );

  ctx.fillStyle = grd;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  drawCloud(
    180,
    90,
    1.1
  );

  drawCloud(
    720,
    70,
    1
  );

  drawCloud(
    450,
    130,
    0.9
  );

  ctx.globalAlpha =
    titleAlpha;

  ctx.fillStyle =
    "#ff69b4";

  ctx.strokeStyle =
    "#fff";

  ctx.lineWidth = 6;

  ctx.font =
    "bold 72px Segoe UI, Arial";

  ctx.textAlign =
    "center";

  ctx.strokeText(
    "Lovey's Delight",
    canvas.width / 2,
    210
  );

  ctx.fillText(
    "Lovey's Delight",
    canvas.width / 2,
    210
  );

  ctx.font =
    "22px Segoe UI, Arial";

  ctx.fillStyle =
    "#333";

  ctx.fillText(
    "A growing adventure",
    canvas.width / 2,
    260
  );

  ctx.font =
    "20px Segoe UI, Arial";

  ctx.fillStyle =
    "#222";

  ctx.fillText(
    "Press any key to start",
    canvas.width / 2,
    370
  );

  ctx.font =
    "16px Segoe UI, Arial";

  ctx.fillText(
    "A/D or Arrows = Move   •   Space = Jump   •   J/K = Shoot Tomatoes",
    canvas.width / 2,
    420
  );

  ctx.fillText(
    "R = Restart after Game Over",
    canvas.width / 2,
    450
  );

  ctx.globalAlpha = 1;
}

// =========================
// MAIN DRAW
// =========================

function draw() {

  if (
    gameState === "title"
  ) {

    drawTitleScreen();

    return;
  }

  // Background
  const grd =
    ctx.createLinearGradient(
      0,
      0,
      0,
      canvas.height
    );

  grd.addColorStop(
    0,
    "#7ec8e3"
  );

  grd.addColorStop(
    0.7,
    "#b5e8c8"
  );

  grd.addColorStop(
    1,
    "#d4f0c8"
  );

  ctx.fillStyle = grd;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Clouds
  for (
    let i = 0;
    i < 6;
    i++
  ) {

    const cx =
      (
        i * 320 -
        cameraX * 0.15
      ) %
        1400 -
      100;

    drawCloud(
      cx,
      70 + (i % 3) * 30,
      0.9 +
        (i % 2) * 0.25
    );
  }

  // Hills
  ctx.fillStyle =
    "#7bc67b";

  for (
    let i = 0;
    i < 8;
    i++
  ) {

    const hx =
      i * 300 -
      (
        cameraX * 0.25
      ) %
        2400;

    ctx.beginPath();

    ctx.ellipse(
      hx,
      510,
      170,
      90,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.fillStyle =
    "#5aaa5a";

  for (
    let i = 0;
    i < 6;
    i++
  ) {

    const hx =
      i * 360 -
      (
        cameraX * 0.4
      ) %
        2160;

    ctx.beginPath();

    ctx.ellipse(
      hx,
      535,
      200,
      105,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  // Ground
  ctx.fillStyle =
    "#4a8c3a";

  ctx.fillRect(
    0,
    485,
    canvas.width,
    115
  );

  // Grass
  ctx.strokeStyle =
    "#3d7a30";

  ctx.lineWidth = 2;

  for (
    let i = 0;
    i < canvas.width;
    i += 16
  ) {

    const gx =
      i -
      (
        cameraX % 16
      );

    ctx.beginPath();

    ctx.moveTo(
      gx,
      485
    );

    ctx.lineTo(
      gx + 2,
      473
    );

    ctx.lineTo(
      gx + 6,
      485
    );

    ctx.stroke();
  }

  // Objects
  foods.forEach(
    drawFood
  );

  tomatoes.forEach(
    drawTomato
  );

  enemies.forEach(
    drawEnemy
  );

  drawBoss();

  drawPlayer();

  // Particles
  particles.forEach(
    function (p) {

      ctx.globalAlpha =
        p.life /
        p.maxLife;

      ctx.fillStyle =
        p.color;

      ctx.beginPath();

      ctx.arc(
        p.x - cameraX,
        p.y,
        p.size,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  );

  ctx.globalAlpha = 1;
}

// =========================
// MAIN LOOP
// =========================

function loop() {

  update();

  draw();

  requestAnimationFrame(
    loop
  );
}

// Start
loop();
