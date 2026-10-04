
/*
LOVEY'S DELIGHT
Full enhanced game.js
- Growth up to 12x, followed by a dramatic "too big" explosion
- Tomato, Pea, Potato, Pizza and Kitten weapons
- Occasional weapon drops with rarity
- Auto-aim for all weapons
- Six themed levels
- Multiple enemy types and bosses
- Fictional final boss: Andre
- Particles, damage numbers, screen shake, transitions
*/
"use strict";
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = 1000;
const HEIGHT = 600;
const GROUND_Y = 485;
const MAX_SCALE = 12;
const FOOD_GROWTH = 0.42;
canvas.width = WIDTH;
canvas.height = HEIGHT;
const bgm = document.getElementById("bgm");
if (bgm) {
bgm.volume = 0.28;
bgm.loop = true;
}
const ui = {
startScreen: document.getElementById("startScreen"),
startButton: document.getElementById("startButton"),
gameOver: document.getElementById("gameOver"),
restartButton: document.getElementById("restartButton"),
score: document.getElementById("score"),
level: document.getElementById("level"),
health: document.getElementById("health"),
growth: document.getElementById("growth"),
weapon: document.getElementById("weapon"),
inventory: document.getElementById("inventory")
};
const keys = {};
let gameState = "title";
let score = 0;
let level = 1;
let cameraX = 0;
let worldTime = 0;
let levelTimer = 0;
let titleAlpha = 0;
let transitionTimer = 0;
let transitionText = "";
let gameOverReason = "";
let screenShake = 0;
let combo = 0;
let comboTimer = 0;
let spawnTimer = 0;
let foodTimer = 0;
let weaponTimer = 0;
let boss = null;
let bossSpawned = false;
let levelComplete = false;
let explosionTimer = 0;
let growthWarning = false;
const particles = [];
const projectiles = [];
const enemies = [];
const foods = [];
const weaponDrops = [];
const damageNumbers = [];
const LEVEL_THEMES = [
{
name: "Garden",
skyTop: "#8fd8ff",
skyBottom: "#eaf9ff",
hill1: "#7acb78",
hill2: "#55ae67",
ground: "#67a94d",
grass: "#3f873f",
accent: "#ff8fb1",
enemyNames: ["carrot", "pea", "tomato"],
boss: "tomato"
},
{
name: "Enchanted Forest",
skyTop: "#a9c9ef",
skyBottom: "#eef0ff",
hill1: "#789c83",
hill2: "#527361",
ground: "#46664d",
grass: "#34553e",
accent: "#d8a7ff",
enemyNames: ["mushroom", "pea", "broccoli"],
boss: "broccoli"
},
{
name: "Autumn Valley",
skyTop: "#f5b879",
skyBottom: "#ffe8bf",
hill1: "#b97a55",
hill2: "#87513f",
ground: "#76523f",
grass: "#5f4438",
accent: "#f4b24e",
enemyNames: ["pumpkin", "corn", "carrot"],
boss: "pumpkin"
},
{
name: "Twilight Woods",
skyTop: "#403d78",
skyBottom: "#8a6596",
hill1: "#403e5e",
hill2: "#2e3147",
ground: "#252b39",
grass: "#1d2430",
accent: "#91e6df",
enemyNames: ["mushroom", "tomato", "corn"],
boss: "corn"
},
{
name: "Dreamland",
skyTop: "#d5b8ff",
skyBottom: "#f8d9ee",
hill1: "#c89bc5",
hill2: "#a97cae",
ground: "#8f6c91",
grass: "#76547e",
accent: "#fff1a8",
enemyNames: ["pea", "mushroom", "pumpkin"],
boss: "mushroom"
},
{
name: "Andre's Realm",
skyTop: "#25263c",
skyBottom: "#55577b",
hill1: "#35364f",
hill2: "#23253a",
ground: "#1b1d2c",
grass: "#111522",
accent: "#c7b6ff",
enemyNames: ["shadow", "mushroom", "tomato"],
boss: "andre"
}
];
const WEAPONS = {
tomato: {
name: "Tomato Gun",
short: "Tomato",
damage: 22,
speed: 11,
fireRate: 17,
projectile: "tomato",
rarity: "starter",
homing: 0.035,
splash: 0,
size: 13
},
pea: {
name: "Pea Popper",
short: "Pea",
damage: 11,
speed: 14,
fireRate: 9,
projectile: "pea",
rarity: "common",
homing: 0.02,
splash: 0,
size: 8
},
potato: {
name: "Potato Cannon",
short: "Potato",
damage: 42,
speed: 9,
fireRate: 25,
projectile: "potato",
rarity: "uncommon",
homing: 0.04,
splash: 45,
size: 17
},
pizza: {
name: "Pizza Gun",
short: "Pizza",
damage: 78,
speed: 10,
fireRate: 31,
projectile: "pizza",
rarity: "rare",
homing: 0.07,
splash: 65,
size: 19
},
kitten: {
name: "Kitten Launcher",
short: "Kitten",
damage: 155,
speed: 9,
fireRate: 42,
projectile: "kitten",
rarity: "ultimate",
homing: 0.15,
splash: 90,
size: 23
}
};
const player = {
x: 180,
y: GROUND_Y - 86,
vx: 0,
vy: 0,
baseWidth: 58,
baseHeight: 86,
scale: 1,
speed: 4.5,
jumpPower: 12.5,
health: 100,
maxHealth: 100,
facing: 1,
onGround: true,
invincible: 0,
attackCooldown: 0,
attackAnim: 0,
walkCycle: 0,
aimAngle: 0,
currentWeapon: "tomato",
inventory: [],
hurtFlash: 0
};
const bossData = {
tomato: {
name: "Tomato Tyrant",
hp: 950,
width: 110,
height: 120,
color: "#e6504e"
},
broccoli: {
name: "Broccoli Behemoth",
hp: 1350,
width: 125,
height: 135,
color: "#4d9a57"
},
pumpkin: {
name: "Pumpkin Overlord",
hp: 1750,
width: 135,
height: 125,
color: "#e58a36"
},
corn: {
name: "Corn Colossus",
hp: 2150,
width: 125,
height: 155,
color: "#f1cf52"
},
mushroom: {
name: "Mushroom Monarch",
hp: 2600,
width: 145,
height: 150,
color: "#a35aa8"
},
andre: {
name: "ANDRE",
hp: 4200,
width: 105,
height: 185,
color: "#34364d"
}
};
const enemyStats = {
carrot: { hp: 65, speed: 1.25, damage: 8, size: 42, score: 30 },
pea: { hp: 48, speed: 1.65, damage: 6, size: 38, score: 25 },
tomato: { hp: 78, speed: 1.05, damage: 9, size: 47, score: 40 },
broccoli: { hp: 105, speed: 0.78, damage: 12, size: 58, score: 65 },
mushroom: { hp: 88, speed: 1.15, damage: 10, size: 52, score: 60 },
pumpkin: { hp: 150, speed: 0.68, damage: 16, size: 70, score: 90 },
corn: { hp: 120, speed: 1.0, damage: 13, size: 62, score: 75 },
shadow: { hp: 165, speed: 1.55, damage: 18, size: 58, score: 110 }
};
function clamp(value, min, max) {
return Math.max(min, Math.min(max, value));
}
function rand(min, max) {
return Math.random() * (max - min) + min;
}
function choose(array) {
return array[Math.floor(Math.random() * array.length)];
}
function worldX(x) {
return x - cameraX;
}
function addParticle(x, y, options = {}) {
particles.push({
x,
y,
vx: options.vx ?? rand(-2, 2),
vy: options.vy ?? rand(-3, 0),
life: options.life ?? rand(25, 50),
maxLife: options.life ?? 40,
size: options.size ?? rand(3, 8),
color: options.color ?? "#ffffff",
gravity: options.gravity ?? 0.08,
shape: options.shape ?? "circle",
alpha: 1,
rotation: rand(0, Math.PI * 2),
spin: rand(-0.12, 0.12)
});
}
function burst(x, y, color, count = 14, power = 3) {
for (let i = 0; i < count; i++) {
const angle = rand(0, Math.PI * 2);
const speed = rand(0.5, power);
addParticle(x, y, {
vx: Math.cos(angle) * speed,
vy: Math.sin(angle) * speed,
color,
size: rand(3, 8),
life: rand(25, 55)
});
}
}
function addDamageNumber(x, y, amount, critical = false) {
damageNumbers.push({
x,
y,
amount,
life: 48,
maxLife: 48,
critical
});
}
function setScreenShake(amount) {
screenShake = Math.max(screenShake, amount);
}
function getTheme() {
return LEVEL_THEMES[clamp(level - 1, 0, LEVEL_THEMES.length - 1)];
}
function getTarget(allowBehind = false) {
let best = null;
let bestScore = Infinity;
for (const enemy of enemies) {
if (enemy.dead) continue;
const dx = enemy.x - player.x;
const dy = enemy.y - player.y;
const distance = Math.hypot(dx, dy);
if (distance > 1050) continue;
if (!allowBehind && dx * player.facing < -80) continue;
let targetScore = distance;
if (enemy.isBoss) targetScore -= 350;
if (dx * player.facing > 0) targetScore -= 100;
if (targetScore < bestScore) {
bestScore = targetScore;
best = enemy;
}
}
if (boss && !boss.dead) {
const dx = boss.x - player.x;
if (allowBehind || dx * player.facing > -80) {
const distance = Math.hypot(dx, boss.y - player.y);
if (distance < 1200 && distance - 350 < bestScore) best = boss;
}
}
return best;
}
function weaponDamageFor(weaponKey) {
const weapon = WEAPONS[weaponKey];
return weapon ? weapon.damage : WEAPONS.tomato.damage;
}
function shootWeapon() {
if (player.attackCooldown > 0 || gameState !== "playing") return;
const weaponKey = player.currentWeapon;
const weapon = WEAPONS[weaponKey];
const target = getTarget(weaponKey === "kitten");
let angle = player.facing === 1 ? 0 : Math.PI;
if (target) {
const targetX = target.x;
const targetY = target.y - target.height * 0.35;
const origin = getMuzzlePosition();
angle = Math.atan2(targetY - origin.y, targetX - origin.x);
}
player.aimAngle = angle;
player.attackAnim = 9;
player.attackCooldown = weapon.fireRate;
const origin = getMuzzlePosition();
const speed = weapon.speed;
projectiles.push({
type: weapon.projectile,
weaponKey,
x: origin.x,
y: origin.y,
vx: Math.cos(angle) * speed,
vy: Math.sin(angle) * speed,
rotation: angle,
life: 150,
damage: weapon.damage,
homing: weapon.homing,
splash: weapon.splash,
size: weapon.size,
target: target,
hit: false
});
burst(origin.x, origin.y, weaponProjectileColor(weapon.projectile), 5, 1.5);
}
function weaponProjectileColor(type) {
return {
tomato: "#ef534f",
pea: "#74bd54",
potato: "#c4935c",
pizza: "#f0a23a",
kitten: "#f3c7d9"
}[type] || "#ffffff";
}
function getMuzzlePosition() {
const bodyW = player.baseWidth * player.scale;
const bodyH = player.baseHeight * player.scale;
const offset = clamp(bodyW * 0.58, 35, 470);
return {
x: player.x + player.facing * offset,
y: player.y + bodyH * 0.38
};
}
function drawProjectile(p) {
const sx = worldX(p.x);
const sy = p.y;
ctx.save();
ctx.translate(sx, sy);
ctx.rotate(p.rotation);
if (p.type === "tomato") {
ctx.fillStyle = "#ed514f";
ctx.beginPath();
ctx.arc(0, 0, p.size, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#3d8d4a";
ctx.beginPath();
ctx.ellipse(0, -p.size + 2, p.size * 0.45, p.size * 0.2, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "rgba(255,255,255,.35)";
ctx.beginPath();
ctx.arc(-p.size * 0.35, -p.size * 0.35, p.size * 0.25, 0, Math.PI * 2);
ctx.fill();
}
if (p.type === "pea") {
ctx.fillStyle = "#70bd4f";
ctx.beginPath();
ctx.arc(0, 0, p.size, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = "rgba(35,90,35,.35)";
ctx.lineWidth = 2;
ctx.stroke();
ctx.fillStyle = "rgba(255,255,255,.4)";
ctx.beginPath();
ctx.arc(-3, -3, 2, 0, Math.PI * 2);
ctx.fill();
}
if (p.type === "potato") {
ctx.fillStyle = "#bd8950";
ctx.beginPath();
ctx.ellipse(0, 0, p.size * 1.15, p.size * 0.78, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#76502f";
for (let i = 0; i < 4; i++) {
ctx.beginPath();
ctx.arc(rand(-8, 8), rand(-7, 7), 2, 0, Math.PI * 2);
ctx.fill();
}
}
if (p.type === "pizza") {
ctx.beginPath();
ctx.moveTo(p.size, 0);
ctx.lineTo(-p.size * 0.85, -p.size * 0.72);
ctx.lineTo(-p.size * 0.85, p.size * 0.72);
ctx.closePath();
ctx.fillStyle = "#f0a347";
ctx.fill();
ctx.strokeStyle = "#d57936";
ctx.lineWidth = 3;
ctx.stroke();
ctx.fillStyle = "#f5d26b";
ctx.beginPath();
ctx.arc(-p.size * 0.4, 0, p.size * 0.12, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#c94e4e";
for (const spot of [[-5,-6],[-5,7],[5,0]]) {
ctx.beginPath();
ctx.arc(spot[0], spot[1], p.size * 0.13, 0, Math.PI * 2);
ctx.fill();
}
}
if (p.type === "kitten") {
ctx.fillStyle = "#efc8d7";
ctx.beginPath();
ctx.arc(0, 0, p.size * 0.72, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.moveTo(-p.size * 0.55, -p.size * 0.45);
ctx.lineTo(-p.size * 0.25, -p.size * 1.05);
ctx.lineTo(0, -p.size * 0.55);
ctx.closePath();
ctx.fill();
ctx.beginPath();
ctx.moveTo(p.size * 0.05, -p.size * 0.55);
ctx.lineTo(p.size * 0.42, -p.size * 1.05);
ctx.lineTo(p.size * 0.62, -p.size * 0.38);
ctx.closePath();
ctx.fill();
ctx.fillStyle = "#5b4860";
ctx.beginPath();
ctx.arc(-p.size * 0.25, -p.size * 0.05, 2.5, 0, Math.PI * 2);
ctx.arc(p.size * 0.25, -p.size * 0.05, 2.5, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = "#8f687c";
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.moveTo(0, 3);
ctx.lineTo(-7, 5);
ctx.moveTo(0, 3);
ctx.lineTo(7, 5);
ctx.stroke();
ctx.strokeStyle = "rgba(255,255,255,.6)";
ctx.beginPath();
ctx.moveTo(-p.size * 0.8, p.size * 0.1);
ctx.quadraticCurveTo(-p.size * 1.2, -p.size * 0.2, -p.size * 0.9, -p.size * 0.55);
ctx.stroke();
}
ctx.restore();
}
function spawnEnemy(type) {
const stats = enemyStats[type] || enemyStats.carrot;
const x = player.x + rand(620, 1050);
enemies.push({
type,
x,
y: GROUND_Y - stats.size,
width: stats.size,
height: stats.size,
hp: stats.hp * (1 + (level - 1) * 0.13),
maxHp: stats.hp * (1 + (level - 1) * 0.13),
speed: stats.speed * (1 + (level - 1) * 0.045),
damage: stats.damage + level - 1,
score: stats.score,
dead: false,
isBoss: false,
bob: rand(0, Math.PI * 2),
hitFlash: 0,
attackTimer: rand(30, 100)
});
}
function spawnBoss() {
if (bossSpawned) return;
const theme = getTheme();
const data = bossData[theme.boss];
boss = {
type: theme.boss,
name: data.name,
x: player.x + 820,
y: GROUND_Y - data.height,
width: data.width,
height: data.height,
hp: data.hp,
maxHp: data.hp,
speed: theme.boss === "andre" ? 1.4 : 0.65 + level * 0.04,
dead: false,
isBoss: true,
phase: 1,
attackTimer: 80,
hitFlash: 0,
bob: 0
};
bossSpawned = true;
transitionText = data.name + "!";
transitionTimer = 120;
setScreenShake(8);
}
function spawnFood(x = null, y = null) {
const fx = x ?? (player.x + rand(450, 1000));
foods.push({
x: fx,
y: y ?? rand(270, 410),
type: choose(["berry", "apple", "cake", "star"]),
size: rand(15, 21),
bob: rand(0, Math.PI * 2),
collected: false
});
}
function spawnWeaponDrop(x, y) {
if (Math.random() > 0.18) return;
const roll = Math.random();
let type;
if (roll < 0.45) type = "pea";
else if (roll < 0.75) type = "potato";
else if (roll < 0.93) type = "pizza";
else type = "kitten";
weaponDrops.push({
x,
y: y - 20,
type,
size: 23,
bob: rand(0, Math.PI * 2),
life: 900
});
}
function collectFood(food) {
food.collected = true;
const oldScale = player.scale;
player.scale += FOOD_GROWTH;
score += 25;
combo = Math.min(99, combo + 1);
comboTimer = 120;
burst(food.x, food.y, "#ffb8d2", 20, 3);
addDamageNumber(food.x, food.y - 20, "+" + FOOD_GROWTH.toFixed(1) + "x", true);
setScreenShake(3);
if (player.scale >= MAX_SCALE) {
player.scale = MAX_SCALE;
growthWarning = true;
transitionText = "TOO BIG...";
transitionTimer = 70;
} else if (oldScale < 6 && player.scale >= 6) {
transitionText = "LOVEY IS HUGE!";
transitionTimer = 70;
}
}
function collectWeapon(drop) {
drop.life = 0;
const newWeapon = drop.type;
const oldWeapon = player.currentWeapon;
if (newWeapon !== oldWeapon && !player.inventory.includes(newWeapon)) {
if (player.inventory.length < 3) {
player.inventory.push(oldWeapon);
}
}
player.currentWeapon = newWeapon;
burst(drop.x, drop.y, weaponProjectileColor(WEAPONS[newWeapon].projectile), 28, 4);
addDamageNumber(drop.x, drop.y - 35, WEAPONS[newWeapon].name + "!", true);
score += 100;
setScreenShake(5);
}
function cycleWeapon(direction) {
const available = [player.currentWeapon, ...player.inventory];
if (available.length <= 1) return;
let index = available.indexOf(player.currentWeapon);
index = (index + direction + available.length) % available.length;
const next = available[index];
const old = player.currentWeapon;
if (next !== old) {
player.currentWeapon = next;
player.inventory = available.filter(w => w !== next).slice(0, 3);
}
}
function damageEnemy(enemy, damage, sourceX, sourceY, splash = 0) {
if (!enemy || enemy.dead) return;
enemy.hp -= damage;
enemy.hitFlash = 6;
addDamageNumber(enemy.x, enemy.y - enemy.height - 8, Math.round(damage), damage >= 70);
burst(sourceX, sourceY, weaponProjectileColor(player.currentWeapon === "kitten" ? "kitten" : "tomato"), 5, 1.3);
if (splash > 0) {
for (const other of enemies) {
if (other !== enemy && !other.dead && Math.hypot(other.x - enemy.x, other.y - enemy.y) < splash) {
other.hp -= damage * 0.45;
addDamageNumber(other.x, other.y - other.height, Math.round(damage * 0.45), false);
}
}
}
if (enemy.hp <= 0) {
killEnemy(enemy);
}
}
function killEnemy(enemy) {
if (enemy.dead) return;
enemy.dead = true;
score += enemy.score;
combo += 1;
comboTimer = 150;
const colorMap = {
carrot: "#f19a46",
pea: "#72bd56",
tomato: "#ef5754",
broccoli: "#62a866",
mushroom: "#b36ac1",
pumpkin: "#ed9b3e",
corn: "#f4d34e",
shadow: "#8d8fb7"
};
burst(enemy.x, enemy.y - enemy.height * 0.4, colorMap[enemy.type] || "#ffffff", 22, 4);
setScreenShake(enemy.isBoss ? 12 : 4);
spawnWeaponDrop(enemy.x, enemy.y - enemy.height);
if (Math.random() < 0.32) {
spawnFood(enemy.x, enemy.y - enemy.height - 10);
}
if (enemy.isBoss) {
boss = null;
levelComplete = true;
}
}
function damageBoss(amount) {
if (!boss || boss.dead) return;
boss.hp -= amount;
boss.hitFlash = 7;
addDamageNumber(boss.x, boss.y - 20, Math.round(amount), amount >= 70);
burst(boss.x, boss.y + boss.height * 0.3, "#fff0a6", 7, 2);
const ratio = boss.hp / boss.maxHp;
if (ratio < 0.66 && boss.phase === 1) {
boss.phase = 2;
transitionText = boss.type === "andre" ? "ANDRE: PHASE 2" : "PHASE 2!";
transitionTimer = 100;
setScreenShake(10);
burst(boss.x, boss.y + boss.height * 0.3, getTheme().accent, 45, 5);
}
if (ratio < 0.32 && boss.phase === 2) {
boss.phase = 3;
transitionText = boss.type === "andre" ? "ANDRE: FINAL PHASE" : "FINAL PHASE!";
transitionTimer = 110;
setScreenShake(14);
burst(boss.x, boss.y + boss.height * 0.3, "#ffffff", 55, 6);
}
if (boss.hp <= 0) {
boss.dead = true;
score += 1000 * level;
killEnemy(boss);
}
}
function triggerGrowthExplosion() {
if (gameState === "exploding" || gameState === "gameover") return;
gameState = "exploding";
explosionTimer = 0;
gameOverReason = "Lovey grew too big!";
setScreenShake(25);
for (let i = 0; i < 120; i++) {
const angle = rand(0, Math.PI * 2);
const speed = rand(2, 11);
addParticle(player.x, player.y + player.baseHeight * player.scale * 0.4, {
vx: Math.cos(angle) * speed,
vy: Math.sin(angle) * speed,
color: choose(["#ff91bb", "#ffd86e", "#ffffff", "#a7e8ff", "#d9a7ff"]),
size: rand(4, 14),
life: rand(55, 120),
gravity: 0.04,
shape: choose(["circle", "star"])
});
}
}
function playerHurt(damage) {
if (player.invincible > 0 || gameState !== "playing") return;
player.health -= damage;
player.invincible = 60;
player.hurtFlash = 10;
setScreenShake(8);
burst(player.x, player.y + player.baseHeight * player.scale * 0.4, "#ff8e9c", 18, 3);
if (player.health <= 0) {
player.health = 0;
gameState = "gameover";
gameOverReason = "Lovey got overwhelmed!";
}
}
function updatePlayer() {
const left = keys["ArrowLeft"] || keys["a"] || keys["A"];
const right = keys["ArrowRight"] || keys["d"] || keys["D"];
const jump = keys[" "] || keys["ArrowUp"] || keys["w"] || keys["W"];
if (left) {
player.vx -= 0.55;
player.facing = -1;
}
if (right) {
player.vx += 0.55;
player.facing = 1;
}
player.vx *= 0.82;
player.vx = clamp(player.vx, -player.speed, player.speed);
if (jump && player.onGround) {
player.vy = -player.jumpPower;
player.onGround = false;
}
player.vy += 0.58;
player.y += player.vy;
player.x += player.vx;
const bodyH = player.baseHeight * player.scale;
const groundTop = GROUND_Y - bodyH;
if (player.y >= groundTop) {
player.y = groundTop;
player.vy = 0;
player.onGround = true;
}
player.x = Math.max(80, player.x);
if (Math.abs(player.vx) > 0.15) {
player.walkCycle += 0.18;
}
if (player.invincible > 0) player.invincible--;
if (player.attackCooldown > 0) player.attackCooldown--;
if (player.attackAnim > 0) player.attackAnim--;
if (player.hurtFlash > 0) player.hurtFlash--;
if (growthWarning && player.scale >= MAX_SCALE) {
if (worldTime % 10 === 0) {
burst(
player.x + rand(-player.baseWidth * 4, player.baseWidth * 4),
player.y + rand(0, player.baseHeight * player.scale),
"#fff0a5",
2,
1
);
}
}
if (player.scale >= MAX_SCALE && !growthWarning) {
growthWarning = true;
}
}
function updateEnemies() {
for (const enemy of enemies) {
if (enemy.dead) continue;
enemy.bob += 0.06;
enemy.hitFlash = Math.max(0, enemy.hitFlash - 1);
enemy.attackTimer--;
const dx = player.x - enemy.x;
const distance = Math.abs(dx);
if (distance > 75) {
enemy.x += Math.sign(dx) * enemy.speed;
}
enemy.y = GROUND_Y - enemy.height + Math.sin(enemy.bob) * 3;
if (distance < (enemy.width + player.baseWidth * player.scale) * 0.42 && enemy.attackTimer <= 0) {
playerHurt(enemy.damage);
enemy.attackTimer = 80;
enemy.x += Math.sign(enemy.x - player.x) * 20;
}
}
}
function updateBoss() {
if (!boss || boss.dead) return;
boss.bob += 0.04;
boss.hitFlash = Math.max(0, boss.hitFlash - 1);
boss.attackTimer--;
const dx = player.x - boss.x;
const distance = Math.abs(dx);
if (boss.type === "andre") {
boss.y = GROUND_Y - boss.height + Math.sin(boss.bob) * 5;
if (distance > 330) {
boss.x += Math.sign(dx) * boss.speed * (boss.phase === 3 ? 1.7 : 1);
}
if (boss.phase === 2 && worldTime % 180 === 0) {
boss.x += Math.sign(dx) * 100;
burst(boss.x, boss.y + 80, "#8f8cae", 25, 3);
}
} else {
boss.y = GROUND_Y - boss.height + Math.sin(boss.bob) * 4;
if (distance > 250) boss.x += Math.sign(dx) * boss.speed;
}
if (boss.attackTimer <= 0) {
bossAttack();
boss.attackTimer = boss.type === "andre"
? Math.max(28, 90 - boss.phase * 15)
: Math.max(38, 110 - boss.phase * 12);
}
const contactDistance =
(boss.width + player.baseWidth * player.scale) * 0.38;
if (distance < contactDistance) {
playerHurt(boss.type === "andre" ? 20 + boss.phase * 5 : 14 + level * 2);
}
}
function bossAttack() {
if (!boss) return;
const targetX = player.x;
const targetY = player.y + player.baseHeight * player.scale * 0.35;
if (boss.type === "andre") {
const count = boss.phase === 3 ? 5 : boss.phase === 2 ? 3 : 2;
for (let i = 0; i < count; i++) {
const originX = boss.x - 35;
const originY = boss.y + 65;
const spread = (i - (count - 1) / 2) * 0.15;
const angle = Math.atan2(targetY - originY, targetX - originX) + spread;
projectiles.push({
type: "shadow",
weaponKey: "andre",
x: originX,
y: originY,
vx: Math.cos(angle) * (6 + boss.phase),
vy: Math.sin(angle) * (6 + boss.phase),
rotation: angle,
life: 150,
damage: 12 + boss.phase * 5,
homing: 0.015 * boss.phase,
splash: 0,
size: 13,
target: null,
hit: false,
enemyProjectile: true
});
}
burst(boss.x, boss.y + 70, "#817ea7", 10, 2);
return;
}
const angle = Math.atan2(
player.y + player.baseHeight * player.scale * 0.35 - boss.y - boss.height * 0.35,
player.x - boss.x
);
projectiles.push({
type: "shadow",
weaponKey: "boss",
x: boss.x,
y: boss.y + boss.height * 0.35,
vx: Math.cos(angle) * (5 + level * 0.25),
vy: Math.sin(angle) * (5 + level * 0.25),
rotation: angle,
life: 180,
damage: 10 + level * 2,
homing: 0.025 + boss.phase * 0.01,
splash: 0,
size: 15,
target: null,
hit: false,
enemyProjectile: true
});
}
function updateProjectiles() {
for (const p of projectiles) {
if (p.hit) continue;
p.life--;
if (p.life <= 0) {
p.hit = true;
continue;
}
if (p.enemyProjectile) {
const dx = player.x - p.x;
const dy = player.y + player.baseHeight * player.scale * 0.35 - p.y;
const angle = Math.atan2(dy, dx);
if (p.homing) {
const currentAngle = Math.atan2(p.vy, p.vx);
const newAngle = currentAngle + clamp(
angle - currentAngle,
-p.homing,
p.homing
);
const speed = Math.hypot(p.vx, p.vy);
p.vx = Math.cos(newAngle) * speed;
p.vy = Math.sin(newAngle) * speed;
p.rotation = newAngle;
}
p.x += p.vx;
p.y += p.vy;
const playerRadius = Math.max(
28,
player.baseWidth * player.scale * 0.35
);
if (Math.hypot(p.x - player.x, p.y - (player.y + player.baseHeight * player.scale * 0.35)) < playerRadius + p.size) {
p.hit = true;
playerHurt(p.damage);
burst(p.x, p.y, "#a09abf", 12, 2.5);
}
continue;
}
let target = p.target;
if (!target || target.dead || (target.hp !== undefined && target.hp <= 0)) {
target = getTarget(p.weaponKey === "kitten");
p.target = target;
}
if (target && p.homing > 0) {
const tx = target.x;
const ty = target.y - target.height * 0.3;
const desired = Math.atan2(ty - p.y, tx - p.x);
const current = Math.atan2(p.vy, p.vx);
const diff = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
const newAngle = current + clamp(diff, -p.homing, p.homing);
const speed = Math.hypot(p.vx, p.vy);
p.vx = Math.cos(newAngle) * speed;
p.vy = Math.sin(newAngle) * speed;
p.rotation = newAngle;
}
p.x += p.vx;
p.y += p.vy;
p.vy += p.type === "potato" ? 0.035 : 0;
for (const enemy of enemies) {
if (enemy.dead) continue;
const radius = p.size + Math.max(enemy.width, enemy.height) * 0.38;
if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < radius) {
p.hit = true;
damageEnemy(enemy, p.damage, p.x, p.y, p.splash);
projectileImpact(p);
break;
}
}
if (!p.hit && boss && !boss.dead) {
const radius = p.size + Math.max(boss.width, boss.height) * 0.38;
if (Math.hypot(p.x - boss.x, p.y - boss.y) < radius) {
p.hit = true;
damageBoss(p.damage);
projectileImpact(p);
}
}
}
while (projectiles.length > 180) projectiles.shift();
}
function projectileImpact(p) {
const color = weaponProjectileColor(p.type);
burst(p.x, p.y, color, p.type === "kitten" ? 20 : 9, p.type === "pizza" ? 3.5 : 2.2);
if (p.type === "kitten") {
for (let i = 0; i < 3; i++) {
addParticle(p.x, p.y, {
vx: rand(-2, 2),
vy: rand(-4, -1),
color: "#ffffff",
size: 5,
life: 35,
shape: "heart"
});
}
}
setScreenShake(p.type === "pizza" || p.type === "kitten" ? 5 : 2);
}
function updateFoods() {
for (const food of foods) {
if (food.collected) continue;
food.bob += 0.04;
const fy = food.y + Math.sin(food.bob) * 8;
const distance = Math.hypot(
food.x - player.x,
fy - (player.y + player.baseHeight * player.scale * 0.35)
);
if (distance < food.size + Math.max(30, player.baseWidth * player.scale * 0.35)) {
food.y = fy;
collectFood(food);
}
}
}
function updateWeaponDrops() {
for (const drop of weaponDrops) {
drop.life--;
drop.bob += 0.06;
const dy = Math.sin(drop.bob) * 7;
if (Math.hypot(drop.x - player.x, drop.y + dy - player.y) < drop.size + 45) {
collectWeapon(drop);
}
}
}
function updateParticles() {
for (const p of particles) {
p.x += p.vx;
p.y += p.vy;
p.vy += p.gravity;
p.life--;
p.rotation += p.spin;
p.alpha = clamp(p.life / p.maxLife, 0, 1);
}
while (particles.length && particles[0].life <= 0) particles.shift();
while (particles.length > 900) particles.shift();
}
function updateDamageNumbers() {
for (const d of damageNumbers) {
d.y -= 0.8;
d.life--;
}
while (damageNumbers.length && damageNumbers[0].life <= 0) damageNumbers.shift();
}
function updateSpawning() {
if (bossSpawned || levelComplete) return;
spawnTimer--;
foodTimer--;
weaponTimer--;
const spawnRate = Math.max(42, 105 - level * 9);
if (spawnTimer <= 0) {
const type = choose(getTheme().enemyNames);
spawnEnemy(type);
spawnTimer = spawnRate + rand(-15, 20);
}
if (foodTimer <= 0) {
spawnFood();
foodTimer = rand(260, 420);
}
if (weaponTimer <= 0) {
// A small chance to have a floating weapon pickup appear naturally too.
if (Math.random() < 0.18) {
const type = Math.random() < 0.6 ? "pea" : Math.random() < 0.75 ? "potato" : "pizza";
weaponDrops.push({
x: player.x + rand(500, 900),
y: rand(260, 410),
type,
size: 23,
bob: rand(0, Math.PI * 2),
life: 600
});
}
weaponTimer = rand(700, 1100);
}
if (player.x > level * 850 + 1300) {
spawnBoss();
}
}
function nextLevel() {
if (level >= LEVEL_THEMES.length) {
gameState = "victory";
transitionText = "LOVEY SAVED THE DELIGHT!";
transitionTimer = 9999;
return;
}
level++;
player.x = 180;
player.y = GROUND_Y - player.baseHeight * player.scale;
player.health = Math.min(player.maxHealth, player.health + 25);
cameraX = 0;
boss = null;
bossSpawned = false;
levelComplete = false;
spawnTimer = 30;
foodTimer = 90;
weaponTimer = 300;
transitionText = getTheme().name;
transitionTimer = 140;
enemies.length = 0;
projectiles.length = 0;
foods.length = 0;
weaponDrops.length = 0;
burst(player.x, player.y + 30, getTheme().accent, 55, 5);
}
function updateLevelProgress() {
if (levelComplete) {
if (!boss || boss.dead) {
transitionTimer--;
if (transitionTimer <= 0) {
nextLevel();
}
}
return;
}
}
function update() {
worldTime++;
if (gameState === "title") {
titleAlpha = Math.min(1, titleAlpha + 0.02);
return;
}
if (gameState === "playing") {
updatePlayer();
updateEnemies();
updateBoss();
updateProjectiles();
updateFoods();
updateWeaponDrops();
updateParticles();
updateDamageNumbers();
updateSpawning();
updateLevelProgress();
if (player.scale >= MAX_SCALE && growthWarning) {
// Give the player a brief visual moment at exactly 12x,
// then trigger the giant explosion.
if (worldTime % 80 === 0) {
triggerGrowthExplosion();
}
}
cameraX += (player.x - 260 - cameraX) * 0.08;
cameraX = Math.max(0, cameraX);
if (comboTimer > 0) comboTimer--;
else combo = 0;
screenShake *= 0.88;
}
if (gameState === "exploding") {
explosionTimer++;
if (explosionTimer % 4 === 0) {
const radius = explosionTimer * 8;
for (let i = 0; i < 5; i++) {
const angle = rand(0, Math.PI * 2);
addParticle(
player.x + Math.cos(angle) * radius,
player.y + player.baseHeight * player.scale * 0.4 + Math.sin(angle) * radius,
{
vx: Math.cos(angle) * rand(1, 5),
vy: Math.sin(angle) * rand(1, 5),
color: choose(["#ff9fc4", "#ffd36e", "#ffffff"]),
size: rand(5, 13),
life: 50
}
);
}
}
updateParticles();
updateDamageNumbers();
screenShake *= 0.92;
if (explosionTimer > 125) {
gameState = "gameover";
}
}
if (gameState === "gameover") {
updateParticles();
updateDamageNumbers();
}
if (transitionTimer > 0 && gameState === "playing") {
transitionTimer--;
}
}
function drawBackground() {
const theme = getTheme();
const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
gradient.addColorStop(0, theme.skyTop);
gradient.addColorStop(1, theme.skyBottom);
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, WIDTH, HEIGHT);
if (level === 1) drawSun(120, 100, 45);
if (level === 2) drawMoon(820, 90, 38);
if (level === 3) drawSun(140, 95, 48);
if (level === 4) drawStars();
if (level === 5) drawDreamOrbs();
if (level === 6) drawDarkStars();
drawParallaxHills(theme);
drawGround(theme);
drawDecor(theme);
}
function drawSun(x, y, radius) {
ctx.save();
ctx.globalAlpha = 0.9;
ctx.fillStyle = "#ffe18a";
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = "rgba(255,226,142,.5)";
ctx.lineWidth = 5;
for (let i = 0; i < 10; i++) {
const a = i * Math.PI / 5;
ctx.beginPath();
ctx.moveTo(x + Math.cos(a) * (radius + 10), y + Math.sin(a) * (radius + 10));
ctx.lineTo(x + Math.cos(a) * (radius + 23), y + Math.sin(a) * (radius + 23));
ctx.stroke();
}
ctx.restore();
}
function drawMoon(x, y, radius) {
ctx.save();
ctx.fillStyle = "#f5f1d8";
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = getTheme().skyTop;
ctx.beginPath();
ctx.arc(x + 14, y - 8, radius, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
}
function drawStars() {
ctx.save();
for (let i = 0; i < 80; i++) {
const x = (i * 137 + 43) % WIDTH;
const y = (i * 71 + 20) % 280;
const r = 1 + ((i * 3) % 3);
ctx.globalAlpha = 0.35 + ((i % 5) / 10);
ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.arc(x, y, r, 0, Math.PI * 2);
ctx.fill();
}
ctx.restore();
}
function drawDarkStars() {
drawStars();
ctx.save();
ctx.globalAlpha = 0.3;
for (let i = 0; i < 14; i++) {
const x = (i * 191 + 50) % WIDTH;
const y = 60 + ((i * 89) % 240);
ctx.strokeStyle = "#c7b6ff";
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(x - 5, y);
ctx.lineTo(x + 5, y);
ctx.moveTo(x, y - 5);
ctx.lineTo(x, y + 5);
ctx.stroke();
}
ctx.restore();
}
function drawDreamOrbs() {
ctx.save();
for (let i = 0; i < 14; i++) {
const x = (i * 137 + 80) % WIDTH;
const y = 80 + ((i * 67) % 280);
const r = 5 + (i % 4) * 3;
const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
g.addColorStop(0, "rgba(255,255,255,.8)");
g.addColorStop(1, "rgba(255,255,255,0)");
ctx.fillStyle = g;
ctx.beginPath();
ctx.arc(x, y, r * 3, 0, Math.PI * 2);
ctx.fill();
}
ctx.restore();
}
function drawParallaxHills(theme) {
ctx.fillStyle = theme.hill1;
ctx.beginPath();
ctx.moveTo(0, 350);
for (let x = 0; x <= WIDTH; x += 100) {
const y = 350 + Math.sin((x + cameraX * 0.08) * 0.012) * 35;
ctx.lineTo(x, y);
}
ctx.lineTo(WIDTH, GROUND_Y);
ctx.lineTo(0, GROUND_Y);
ctx.closePath();
ctx.fill();
ctx.fillStyle = theme.hill2;
ctx.beginPath();
ctx.moveTo(0, 400);
for (let x = 0; x <= WIDTH; x += 85) {
const y = 400 + Math.sin((x + cameraX * 0.15) * 0.018) * 27;
ctx.lineTo(x, y);
}
ctx.lineTo(WIDTH, GROUND_Y);
ctx.lineTo(0, GROUND_Y);
ctx.closePath();
ctx.fill();
}
function drawGround(theme) {
ctx.fillStyle = theme.ground;
ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
ctx.fillStyle = theme.grass;
ctx.fillRect(0, GROUND_Y, WIDTH, 8);
for (let x = -40; x < WIDTH + 40; x += 50) {
const sway = Math.sin((x + worldTime * 0.04) * 0.7) * 3;
ctx.strokeStyle = theme.grass;
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(x, GROUND_Y + 7);
ctx.lineTo(x + sway, GROUND_Y - 4);
ctx.stroke();
}
}
function drawDecor(theme) {
const offset = -(cameraX * 0.28) % 280;
for (let x = offset - 100; x < WIDTH + 300; x += 280) {
const base = GROUND_Y - 4;
drawTree(x, base, level);
}
if (level === 1 || level === 5) {
for (let x = offset; x < WIDTH + 250; x += 95) {
drawFlower(x, GROUND_Y - 4, theme.accent);
}
}
if (level === 3) {
for (let x = offset; x < WIDTH + 200; x += 150) {
drawFallingLeaf(x, 150 + ((x * 3) % 220));
}
}
if (level === 6) {
for (let x = offset; x < WIDTH + 200; x += 180) {
drawDarkPillar(x, GROUND_Y);
}
}
}
function drawTree(x, baseY, treeLevel) {
const scale = treeLevel === 3 ? 1.1 : treeLevel === 6 ? 1.25 : 1;
ctx.save();
ctx.translate(x, baseY);
ctx.fillStyle = treeLevel === 6 ? "#171a29" : "#6f4d39";
ctx.fillRect(-10 * scale, -105 * scale, 20 * scale, 105 * scale);
const colors = treeLevel === 3
? ["#d66f45", "#e49a43", "#b94f48"]
: treeLevel === 6
? ["#25263b", "#34344d", "#454563"]
: ["#4f9860", "#68ad68", "#7fc271"];
for (let i = 0; i < 3; i++) {
ctx.fillStyle = colors[i];
ctx.beginPath();
ctx.arc((i - 1) * 27 * scale, -118 * scale - (i % 2) * 10, 34 * scale, 0, Math.PI * 2);
ctx.fill();
}
ctx.restore();
}
function drawFlower(x, y, color) {
ctx.save();
ctx.strokeStyle = "#438149";
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(x, y);
ctx.lineTo(x, y - 20);
ctx.stroke();
ctx.fillStyle = color;
for (let i = 0; i < 5; i++) {
const a = i * Math.PI * 2 / 5;
ctx.beginPath();
ctx.arc(x + Math.cos(a) * 5, y - 22 + Math.sin(a) * 5, 4, 0, Math.PI * 2);
ctx.fill();
}
ctx.fillStyle = "#f6d86d";
ctx.beginPath();
ctx.arc(x, y - 22, 3, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
}
function drawFallingLeaf(x, y) {
ctx.save();
ctx.translate(x, y);
ctx.rotate(Math.sin(worldTime * 0.02 + x) * 0.5);
ctx.fillStyle = "#df7950";
ctx.beginPath();
ctx.ellipse(0, 0, 8, 14, 0.5, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
}
function drawDarkPillar(x, y) {
ctx.save();
ctx.fillStyle = "#171827";
ctx.beginPath();
ctx.moveTo(x - 16, y);
ctx.lineTo(x - 11, y - 110);
ctx.lineTo(x + 4, y - 130);
ctx.lineTo(x + 17, y);
ctx.closePath();
ctx.fill();
ctx.strokeStyle = "#68678f";
ctx.lineWidth = 2;
ctx.stroke();
ctx.restore();
}
function drawPlayer() {
const sx = worldX(player.x);
const bodyW = player.baseWidth * player.scale;
const bodyH = player.baseHeight * player.scale;
ctx.save();
ctx.translate(sx, player.y);
if (player.facing < 0) ctx.scale(-1, 1);
const bounce = player.onGround
? Math.abs(Math.sin(player.walkCycle)) * Math.min(3, player.scale * 1.5)
: 0;
ctx.translate(0, bounce);
if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0) {
ctx.globalAlpha = 0.55;
}
// Soft shadow
ctx.fillStyle = "rgba(0,0,0,.15)";
ctx.beginPath();
ctx.ellipse(0, bodyH + 7, bodyW * 0.48, 10 * Math.min(player.scale, 3), 0, 0, Math.PI * 2);
ctx.fill();
// Legs
ctx.strokeStyle = "#7c4f63";
ctx.lineWidth = Math.max(4, 5 * player.scale);
ctx.lineCap = "round";
const legSwing = player.onGround ? Math.sin(player.walkCycle) * bodyW * 0.12 : 0;
ctx.beginPath();
ctx.moveTo(-bodyW * 0.16, bodyH * 0.75);
ctx.lineTo(-bodyW * 0.18 - legSwing, bodyH * 0.98);
ctx.moveTo(bodyW * 0.16, bodyH * 0.75);
ctx.lineTo(bodyW * 0.18 + legSwing, bodyH * 0.98);
ctx.stroke();
// Shoes
ctx.fillStyle = "#f5d6e5";
ctx.beginPath();
ctx.ellipse(-bodyW * 0.2 - legSwing, bodyH, bodyW * 0.2, bodyH * 0.08, 0, 0, Math.PI * 2);
ctx.ellipse(bodyW * 0.2 + legSwing, bodyH, bodyW * 0.2, bodyH * 0.08, 0, 0, Math.PI * 2);
ctx.fill();
// Dress
ctx.fillStyle = player.hurtFlash > 0 ? "#ff6f85" : "#ef91b8";
ctx.beginPath();
ctx.moveTo(-bodyW * 0.23, bodyH * 0.39);
ctx.lineTo(bodyW * 0.23, bodyH * 0.39);
ctx.lineTo(bodyW * 0.49, bodyH * 0.79);
ctx.quadraticCurveTo(0, bodyH * 0.9, -bodyW * 0.49, bodyH * 0.79);
ctx.closePath();
ctx.fill();
// Dress highlight
ctx.strokeStyle = "rgba(255,255,255,.45)";
ctx.lineWidth = Math.max(2, 3 * player.scale);
ctx.beginPath();
ctx.moveTo(-bodyW * 0.15, bodyH * 0.47);
ctx.lineTo(-bodyW * 0.29, bodyH * 0.75);
ctx.stroke();
// Arms
ctx.strokeStyle = "#f2c4aa";
ctx.lineWidth = Math.max(5, 6 * player.scale);
ctx.beginPath();
ctx.moveTo(-bodyW * 0.27, bodyH * 0.43);
ctx.lineTo(-bodyW * 0.45, bodyH * 0.58);
ctx.stroke();
const muzzle = getMuzzlePosition();
const localGunX = muzzle.x - player.x;
const gunY = muzzle.y - player.y;
ctx.save();
ctx.translate(localGunX, gunY);
ctx.rotate(player.aimAngle);
drawGun(player.currentWeapon, player.scale);
ctx.restore();
// Head
const headR = bodyW * 0.31;
const headY = bodyH * 0.22;
ctx.fillStyle = "#f2c4aa";
ctx.beginPath();
ctx.arc(0, headY, headR, 0, Math.PI * 2);
ctx.fill();
// Hair
ctx.fillStyle = "#4a2e3d";
ctx.beginPath();
ctx.arc(-headR * 0.1, headY - headR * 0.12, headR * 1.05, Math.PI, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.moveTo(-headR * 0.9, headY - headR * 0.15);
ctx.quadraticCurveTo(-headR * 1.05, headY + headR * 0.4, -headR * 0.55, headY + headR * 0.65);
ctx.lineTo(-headR * 0.28, headY + headR * 0.15);
ctx.closePath();
ctx.fill();
// Bow
ctx.fillStyle = "#d85d8d";
ctx.beginPath();
ctx.ellipse(-headR * 0.78, headY - headR * 0.82, headR * 0.42, headR * 0.28, -0.35, 0, Math.PI * 2);
ctx.ellipse(-headR * 0.3, headY - headR * 0.87, headR * 0.42, headR * 0.28, 0.35, 0, Math.PI * 2);
ctx.fill();
// Eyes
ctx.fillStyle = "#493747";
ctx.beginPath();
ctx.ellipse(-headR * 0.28, headY - headR * 0.03, headR * 0.1, headR * 0.15, 0, 0, Math.PI * 2);
ctx.ellipse(headR * 0.28, headY - headR * 0.03, headR * 0.1, headR * 0.15, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.arc(-headR * 0.31, headY - headR * 0.08, headR * 0.035, 0, Math.PI * 2);
ctx.arc(headR * 0.25, headY - headR * 0.08, headR * 0.035, 0, Math.PI * 2);
ctx.fill();
// Cheeks
ctx.fillStyle = "rgba(238,111,135,.45)";
ctx.beginPath();
ctx.ellipse(-headR * 0.57, headY + headR * 0.2, headR * 0.16, headR * 0.08, 0, 0, Math.PI * 2);
ctx.ellipse(headR * 0.57, headY + headR * 0.2, headR * 0.16, headR * 0.08, 0, 0, Math.PI * 2);
ctx.fill();
// Smile
ctx.strokeStyle = "#8b5361";
ctx.lineWidth = Math.max(1.5, 2 * player.scale);
ctx.beginPath();
ctx.arc(0, headY + headR * 0.14, headR * 0.2, 0.15, Math.PI - 0.15);
ctx.stroke();
ctx.restore();
if (player.scale >= 8) {
ctx.save();
ctx.globalAlpha = 0.35 + Math.sin(worldTime * 0.1) * 0.12;
ctx.strokeStyle = "#fff1a8";
ctx.lineWidth = 3;
ctx.beginPath();
ctx.arc(sx, player.y + bodyH * 0.42, bodyW * 0.62, 0, Math.PI * 2);
ctx.stroke();
ctx.restore();
}
}
function drawGun(type, scale) {
const s = clamp(scale, 0.7, 4);
ctx.save();
ctx.lineCap = "round";
if (type === "tomato") {
ctx.strokeStyle = "#76495a";
ctx.lineWidth = 8 * s;
ctx.beginPath();
ctx.moveTo(-10 * s, 0);
ctx.lineTo(38 * s, 0);
ctx.stroke();
ctx.fillStyle = "#e85862";
ctx.beginPath();
ctx.arc(40 * s, 0, 10 * s, 0, Math.PI * 2);
ctx.fill();
}
if (type === "pea") {
ctx.strokeStyle = "#496d45";
ctx.lineWidth = 7 * s;
ctx.beginPath();
ctx.moveTo(-8 * s, 0);
ctx.lineTo(35 * s, 0);
ctx.stroke();
ctx.fillStyle = "#76bc5c";
ctx.beginPath();
ctx.arc(36 * s, 0, 8 * s, 0, Math.PI * 2);
ctx.fill();
}
if (type === "potato") {
ctx.strokeStyle = "#805b3d";
ctx.lineWidth = 13 * s;
ctx.beginPath();
ctx.moveTo(-8 * s, 0);
ctx.lineTo(38 * s, 0);
ctx.stroke();
ctx.fillStyle = "#b9814c";
ctx.beginPath();
ctx.ellipse(41 * s, 0, 12 * s, 14 * s, 0, 0, Math.PI * 2);
ctx.fill();
}
if (type === "pizza") {
ctx.strokeStyle = "#8b5b45";
ctx.lineWidth = 12 * s;
ctx.beginPath();
ctx.moveTo(-8 * s, 0);
ctx.lineTo(37 * s, 0);
ctx.stroke();
ctx.fillStyle = "#f2a244";
ctx.beginPath();
ctx.arc(40 * s, 0, 13 * s, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#cf4c49";
ctx.beginPath();
ctx.arc(37 * s, -4 * s, 3 * s, 0, Math.PI * 2);
ctx.arc(44 * s, 5 * s, 3 * s, 0, Math.PI * 2);
ctx.fill();
}
if (type === "kitten") {
ctx.strokeStyle = "#6d5263";
ctx.lineWidth = 10 * s;
ctx.beginPath();
ctx.moveTo(-8 * s, 0);
ctx.lineTo(35 * s, 0);
ctx.stroke();
ctx.fillStyle = "#edc6d6";
ctx.beginPath();
ctx.arc(40 * s, 0, 13 * s, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.moveTo(31 * s, -7 * s);
ctx.lineTo(35 * s, -19 * s);
ctx.lineTo(42 * s, -9 * s);
ctx.closePath();
ctx.fill();
ctx.beginPath();
ctx.moveTo(42 * s, -9 * s);
ctx.lineTo(50 * s, -19 * s);
ctx.lineTo(52 * s, -5 * s);
ctx.closePath();
ctx.fill();
}
ctx.restore();
}
function drawEnemy(enemy) {
if (enemy.dead) return;
const sx = worldX(enemy.x);
const sy = enemy.y;
ctx.save();
ctx.translate(sx, sy);
if (enemy.hitFlash > 0) ctx.globalAlpha = 0.6;
if (enemy.type === "carrot") {
ctx.fillStyle = "#f39b4c";
ctx.beginPath();
ctx.moveTo(0, enemy.height);
ctx.lineTo(-enemy.width * 0.35, 0);
ctx.quadraticCurveTo(0, enemy.height * 0.18, enemy.width * 0.35, 0);
ctx.closePath();
ctx.fill();
ctx.fillStyle = "#4e9b55";
ctx.beginPath();
ctx.ellipse(-8, -4, 12, 5, -0.4, 0, Math.PI * 2);
ctx.ellipse(6, -6, 12, 5, 0.4, 0, Math.PI * 2);
ctx.fill();
}
if (enemy.type === "pea") {
ctx.fillStyle = "#74bb58";
ctx.beginPath();
ctx.ellipse(0, enemy.height * 0.45, enemy.width * 0.45, enemy.height * 0.42, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#4f8d4a";
ctx.beginPath();
ctx.arc(-10, enemy.height * 0.35, 5, 0, Math.PI * 2);
ctx.arc(2, enemy.height * 0.25, 5, 0, Math.PI * 2);
ctx.arc(13, enemy.height * 0.4, 5, 0, Math.PI * 2);
ctx.fill();
}
if (enemy.type === "tomato") {
ctx.fillStyle = "#ed5a55";
ctx.beginPath();
ctx.arc(0, enemy.height * 0.5, enemy.width * 0.43, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#4f9c55";
ctx.beginPath();
ctx.arc(0, enemy.height * 0.09, 10, 0, Math.PI * 2);
ctx.fill();
}
if (enemy.type === "broccoli") {
ctx.fillStyle = "#4f9b57";
ctx.beginPath();
ctx.arc(-17, 24, 20, 0, Math.PI * 2);
ctx.arc(0, 8, 23, 0, Math.PI * 2);
ctx.arc(18, 25, 20, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#a77a4f";
ctx.fillRect(-9, 30, 18, 28);
}
if (enemy.type === "mushroom") {
ctx.fillStyle = "#ad5faf";
ctx.beginPath();
ctx.arc(0, 23, enemy.width * 0.43, Math.PI, Math.PI * 2);
ctx.lineTo(enemy.width * 0.42, 26);
ctx.lineTo(-enemy.width * 0.42, 26);
ctx.closePath();
ctx.fill();
ctx.fillStyle = "#f4dfd8";
ctx.fillRect(-14, 24, 28, 27);
ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.arc(-15, 12, 4, 0, Math.PI * 2);
ctx.arc(12, 8, 4, 0, Math.PI * 2);
ctx.fill();
}
if (enemy.type === "pumpkin") {
ctx.fillStyle = "#e48d38";
for (let i = -1; i <= 1; i++) {
ctx.beginPath();
ctx.ellipse(i * 17, 34, 22, 30, 0, 0, Math.PI * 2);
ctx.fill();
}
ctx.fillStyle = "#5c873e";
ctx.fillRect(-5, 2, 10, 13);
}
if (enemy.type === "corn") {
ctx.fillStyle = "#f3cf4d";
ctx.beginPath();
ctx.ellipse(0, 35, 22, 35, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#6a9b54";
ctx.beginPath();
ctx.moveTo(-18, 62);
ctx.lineTo(-31, 28);
ctx.lineTo(-5, 43);
ctx.closePath();
ctx.moveTo(18, 62);
ctx.lineTo(31, 28);
ctx.lineTo(5, 43);
ctx.closePath();
ctx.fill();
}
if (enemy.type === "shadow") {
ctx.fillStyle = "#34364f";
ctx.beginPath();
ctx.ellipse(0, 36, 29, 37, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#bcb9ff";
ctx.beginPath();
ctx.arc(-9, 27, 4, 0, Math.PI * 2);
ctx.arc(9, 27, 4, 0, Math.PI * 2);
ctx.fill();
}
// Face
ctx.fillStyle = "#463849";
ctx.beginPath();
ctx.arc(-9, enemy.height * 0.48, 3, 0, Math.PI * 2);
ctx.arc(9, enemy.height * 0.48, 3, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = "#5f3f4b";
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(0, enemy.height * 0.53, 8, 0.1, Math.PI - 0.1);
ctx.stroke();
drawMiniHealthBar(enemy);
ctx.restore();
}
function drawMiniHealthBar(enemy) {
const width = Math.max(40, enemy.width);
const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
ctx.fillStyle = "rgba(0,0,0,.3)";
ctx.fillRect(-width / 2, -13, width, 5);
ctx.fillStyle = "#ff7183";
ctx.fillRect(-width / 2, -13, width * ratio, 5);
}
function drawBoss() {
if (!boss || boss.dead) return;
const sx = worldX(boss.x);
const sy = boss.y;
ctx.save();
ctx.translate(sx, sy);
if (boss.hitFlash > 0) ctx.globalAlpha = 0.65;
if (boss.type === "andre") {
drawAndreBoss();
} else {
drawVegetableBoss();
}
ctx.restore();
// Boss bar
const barW = 520;
const barX = (WIDTH - barW) / 2;
const barY = 72;
const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
ctx.save();
ctx.fillStyle = "rgba(20,20,30,.65)";
roundRect(barX, barY, barW, 25, 12);
ctx.fill();
ctx.fillStyle = boss.type === "andre" ? "#9e91ff" : getTheme().accent;
roundRect(barX + 4, barY + 4, (barW - 8) * ratio, 17, 8);
ctx.fill();
ctx.fillStyle = "#ffffff";
ctx.font = "bold 16px Arial";
ctx.textAlign = "center";
ctx.fillText(boss.name + " • PHASE " + boss.phase, WIDTH / 2, barY + 19);
ctx.restore();
}
function drawVegetableBoss() {
const w = boss.width;
const h = boss.height;
ctx.fillStyle = boss.type === "tomato" ? "#e75552" : boss.type === "broccoli" ? "#4c9656" : boss.type === "pumpkin" ? "#e38c36" : boss.type === "corn" ? "#f0ce50" : "#a45ca9";
if (boss.type === "tomato") {
ctx.beginPath();
ctx.arc(0, h * 0.48, w * 0.47, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#4d9651";
ctx.beginPath();
ctx.arc(0, h * 0.05, 15, 0, Math.PI * 2);
ctx.fill();
}
if (boss.type === "broccoli") {
ctx.beginPath();
ctx.arc(-32, 45, 35, 0, Math.PI * 2);
ctx.arc(0, 20, 42, 0, Math.PI * 2);
ctx.arc(34, 45, 35, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#9b704c";
ctx.fillRect(-15, 60, 30, 65);
}
if (boss.type === "pumpkin") {
ctx.beginPath();
ctx.ellipse(-42, 65, 45, 60, 0, 0, Math.PI * 2);
ctx.ellipse(0, 55, 55, 68, 0, 0, Math.PI * 2);
ctx.ellipse(42, 65, 45, 60, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#668b45";
ctx.fillRect(-9, -3, 18, 22);
}
if (boss.type === "corn") {
ctx.beginPath();
ctx.ellipse(0, 70, 48, 80, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#69934c";
ctx.beginPath();
ctx.moveTo(-42, 145);
ctx.lineTo(-75, 60);
ctx.lineTo(-8, 85);
ctx.closePath();
ctx.moveTo(42, 145);
ctx.lineTo(75, 60);
ctx.lineTo(8, 85);
ctx.closePath();
ctx.fill();
}
if (boss.type === "mushroom") {
ctx.fillStyle = "#a65ca7";
ctx.beginPath();
ctx.arc(0, 45, 65, Math.PI, Math.PI * 2);
ctx.lineTo(60, 55);
ctx.lineTo(-60, 55);
ctx.closePath();
ctx.fill();
ctx.fillStyle = "#f2dfd9";
ctx.fillRect(-31, 45, 62, 70);
ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.arc(-32, 28, 9, 0, Math.PI * 2);
ctx.arc(25, 20, 10, 0, Math.PI * 2);
ctx.fill();
}
drawBossFace(w, h);
}
function drawBossFace(w, h) {
ctx.fillStyle = "#493746";
ctx.beginPath();
ctx.ellipse(-w * 0.17, h * 0.45, 7, 10, 0, 0, Math.PI * 2);
ctx.ellipse(w * 0.17, h * 0.45, 7, 10, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.arc(-w * 0.19, h * 0.41, 2.5, 0, Math.PI * 2);
ctx.arc(w * 0.15, h * 0.41, 2.5, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = "#513a43";
ctx.lineWidth = 3;
ctx.beginPath();
ctx.arc(0, h * 0.53, 16, 0.1, Math.PI - 0.1);
ctx.stroke();
}
function drawAndreBoss() {
const w = boss.width;
const h = boss.height;
// Shadow aura
ctx.save();
ctx.globalAlpha = 0.22 + boss.phase * 0.06;
ctx.fillStyle = "#8f8ac1";
ctx.beginPath();
ctx.ellipse(0, h * 0.52, w * 0.8, h * 0.62, 0, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
// Legs
ctx.strokeStyle = "#202131";
ctx.lineWidth = 17;
ctx.lineCap = "round";
ctx.beginPath();
ctx.moveTo(-18, h * 0.78);
ctx.lineTo(-27, h);
ctx.moveTo(18, h * 0.78);
ctx.lineTo(30, h);
ctx.stroke();
// Shoes
ctx.fillStyle = "#141621";
ctx.beginPath();
ctx.ellipse(-33, h, 27, 11, 0, 0, Math.PI * 2);
ctx.ellipse(34, h, 27, 11, 0, 0, Math.PI * 2);
ctx.fill();
// Oversized hoodie
ctx.fillStyle = "#383b54";
ctx.beginPath();
ctx.moveTo(-w * 0.43, h * 0.32);
ctx.quadraticCurveTo(-w * 0.55, h * 0.55, -w * 0.36, h * 0.82);
ctx.lineTo(w * 0.36, h * 0.82);
ctx.quadraticCurveTo(w * 0.55, h * 0.55, w * 0.43, h * 0.32);
ctx.closePath();
ctx.fill();
// Hoodie pocket
ctx.strokeStyle = "#50536e";
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(-27, h * 0.65);
ctx.quadraticCurveTo(0, h * 0.78, 27, h * 0.65);
ctx.stroke();
// Arms
ctx.strokeStyle = "#34364b";
ctx.lineWidth = 18;
ctx.beginPath();
ctx.moveTo(-w * 0.37, h * 0.4);
ctx.lineTo(-w * 0.62, h * 0.65);
ctx.moveTo(w * 0.37, h * 0.4);
ctx.lineTo(w * 0.58, h * 0.63);
ctx.stroke();
// Head
ctx.fillStyle = "#d5a990";
ctx.beginPath();
ctx.arc(0, h * 0.19, w * 0.34, 0, Math.PI * 2);
ctx.fill();
// Dark hair
ctx.fillStyle = "#171925";
ctx.beginPath();
ctx.arc(0, h * 0.12, w * 0.38, Math.PI, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.moveTo(-w * 0.36, h * 0.1);
ctx.quadraticCurveTo(-w * 0.3, h * 0.32, -w * 0.13, h * 0.36);
ctx.lineTo(-w * 0.08, h * 0.16);
ctx.closePath();
ctx.fill();
ctx.beginPath();
ctx.moveTo(w * 0.36, h * 0.1);
ctx.quadraticCurveTo(w * 0.3, h * 0.32, w * 0.13, h * 0.36);
ctx.lineTo(w * 0.08, h * 0.16);
ctx.closePath();
ctx.fill();
// Eyes
ctx.fillStyle = "#242537";
ctx.beginPath();
ctx.ellipse(-w * 0.12, h * 0.19, 5, 7, 0, 0, Math.PI * 2);
ctx.ellipse(w * 0.12, h * 0.19, 5, 7, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.arc(-w * 0.135, h * 0.17, 2, 0, Math.PI * 2);
ctx.arc(w * 0.105, h * 0.17, 2, 0, Math.PI * 2);
ctx.fill();
// Expression
ctx.strokeStyle = "#744f54";
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(-w * 0.1, h * 0.27);
ctx.quadraticCurveTo(0, h * 0.32, w * 0.1, h * 0.27);
ctx.stroke();
// Phase aura
if (boss.phase >= 2) {
ctx.strokeStyle = boss.phase === 3 ? "#c7b6ff" : "#8f8cae";
ctx.lineWidth = 3;
ctx.globalAlpha = 0.7;
ctx.beginPath();
ctx.arc(0, h * 0.48, w * (0.58 + Math.sin(worldTime * 0.04) * 0.05), 0, Math.PI * 2);
ctx.stroke();
}
}
function drawFood(food) {
if (food.collected) return;
const sx = worldX(food.x);
const sy = food.y + Math.sin(food.bob) * 8;
ctx.save();
ctx.translate(sx, sy);
if (food.type === "berry") {
ctx.fillStyle = "#9f6bd0";
ctx.beginPath();
ctx.arc(-7, 0, 8, 0, Math.PI * 2);
ctx.arc(7, 0, 8, 0, Math.PI * 2);
ctx.arc(0, -7, 8, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#5e9b55";
ctx.fillRect(-3, -16, 6, 7);
}
if (food.type === "apple") {
ctx.fillStyle = "#e65d61";
ctx.beginPath();
ctx.arc(0, 2, 14, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#4f914e";
ctx.beginPath();
ctx.ellipse(7, -12, 7, 4, -0.4, 0, Math.PI * 2);
ctx.fill();
}
if (food.type === "cake") {
ctx.fillStyle = "#f2b5d0";
ctx.fillRect(-16, -8, 32, 19);
ctx.fillStyle = "#fff2e7";
ctx.fillRect(-16, -13, 32, 7);
ctx.fillStyle = "#eebf63";
ctx.fillRect(-3, -25, 6, 12);
ctx.fillStyle = "#ffdf72";
ctx.beginPath();
ctx.arc(0, -28, 4, 0, Math.PI * 2);
ctx.fill();
}
if (food.type === "star") {
drawStarShape(0, 0, 17, 8, "#ffe37b");
}
ctx.restore();
}
function drawWeaponDrop(drop) {
if (drop.life <= 0) return;
const sx = worldX(drop.x);
const sy = drop.y + Math.sin(drop.bob) * 7;
ctx.save();
ctx.translate(sx, sy);
const weapon = WEAPONS[drop.type];
ctx.globalAlpha = 0.2;
ctx.fillStyle = weaponProjectileColor(weapon.projectile);
ctx.beginPath();
ctx.arc(0, 0, 34, 0, Math.PI * 2);
ctx.fill();
ctx.globalAlpha = 1;
drawStarShape(0, 0, 28, 5, weaponProjectileColor(weapon.projectile));
ctx.fillStyle = "#ffffff";
ctx.font = "bold 11px Arial";
ctx.textAlign = "center";
ctx.fillText(weapon.short, 0, 4);
ctx.restore();
}
function drawStarShape(cx, cy, outer, inner, color) {
ctx.save();
ctx.fillStyle = color;
ctx.beginPath();
for (let i = 0; i < 10; i++) {
const a = -Math.PI / 2 + i * Math.PI / 5;
const r = i % 2 === 0 ? outer : inner;
const x = cx + Math.cos(a) * r;
const y = cy + Math.sin(a) * r;
if (i === 0) ctx.moveTo(x, y);
else ctx.lineTo(x, y);
}
ctx.closePath();
ctx.fill();
ctx.restore();
}
function drawParticles() {
for (const p of particles) {
const sx = worldX(p.x);
ctx.save();
ctx.globalAlpha = p.alpha;
ctx.translate(sx, p.y);
ctx.rotate(p.rotation);
ctx.fillStyle = p.color;
if (p.shape === "star") {
drawStarShape(0, 0, p.size, p.size * 0.45, p.color);
} else if (p.shape === "heart") {
ctx.beginPath();
ctx.moveTo(0, p.size);
ctx.bezierCurveTo(-p.size * 1.5, p.size * 0.2, -p.size, -p.size, 0, -p.size * 0.2);
ctx.bezierCurveTo(p.size, -p.size, p.size * 1.5, p.size * 0.2, 0, p.size);
ctx.fill();
} else {
ctx.beginPath();
ctx.arc(0, 0, p.size, 0, Math.PI * 2);
ctx.fill();
}
ctx.restore();
}
}
function drawDamageNumbers() {
for (const d of damageNumbers) {
ctx.save();
ctx.globalAlpha = clamp(d.life / d.maxLife, 0, 1);
ctx.fillStyle = d.critical ? "#fff0a6" : "#ffffff";
ctx.strokeStyle = "rgba(45,30,50,.7)";
ctx.lineWidth = 4;
ctx.font = d.critical ? "bold 20px Arial" : "bold 15px Arial";
ctx.textAlign = "center";
const sx = worldX(d.x);
ctx.strokeText(String(d.amount), sx, d.y);
ctx.fillText(String(d.amount), sx, d.y);
ctx.restore();
}
}
function drawHUD() {
if (gameState === "title") return;
ctx.save();
// Top panel
ctx.fillStyle = "rgba(31,34,52,.72)";
roundRect(18, 16, 300, 86, 18);
ctx.fill();
ctx.fillStyle = "#ffffff";
ctx.font = "bold 17px Arial";
ctx.textAlign = "left";
ctx.fillText("SCORE " + score.toLocaleString(), 35, 41);
ctx.fillText("LEVEL " + level + " • " + getTheme().name, 35, 65);
// Health
ctx.fillStyle = "rgba(255,255,255,.18)";
roundRect(35, 77, 140, 10, 5);
ctx.fill();
ctx.fillStyle = "#ff7287";
roundRect(35, 77, 140 * clamp(player.health / player.maxHealth, 0, 1), 10, 5);
ctx.fill();
// Growth
const growthX = 195;
const growthW = 100;
ctx.fillStyle = "rgba(255,255,255,.18)";
roundRect(growthX, 77, growthW, 10, 5);
ctx.fill();
ctx.fillStyle = growthWarning ? "#fff0a6" : "#f29fc0";
roundRect(growthX, 77, growthW * clamp(player.scale / MAX_SCALE, 0, 1), 10, 5);
ctx.fill();
ctx.fillStyle = "#ffffff";
ctx.font = "11px Arial";
ctx.fillText("HP", 180, 86);
ctx.fillText("GROW", 298, 86);
// Weapon card
ctx.fillStyle = "rgba(31,34,52,.72)";
roundRect(WIDTH - 260, 16, 242, 86, 18);
ctx.fill();
const weapon = WEAPONS[player.currentWeapon];
ctx.fillStyle = weaponProjectileColor(weapon.projectile);
ctx.font = "bold 18px Arial";
ctx.textAlign = "right";
ctx.fillText(weapon.name, WIDTH - 35, 43);
ctx.fillStyle = "#ffffff";
ctx.font = "13px Arial";
ctx.fillText("Q / E switch weapon", WIDTH - 35, 66);
ctx.fillText("J / K / ENTER fire", WIDTH - 35, 86);
// Growth text
ctx.textAlign = "center";
ctx.font = "bold 16px Arial";
ctx.fillStyle = growthWarning ? "#fff0a6" : "#ffffff";
ctx.fillText(
"Lovey " + player.scale.toFixed(1) + "×",
WIDTH / 2,
HEIGHT - 20
);
if (combo > 1) {
ctx.fillStyle = "#ffe38a";
ctx.font = "bold 18px Arial";
ctx.fillText("COMBO ×" + combo, WIDTH / 2, 122);
}
ctx.restore();
}
function drawTitle() {
ctx.save();
ctx.fillStyle = "rgba(28,34,52,.42)";
ctx.fillRect(0, 0, WIDTH, HEIGHT);
// Decorative circles
for (let i = 0; i < 9; i++) {
const x = 80 + i * 115;
const y = 95 + Math.sin(worldTime * 0.015 + i) * 20;
ctx.globalAlpha = 0.15;
ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.arc(x, y, 12 + (i % 3) * 5, 0, Math.PI * 2);
ctx.fill();
}
ctx.globalAlpha = 1;
ctx.textAlign = "center";
ctx.fillStyle = "#ffffff";
ctx.font = "bold 68px Georgia";
ctx.fillText("Lovey's Delight", WIDTH / 2, 190);
ctx.fillStyle = "#ffd3e3";
ctx.font = "italic 23px Georgia";
ctx.fillText("A tiny heroine. A very big appetite.", WIDTH / 2, 232);
ctx.fillStyle = "rgba(255,255,255,.94)";
roundRect(280, 265, 440, 185, 26);
ctx.fill();
ctx.fillStyle = "#45405a";
ctx.font = "bold 18px Arial";
ctx.fillText("HOW TO PLAY", WIDTH / 2, 300);
ctx.font = "15px Arial";
ctx.fillText("A / D or ← / → Move", WIDTH / 2, 332);
ctx.fillText("SPACE / W / ↑ Jump", WIDTH / 2, 358);
ctx.fillText("J / K / ENTER Shoot", WIDTH / 2, 384);
ctx.fillText("Q / E Switch weapons", WIDTH / 2, 410);
ctx.fillText("Eat food to grow • Collect weapon drops", WIDTH / 2, 436);
ctx.fillStyle = "#e8759f";
ctx.font = "bold 19px Arial";
ctx.fillText("Click START to begin", WIDTH / 2, 492);
ctx.restore();
}
function drawTransition() {
if (transitionTimer <= 0 || !transitionText) return;
const alpha = clamp(
Math.min(transitionTimer / 35, (140 - transitionTimer) / 35),
0,
1
);
ctx.save();
ctx.globalAlpha = alpha;
ctx.fillStyle = "rgba(20,20,30,.52)";
ctx.fillRect(0, 0, WIDTH, HEIGHT);
ctx.textAlign = "center";
ctx.fillStyle = "#ffffff";
ctx.font = "bold 48px Georgia";
ctx.fillText(transitionText, WIDTH / 2, HEIGHT / 2);
ctx.restore();
}
function drawExplosion() {
const progress = clamp(explosionTimer / 125, 0, 1);
const radius = 70 + progress * 600;
ctx.save();
ctx.fillStyle = `rgba(255,220,170,${0.08 + progress * 0.35})`;
ctx.beginPath();
ctx.arc(worldX(player.x), player.y + player.baseHeight * player.scale * 0.4, radius, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = `rgba(255,245,205,${1 - progress * 0.7})`;
ctx.lineWidth = 10;
ctx.beginPath();
ctx.arc(worldX(player.x), player.y + player.baseHeight * player.scale * 0.4, radius * 0.75, 0, Math.PI * 2);
ctx.stroke();
if (explosionTimer < 35) {
ctx.save();
ctx.globalAlpha = 1 - explosionTimer / 35;
drawPlayer();
ctx.restore();
}
ctx.restore();
}
function drawGameOver() {
ctx.save();
ctx.fillStyle = "rgba(20,22,35,.72)";
ctx.fillRect(0, 0, WIDTH, HEIGHT);
ctx.textAlign = "center";
ctx.fillStyle = "#ffffff";
ctx.font = "bold 54px Georgia";
ctx.fillText("GAME OVER", WIDTH / 2, 185);
ctx.fillStyle = "#ffd4e4";
ctx.font = "22px Arial";
ctx.fillText(gameOverReason, WIDTH / 2, 225);
if (gameOverReason.includes("too big")) {
ctx.fillStyle = "#fff0a6";
ctx.font = "bold 18px Arial";
ctx.fillText("Lovey reached 12× her starting size.", WIDTH / 2, 260);
}
ctx.fillStyle = "#ffffff";
ctx.font = "18px Arial";
ctx.fillText("Score: " + score.toLocaleString(), WIDTH / 2, 310);
ctx.fillText("Level: " + level, WIDTH / 2, 338);
ctx.fillText("Press R or click Restart", WIDTH / 2, 390);
ctx.restore();
}
function drawVictory() {
ctx.save();
ctx.fillStyle = "rgba(30,27,55,.72)";
ctx.fillRect(0, 0, WIDTH, HEIGHT);
ctx.textAlign = "center";
ctx.fillStyle = "#fff0a6";
ctx.font = "bold 54px Georgia";
ctx.fillText("THE DELIGHT IS SAVED!", WIDTH / 2, 205);
ctx.fillStyle = "#ffffff";
ctx.font = "23px Arial";
ctx.fillText("Lovey defeated Andre and conquered every realm.", WIDTH / 2, 252);
ctx.font = "bold 20px Arial";
ctx.fillText("Final Score: " + score.toLocaleString(), WIDTH / 2, 300);
ctx.font = "17px Arial";
ctx.fillText("Press R to play again", WIDTH / 2, 360);
ctx.restore();
}
function draw() {
ctx.save();
const shakeX = screenShake > 0 ? rand(-screenShake, screenShake) : 0;
const shakeY = screenShake > 0 ? rand(-screenShake, screenShake) : 0;
ctx.translate(shakeX, shakeY);
drawBackground();
if (gameState !== "title") {
for (const food of foods) drawFood(food);
for (const drop of weaponDrops) drawWeaponDrop(drop);
for (const enemy of enemies) drawEnemy(enemy);
drawBoss();
for (const p of projectiles) {
if (!p.hit) {
if (p.enemyProjectile) {
ctx.save();
ctx.fillStyle = "#8c88bd";
ctx.shadowColor = "#c7b6ff";
ctx.shadowBlur = 15;
ctx.beginPath();
ctx.arc(worldX(p.x), p.y, p.size, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
} else {
drawProjectile(p);
}
}
}
drawPlayer();
drawParticles();
drawDamageNumbers();
drawHUD();
}
if (gameState === "title") {
drawTitle();
}
if (gameState === "exploding") {
drawExplosion();
}
if (gameState === "gameover") {
drawGameOver();
}
if (gameState === "victory") {
drawVictory();
}
if (gameState === "playing") {
drawTransition();
}
ctx.restore();
}
function roundRect(x, y, w, h, r) {
const radius = Math.min(r, w / 2, h / 2);
ctx.beginPath();
ctx.moveTo(x + radius, y);
ctx.arcTo(x + w, y, x + w, y + h, radius);
ctx.arcTo(x + w, y + h, x, y + h, radius);
ctx.arcTo(x, y + h, x, y, radius);
ctx.arcTo(x, y, x + w, y, radius);
ctx.closePath();
}
function resetGame() {
gameState = "playing";
score = 0;
level = 1;
cameraX = 0;
worldTime = 0;
transitionTimer = 90;
transitionText = "Garden";
gameOverReason = "";
screenShake = 0;
combo = 0;
comboTimer = 0;
spawnTimer = 30;
foodTimer = 100;
weaponTimer = 400;
boss = null;
bossSpawned = false;
levelComplete = false;
explosionTimer = 0;
growthWarning = false;
particles.length = 0;
projectiles.length = 0;
enemies.length = 0;
foods.length = 0;
weaponDrops.length = 0;
damageNumbers.length = 0;
player.x = 180;
player.y = GROUND_Y - player.baseHeight;
player.vx = 0;
player.vy = 0;
player.scale = 1;
player.health = player.maxHealth;
player.facing = 1;
player.onGround = true;
player.invincible = 0;
player.attackCooldown = 0;
player.attackAnim = 0;
player.walkCycle = 0;
player.aimAngle = 0;
player.currentWeapon = "tomato";
player.inventory = [];
player.hurtFlash = 0;
for (let i = 0; i < 3; i++) {
spawnFood(450 + i * 300, 340 - i * 25);
}
}
function startGame() {
resetGame();
if (bgm) {
const promise = bgm.play();
if (promise && promise.catch) promise.catch(() => {});
}
}
function restartGame() {
resetGame();
}
window.addEventListener("keydown", event => {
keys[event.key] = true;
if (
["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)
) {
event.preventDefault();
}
if (event.key === "Enter" && gameState === "title") {
startGame();
}
if (event.key.toLowerCase() === "r" && (gameState === "gameover" || gameState === "victory")) {
restartGame();
}
if (gameState === "playing") {
if (event.key.toLowerCase() === "j" || event.key.toLowerCase() === "k" || event.key === "Enter") {
shootWeapon();
}
if (event.key.toLowerCase() === "q") {
cycleWeapon(-1);
}
if (event.key.toLowerCase() === "e") {
cycleWeapon(1);
}
}
});
window.addEventListener("keyup", event => {
keys[event.key] = false;
});
if (ui.startButton) {
ui.startButton.addEventListener("click", startGame);
}
if (ui.restartButton) {
ui.restartButton.addEventListener("click", restartGame);
}
// Touch / pointer-friendly controls for the existing page if available.
canvas.addEventListener("pointerdown", event => {
if (gameState === "title") {
startGame();
return;
}
if (gameState === "playing") {
shootWeapon();
}
});
function updateExternalUI() {
if (ui.score) ui.score.textContent = score.toLocaleString();
if (ui.level) ui.level.textContent = level;
if (ui.health) ui.health.textContent = Math.max(0, Math.round(player.health));
if (ui.growth) ui.growth.textContent = player.scale.toFixed(1) + "×";
if (ui.weapon) ui.weapon.textContent = "Weapon: " + WEAPONS[player.currentWeapon].name;
if (ui.inventory) {
ui.inventory.textContent =
"Inventory: " +
(player.inventory.length ? player.inventory.map(w => WEAPONS[w].short).join(" | ") : "-");
}
}
function loop() {
try {
update();
draw();
updateExternalUI();
} catch (error) {
console.error("Lovey's Delight error:", error);
}
requestAnimationFrame(loop);
}
loop();
