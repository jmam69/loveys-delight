// ============================================================
// LOVEY'S DELIGHT
// Enhanced Edition
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;

// ============================================================
// UI
// ============================================================

const uiEl = document.getElementById("ui");
const levelEl = document.getElementById("level");
const healthEl = document.getElementById("health");
const sizeEl = document.getElementById("size");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");

// ============================================================
// AUDIO
// ============================================================

const bgm = new Audio("bgm.mp3");
bgm.loop = true;
bgm.volume = 0.45;

// ============================================================
// WORLD
// ============================================================

const WIDTH = 1000;
const HEIGHT = 600;
const GROUND_Y = 485;

const MAX_TOMATOES = 14;
const MAX_PARTICLES = 300;
const MAX_ENEMIES = 9;

let gameState = "title";

let score = 0;
let level = 1;
let frame = 0;

let cameraX = 0;
let levelLength = 3800;

let titleAlpha = 0;

let keys = {};

let particles = [];
let tomatoes = [];
let enemies = [];
let foods = [];

let boss = null;
let bossSpawned = false;
let levelTransitioning = false;

let lastEnemySpawn = 0;

// ============================================================
// PLAYER
// ============================================================

const player = {

    x: 150,
    y: 400,

    baseWidth: 48,
    baseHeight: 86,

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

    walkCycle: 0,

    aimAngle: 0
};

// ============================================================
// LEVEL THEMES
// ============================================================

const LEVEL_THEMES = [

    {
        skyTop: "#79c8e8",
        skyBottom: "#d8f4df",

        farHill: "#a7d99b",
        nearHill: "#63ad65",
        ground: "#438c3c",

        flower: "#f5a6c6",
        accent: "#ff69b4"
    },

    {
        skyTop: "#9db8e8",
        skyBottom: "#f3d7d9",

        farHill: "#b6b2d8",
        nearHill: "#77956e",
        ground: "#4f7f49",

        flower: "#dca7e8",
        accent: "#c77dff"
    },

    {
        skyTop: "#f2a36d",
        skyBottom: "#f8d9a4",

        farHill: "#c88e65",
        nearHill: "#71854e",
        ground: "#596b39",

        flower: "#ffd37d",
        accent: "#ff9f43"
    }

];

// ============================================================
// INPUT
// ============================================================

window.addEventListener("keydown", function (e) {

    const key = e.key.toLowerCase();

    if (
        key === " " ||
        key === "arrowup" ||
        key === "arrowdown" ||
        key === "arrowleft" ||
        key === "arrowright"
    ) {
        e.preventDefault();
    }

    const wasDown = keys[key];

    keys[key] = true;

    if (gameState === "title") {
        startGame();
        return;
    }

    if (
        (gameState === "gameover" ||
         gameState === "victory") &&
        key === "r"
    ) {
        startGame();
        return;
    }

    if (
        gameState === "playing" &&
        !wasDown &&
        (
            key === "j" ||
            key === "k" ||
            key === "enter"
        )
    ) {
        shootTomato();
    }

});

window.addEventListener("keyup", function (e) {

    keys[e.key.toLowerCase()] = false;

});

// ============================================================
// UTILITIES
// ============================================================

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {

    return Math.hypot(
        x2 - x1,
        y2 - y1
    );

}

function showMessage(text, duration = 1800) {

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

// ============================================================
// PARTICLES
// ============================================================

function spawnParticles(
    x,
    y,
    color,
    count = 12
) {

    const amount = Math.min(
        count,
        MAX_PARTICLES - particles.length
    );

    for (let i = 0; i < amount; i++) {

        particles.push({

            x,
            y,

            vx: rand(-5, 5),
            vy: rand(-7, 1),

            life: rand(22, 48),
            maxLife: 48,

            size: rand(2, 7),

            color

        });

    }

}

// ============================================================
// CLOUDS
// ============================================================

function drawCloud(x, y, scale = 1) {

    ctx.save();

    ctx.fillStyle =
        "rgba(255,255,255,0.82)";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        25 * scale,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 28 * scale,
        y - 12 * scale,
        31 * scale,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 62 * scale,
        y,
        25 * scale,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 35 * scale,
        y + 10 * scale,
        25 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

}

// ============================================================
// SUN / MOON
// ============================================================

function drawSun() {

    const theme =
        LEVEL_THEMES[level - 1] ||
        LEVEL_THEMES[0];

    const x =
        850 -
        cameraX * 0.04;

    const y = 95;

    ctx.save();

    ctx.globalAlpha = 0.85;

    const glow =
        ctx.createRadialGradient(
            x,
            y,
            10,
            x,
            y,
            80
        );

    glow.addColorStop(
        0,
        "rgba(255,245,180,0.9)"
    );

    glow.addColorStop(
        1,
        "rgba(255,245,180,0)"
    );

    ctx.fillStyle = glow;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        80,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.fillStyle =
        level === 3
            ? "#ffd27d"
            : "#fff4b0";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        34,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

}

// ============================================================
// BACKGROUND TREES
// ============================================================

function drawTree(
    x,
    y,
    scale = 1
) {

    ctx.save();

    ctx.translate(x, y);

    // trunk
    ctx.fillStyle = "#76513a";

    ctx.fillRect(
        -9 * scale,
        0,
        18 * scale,
        65 * scale
    );

    // branches
    ctx.strokeStyle = "#76513a";
    ctx.lineWidth = 7 * scale;

    ctx.beginPath();

    ctx.moveTo(0, 25 * scale);
    ctx.lineTo(-27 * scale, 5 * scale);

    ctx.moveTo(0, 35 * scale);
    ctx.lineTo(29 * scale, 12 * scale);

    ctx.stroke();

    // leaves
    ctx.fillStyle =
        level === 3
            ? "#9b6649"
            : "#4f8d55";

    const leaves = [
        [-25, 0, 27],
        [0, -15, 35],
        [27, 2, 25],
        [-2, 15, 30]
    ];

    leaves.forEach(function (l) {

        ctx.beginPath();

        ctx.arc(
            l[0] * scale,
            l[1] * scale,
            l[2] * scale,
            0,
            Math.PI * 2
        );

        ctx.fill();

    });

    ctx.restore();

}

// ============================================================
// FLOWERS
// ============================================================

function drawFlower(
    x,
    y,
    scale = 1,
    color = "#f5a6c6"
) {

    ctx.save();

    ctx.strokeStyle = "#3e793d";
    ctx.lineWidth = 2 * scale;

    ctx.beginPath();

    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 20 * scale);

    ctx.stroke();

    ctx.fillStyle = color;

    for (let i = 0; i < 5; i++) {

        const angle =
            i * Math.PI * 2 / 5;

        ctx.beginPath();

        ctx.arc(
            x +
                Math.cos(angle) *
                7 *
                scale,
            y +
                Math.sin(angle) *
                7 *
                scale,
            5 * scale,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

    ctx.fillStyle = "#f7d35c";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        4 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

}

// ============================================================
// PLAYER
// ============================================================

function drawPlayer() {

    const s = player.scale;

    const w =
        player.baseWidth * s;

    const h =
        player.baseHeight * s;

    const x =
        player.x - cameraX;

    const y = player.y;

    ctx.save();

    if (player.facing === -1) {

        ctx.translate(
            x + w / 2,
            0
        );

        ctx.scale(-1, 1);

        ctx.translate(
            -(x + w / 2),
            0
        );

    }

    const walking =
        player.onGround &&
        Math.abs(player.vx) > 0.3;

    if (walking) {
        player.walkCycle += 0.17;
    }

    const legSwing =
        walking
            ? Math.sin(player.walkCycle) *
              8 * s
            : 0;

    // --------------------------------------------------------
    // SHADOW
    // --------------------------------------------------------

    ctx.save();

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#241a20";

    ctx.beginPath();

    ctx.ellipse(
        x + w / 2,
        GROUND_Y + 5,
        26 * s,
        8 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // --------------------------------------------------------
    // SHOES
    // --------------------------------------------------------

    ctx.fillStyle = "#7c4158";

    ctx.beginPath();

    ctx.ellipse(
        x + w * 0.31,
        y + h * 0.94,
        w * 0.13,
        h * 0.055,
        -0.1,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x + w * 0.69,
        y + h * 0.94,
        w * 0.13,
        h * 0.055,
        0.1,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------------------
    // LEGS
    // --------------------------------------------------------

    ctx.strokeStyle = "#f4a5b5";
    ctx.lineWidth = 9 * s;
    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(
        x + w * 0.36,
        y + h * 0.62
    );

    ctx.lineTo(
        x + w * 0.31 +
        legSwing * 0.25,
        y + h * 0.88
    );

    ctx.moveTo(
        x + w * 0.64,
        y + h * 0.62
    );

    ctx.lineTo(
        x + w * 0.69 -
        legSwing * 0.25,
        y + h * 0.88
    );

    ctx.stroke();

    // --------------------------------------------------------
    // DRESS
    // --------------------------------------------------------

    const dress =
        ctx.createLinearGradient(
            x,
            y,
            x,
            y + h
        );

    dress.addColorStop(
        0,
        "#ff9dcc"
    );

    dress.addColorStop(
        0.55,
        "#f76fb1"
    );

    dress.addColorStop(
        1,
        "#d94f96"
    );

    ctx.fillStyle = dress;

    ctx.beginPath();

    ctx.moveTo(
        x + w * 0.29,
        y + h * 0.29
    );

    ctx.quadraticCurveTo(
        x + w * 0.5,
        y + h * 0.24,
        x + w * 0.71,
        y + h * 0.29
    );

    ctx.lineTo(
        x + w * 0.98,
        y + h * 0.72
    );

    ctx.quadraticCurveTo(
        x + w * 0.5,
        y + h * 0.82,
        x + w * 0.02,
        y + h * 0.72
    );

    ctx.closePath();

    ctx.fill();

    // Dress folds
    ctx.strokeStyle =
        "rgba(255,255,255,0.25)";

    ctx.lineWidth = 2 * s;

    for (let i = 0; i < 4; i++) {

        ctx.beginPath();

        ctx.moveTo(
            x + w * (
                0.25 + i * 0.17
            ),
            y + h * 0.42
        );

        ctx.quadraticCurveTo(
            x + w * (
                0.22 + i * 0.18
            ),
            y + h * 0.59,
            x + w * (
                0.16 + i * 0.22
            ),
            y + h * 0.72
        );

        ctx.stroke();

    }

    // Waist ribbon
    ctx.fillStyle = "#fff0f5";

    ctx.fillRect(
        x + w * 0.27,
        y + h * 0.42,
        w * 0.46,
        5 * s
    );

    // Bow
    ctx.fillStyle = "#fff";

    ctx.beginPath();

    ctx.ellipse(
        x + w * 0.43,
        y + h * 0.45,
        9 * s,
        6 * s,
        -0.3,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x + w * 0.57,
        y + h * 0.45,
        9 * s,
        6 * s,
        0.3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------------------
    // ARMS
    // --------------------------------------------------------

    ctx.strokeStyle = "#f4a5b5";
    ctx.lineWidth = 9 * s;

    ctx.beginPath();

    ctx.moveTo(
        x + w * 0.22,
        y + h * 0.34
    );

    ctx.lineTo(
        x + w * 0.10,
        y + h * 0.51
    );

    ctx.stroke();

    // Gun arm
    ctx.beginPath();

    ctx.moveTo(
        x + w * 0.76,
        y + h * 0.35
    );

    ctx.lineTo(
        x + w * 0.91,
        y + h * 0.43
    );

    ctx.stroke();

    // --------------------------------------------------------
    // HEAD
    // --------------------------------------------------------

    ctx.fillStyle = "#f7b0b8";

    ctx.beginPath();

    ctx.arc(
        x + w / 2,
        y + h * 0.20,
        w * 0.29,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------------------
    // HAIR
    // --------------------------------------------------------

    ctx.fillStyle = "#613820";

    ctx.beginPath();

    ctx.arc(
        x + w / 2,
        y + h * 0.15,
        w * 0.34,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    // side hair
    ctx.beginPath();

    ctx.ellipse(
        x + w * 0.19,
        y + h * 0.25,
        w * 0.13,
        h * 0.20,
        -0.1,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x + w * 0.81,
        y + h * 0.25,
        w * 0.13,
        h * 0.20,
        0.1,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Hair highlights
    ctx.strokeStyle =
        "rgba(255,220,190,0.3)";

    ctx.lineWidth = 2 * s;

    ctx.beginPath();

    ctx.arc(
        x + w * 0.43,
        y + h * 0.10,
        w * 0.17,
        Math.PI * 1.15,
        Math.PI * 1.7
    );

    ctx.stroke();

    // --------------------------------------------------------
    // BOW / HAIR ACCESSORY
    // --------------------------------------------------------

    ctx.fillStyle = "#ff8fbd";

    ctx.beginPath();

    ctx.ellipse(
        x + w * 0.26,
        y + h * 0.08,
        11 * s,
        7 * s,
        -0.4,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x + w * 0.40,
        y + h * 0.06,
        11 * s,
        7 * s,
        0.4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------------------
    // EYES
    // --------------------------------------------------------

    ctx.fillStyle = "#fff";

    ctx.beginPath();

    ctx.ellipse(
        x + w * 0.39,
        y + h * 0.20,
        6 * s,
        8 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x + w * 0.61,
        y + h * 0.20,
        6 * s,
        8 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#3a2430";

    ctx.beginPath();

    ctx.arc(
        x + w * 0.39 +
        player.facing * 1.5 * s,
        y + h * 0.20,
        3.2 * s,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + w * 0.61 +
        player.facing * 1.5 * s,
        y + h * 0.20,
        3.2 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eye highlights
    ctx.fillStyle = "#fff";

    ctx.beginPath();

    ctx.arc(
        x + w * 0.40,
        y + h * 0.19,
        1.3 * s,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + w * 0.62,
        y + h * 0.19,
        1.3 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------------------
    // CHEEKS
    // --------------------------------------------------------

    ctx.fillStyle =
        "rgba(240,90,120,0.32)";

    ctx.beginPath();

    ctx.ellipse(
        x + w * 0.29,
        y + h * 0.27,
        8 * s,
        4 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x + w * 0.71,
        y + h * 0.27,
        8 * s,
        4 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------------------
    // SMILE
    // --------------------------------------------------------

    ctx.strokeStyle = "#a84c68";
    ctx.lineWidth = 2 * s;

    ctx.beginPath();

    ctx.arc(
        x + w / 2,
        y + h * 0.255,
        7 * s,
        0.15,
        Math.PI - 0.15
    );

    ctx.stroke();

    // --------------------------------------------------------
    // TOMATO GUN
    // --------------------------------------------------------

    const gunX =
        x +
        w * 0.88;

    const gunY =
        y +
        h * 0.43;

    ctx.save();

    ctx.translate(
        gunX,
        gunY
    );

    // Rotate visually toward the aim
    const visualAngle =
        player.aimAngle;

    ctx.rotate(
        player.facing === 1
            ? visualAngle
            : Math.PI + visualAngle
    );

    ctx.fillStyle = "#574d61";

    ctx.fillRect(
        0,
        -5 * s,
        28 * s,
        10 * s
    );

    ctx.fillStyle = "#8d8295";

    ctx.fillRect(
        7 * s,
        -8 * s,
        18 * s,
        4 * s
    );

    ctx.fillStyle = "#c9b7c5";

    ctx.beginPath();

    ctx.arc(
        27 * s,
        0,
        8 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#d94c4c";

    ctx.beginPath();

    ctx.arc(
        29 * s,
        0,
        5 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    ctx.restore();

    // Damage flash
    if (
        player.invincible > 0 &&
        Math.floor(
            player.invincible / 4
        ) % 2 === 0
    ) {

        ctx.save();

        ctx.globalAlpha = 0.35;

        ctx.fillStyle = "#fff";

        ctx.beginPath();

        ctx.arc(
            x + w / 2,
            y + h / 2,
            Math.max(w, h) * 0.55,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

    }

}

// ============================================================
// TARGETING
// ============================================================

function getTarget() {

    const originX = player.x;
    const originY =
        player.y +
        player.baseHeight *
        player.scale *
        0.38;

    let best = null;
    let bestScore = Infinity;

    function considerTarget(
        target,
        targetX,
        targetY,
        size
    ) {

        const dx =
            targetX - originX;

        const dy =
            targetY - originY;

        // Must be generally in front
        if (
            player.facing === 1 &&
            dx < -30
        ) {
            return;
        }

        if (
            player.facing === -1 &&
            dx > 30
        ) {
            return;
        }

        const dist =
            Math.hypot(dx, dy);

        if (dist > 1100) {
            return;
        }

        // Prefer targets in front and closer
        const horizontalPenalty =
            Math.abs(dy) * 0.65;

        const scoreValue =
            dist +
            horizontalPenalty -
            size * 2;

        if (
            scoreValue <
            bestScore
        ) {

            bestScore = scoreValue;

            best = {
                target,
                x: targetX,
                y: targetY
            };

        }

    }

    enemies.forEach(function (enemy) {

        considerTarget(
            enemy,
            enemy.x +
                enemy.w / 2,
            enemy.y +
                enemy.h / 2,
            enemy.w
        );

    });

    if (boss) {

        considerTarget(
            boss,
            boss.x +
                boss.w / 2,
            boss.y +
                boss.h / 2,
            boss.w
        );

    }

    return best;

}

// ============================================================
// SHOOTING
// ============================================================

function shootTomato() {

    if (gameState !== "playing") {
        return;
    }

    if (player.attackCooldown > 0) {
        return;
    }

    if (
        tomatoes.length >=
        MAX_TOMATOES
    ) {
        return;
    }

    player.attackCooldown = 16;
    player.attackAnim = 12;

    const s = player.scale;

    const bodyW =
        player.baseWidth * s;

    const bodyH =
        player.baseHeight * s;

    const originX =
        player.x +
        (
            player.facing === 1
                ? bodyW * 0.98
                : -bodyW * 0.10
        );

    const originY =
        player.y +
        bodyH * 0.40;

    const target =
        getTarget();

    let targetX;
    let targetY;

    if (target) {

        targetX = target.x;
        targetY = target.y;

    } else {

        targetX =
            originX +
            player.facing * 500;

        targetY =
            originY;

    }

    const dx =
        targetX - originX;

    const dy =
        targetY - originY;

    const angle =
        Math.atan2(
            dy,
            Math.abs(dx)
        );

    player.aimAngle =
        player.facing === 1
            ? angle
            : -angle;

    const speed = 11.5;

    const directionX =
        dx / Math.max(
            1,
            Math.hypot(dx, dy)
        );

    const directionY =
        dy / Math.max(
            1,
            Math.hypot(dx, dy)
        );

    tomatoes.push({

        x: originX,
        y: originY,

        vx:
            directionX * speed,

        vy:
            directionY * speed,

        life: 120,

        target:
            target
                ? target.target
                : null,

        homing: true,

        radius:
            Math.max(
                7,
                10 * Math.min(s, 2)
            )

    });

}

// ============================================================
// TOMATO DRAWING
// ============================================================

function drawTomato(t) {

    const x =
        t.x - cameraX;

    const y =
        t.y;

    // trail
    ctx.save();

    ctx.globalAlpha = 0.25;

    ctx.fillStyle = "#ff7668";

    ctx.beginPath();

    ctx.arc(
        x - t.vx * 0.7,
        y - t.vy * 0.7,
        t.radius * 0.65,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // tomato
    const gradient =
        ctx.createRadialGradient(
            x - 3,
            y - 4,
            1,
            x,
            y,
            t.radius
        );

    gradient.addColorStop(
        0,
        "#ff8c7c"
    );

    gradient.addColorStop(
        0.55,
        "#ed4b3f"
    );

    gradient.addColorStop(
        1,
        "#b92e2e"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        t.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // leaf
    ctx.fillStyle = "#3f9b4a";

    ctx.beginPath();

    ctx.moveTo(
        x,
        y - t.radius * 0.65
    );

    ctx.lineTo(
        x - 7,
        y - t.radius * 1.15
    );

    ctx.lineTo(
        x,
        y - t.radius * 0.95
    );

    ctx.lineTo(
        x + 7,
        y - t.radius * 1.15
    );

    ctx.closePath();

    ctx.fill();

    // shine
    ctx.fillStyle =
        "rgba(255,255,255,0.55)";

    ctx.beginPath();

    ctx.arc(
        x - t.radius * 0.32,
        y - t.radius * 0.35,
        t.radius * 0.18,
        0,
        Math.PI * 2
    );

    ctx.fill();

}

// ============================================================
// ENEMY DRAWING
// ============================================================

function drawEnemy(e) {

    const x =
        e.x - cameraX;

    const y =
        e.y;

    ctx.save();

    // shadow
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#222";

    ctx.beginPath();

    ctx.ellipse(
        x + e.w / 2,
        GROUND_Y + 5,
        e.w * 0.42,
        6,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha = 1;

    // body
    const gradient =
        ctx.createRadialGradient(
            x + e.w * 0.35,
            y + e.h * 0.25,
            2,
            x + e.w / 2,
            y + e.h / 2,
            e.w
        );

    gradient.addColorStop(
        0,
        "#ffffff"
    );

    gradient.addColorStop(
        0.05,
        e.color
    );

    gradient.addColorStop(
        1,
        "#633"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.ellipse(
        x + e.w / 2,
        y + e.h / 2,
        e.w / 2,
        e.h / 2,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // vegetable leaves
    ctx.fillStyle = "#3f8f48";

    ctx.beginPath();

    ctx.ellipse(
        x + e.w * 0.32,
        y - 2,
        10,
        16,
        -0.5,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x + e.w * 0.55,
        y - 6,
        11,
        17,
        0,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x + e.w * 0.73,
        y - 2,
        10,
        16,
        0.5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // eyes
    ctx.fillStyle = "#fff";

    ctx.beginPath();

    ctx.ellipse(
        x + e.w * 0.34,
        y + e.h * 0.37,
        7,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x + e.w * 0.66,
        y + e.h * 0.37,
        7,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#35202a";

    ctx.beginPath();

    ctx.arc(
        x + e.w * 0.34,
        y + e.h * 0.39,
        3.5,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + e.w * 0.66,
        y + e.h * 0.39,
        3.5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // angry eyebrows
    ctx.strokeStyle = "#542633";
    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(
        x + e.w * 0.25,
        y + e.h * 0.27
    );

    ctx.lineTo(
        x + e.w * 0.40,
        y + e.h * 0.31
    );

    ctx.moveTo(
        x + e.w * 0.60,
        y + e.h * 0.31
    );

    ctx.lineTo(
        x + e.w * 0.75,
        y + e.h * 0.27
    );

    ctx.stroke();

    // mouth
    ctx.strokeStyle = "#542633";

    ctx.beginPath();

    ctx.arc(
        x + e.w / 2,
        y + e.h * 0.60,
        7,
        0,
        Math.PI
    );

    ctx.stroke();

    ctx.restore();

}

// ============================================================
// BOSS
// ============================================================

function drawBoss() {

    if (!boss) {
        return;
    }

    const x =
        boss.x - cameraX;

    const y =
        boss.y;

    ctx.save();

    // shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.22)";

    ctx.beginPath();

    ctx.ellipse(
        x + boss.w / 2,
        GROUND_Y + 7,
        boss.w * 0.42,
        13,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // body
    const gradient =
        ctx.createRadialGradient(
            x + boss.w * 0.35,
            y + boss.h * 0.25,
            5,
            x + boss.w / 2,
            y + boss.h / 2,
            boss.w
        );

    gradient.addColorStop(
        0,
        "#fff"
    );

    gradient.addColorStop(
        0.08,
        boss.color
    );

    gradient.addColorStop(
        1,
        "#522"
    );

    ctx.fillStyle = gradient;

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

    // giant leafy crown
    ctx.fillStyle = "#3d8743";

    for (let i = 0; i < 5; i++) {

        ctx.beginPath();

        ctx.ellipse(
            x +
                boss.w / 2 +
                (i - 2) * 23,
            y - 15 -
                Math.abs(i - 2) * 5,
            20,
            34,
            (i - 2) * 0.2,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

    // eyes
    ctx.fillStyle = "#fff";

    ctx.beginPath();

    ctx.arc(
        x + boss.w * 0.32,
        y + boss.h * 0.34,
        17,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + boss.w * 0.68,
        y + boss.h * 0.34,
        17,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#4a1c26";

    ctx.beginPath();

    ctx.arc(
        x + boss.w * 0.32,
        y + boss.h * 0.34,
        8,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + boss.w * 0.68,
        y + boss.h * 0.34,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // boss mouth
    ctx.fillStyle = "#35151b";

    ctx.beginPath();

    ctx.arc(
        x + boss.w / 2,
        y + boss.h * 0.61,
        25,
        0,
        Math.PI
    );

    ctx.fill();

    // teeth
    ctx.fillStyle = "#fff";

    for (let i = 0; i < 5; i++) {

        ctx.beginPath();

        ctx.moveTo(
            x + boss.w * 0.34 +
                i * 12,
            y + boss.h * 0.62
        );

        ctx.lineTo(
            x + boss.w * 0.39 +
                i * 12,
            y + boss.h * 0.72
        );

        ctx.lineTo(
            x + boss.w * 0.44 +
                i * 12,
            y + boss.h * 0.62
        );

        ctx.fill();

    }

    // boss health bar
    const barWidth = 300;
    const barHeight = 18;

    const barX =
        WIDTH / 2 -
        barWidth / 2;

    const barY = 22;

    ctx.fillStyle =
        "rgba(20,10,15,0.8)";

    ctx.fillRect(
        barX - 3,
        barY - 3,
        barWidth + 6,
        barHeight + 6
    );

    ctx.fillStyle = "#c72f42";

    ctx.fillRect(
        barX,
        barY,
        barWidth *
            clamp(
                boss.hp /
                boss.maxHp,
                0,
                1
            ),
        barHeight
    );

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        barX,
        barY,
        barWidth,
        barHeight
    );

    ctx.fillStyle = "#fff";
    ctx.font =
        "bold 14px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        boss.name,
        WIDTH / 2,
        barY + 14
    );

    ctx.restore();

}

// ============================================================
// FOOD
// ============================================================

function drawFood(f) {

    const x =
        f.x - cameraX;

    const y =
        f.y;

    ctx.save();

    // glow
    ctx.globalAlpha = 0.22;

    ctx.fillStyle = "#ffd86b";

    ctx.beginPath();

    ctx.arc(
        x + 16,
        y + 13,
        30,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha = 1;

    // bowl
    ctx.fillStyle = "#e79a38";

    ctx.beginPath();

    ctx.ellipse(
        x + 16,
        y + 15,
        22,
        15,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#f5c15a";

    ctx.beginPath();

    ctx.ellipse(
        x + 16,
        y + 10,
        18,
        10,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // steam
    ctx.strokeStyle =
        "rgba(255,255,255,0.65)";

    ctx.lineWidth = 2;

    for (let i = 0; i < 3; i++) {

        ctx.beginPath();

        ctx.moveTo(
            x + 8 + i * 8,
            y + 1
        );

        ctx.quadraticCurveTo(
            x + 4 + i * 8,
            y - 9,
            x + 10 + i * 8,
            y - 16
        );

        ctx.stroke();

    }

    ctx.restore();

}

// ============================================================
// WORLD DECOR
// ============================================================

function drawWorldDecor() {

    // Trees
    for (
        let i = 0;
        i < 15;
        i++
    ) {

        const worldX =
            i * 330 + 100;

        const screenX =
            worldX -
            cameraX * 0.55;

        if (
            screenX > -150 &&
            screenX < WIDTH + 150
        ) {

            drawTree(
                screenX,
                400,
                0.7 +
                (i % 3) * 0.12
            );

        }

    }

    // Flowers
    for (
        let i = 0;
        i < 50;
        i++
    ) {

        const worldX =
            i * 105 + 30;

        const screenX =
            worldX -
            cameraX * 0.82;

        if (
            screenX > -30 &&
            screenX < WIDTH + 30
        ) {

            const theme =
                LEVEL_THEMES[
                    level - 1
                ] ||
                LEVEL_THEMES[0];

            drawFlower(
                screenX,
                GROUND_Y -
                8 -
                (i % 3) * 4,
                0.45 +
                (i % 2) * 0.2,
                theme.flower
            );

        }

    }

}

// ============================================================
// TITLE
// ============================================================

function drawTitleScreen() {

    const theme =
        LEVEL_THEMES[0];

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            HEIGHT
        );

    gradient.addColorStop(
        0,
        theme.skyTop
    );

    gradient.addColorStop(
        1,
        theme.skyBottom
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    drawSun();

    drawCloud(
        130,
        90,
        1
    );

    drawCloud(
        680,
        85,
        0.8
    );

    drawCloud(
        430,
        135,
        0.7
    );

    // hills
    ctx.fillStyle =
        "#8bc77d";

    ctx.beginPath();

    ctx.moveTo(0, 440);

    for (
        let x = 0;
        x <= WIDTH;
        x += 40
    ) {

        ctx.lineTo(
            x,
            400 +
            Math.sin(x * 0.008) * 35
        );

    }

    ctx.lineTo(
        WIDTH,
        HEIGHT
    );

    ctx.lineTo(
        0,
        HEIGHT
    );

    ctx.closePath();

    ctx.fill();

    ctx.globalAlpha =
        titleAlpha;

    // title shadow
    ctx.textAlign = "center";

    ctx.font =
        "bold 76px Georgia, serif";

    ctx.fillStyle =
        "rgba(80,35,60,0.22)";

    ctx.fillText(
        "Lovey's Delight",
        WIDTH / 2 + 4,
        210 + 6
    );

    // title
    ctx.fillStyle =
        "#ff6fae";

    ctx.strokeStyle =
        "#fff";

    ctx.lineWidth = 5;

    ctx.strokeText(
        "Lovey's Delight",
        WIDTH / 2,
        210
    );

    ctx.fillText(
        "Lovey's Delight",
        WIDTH / 2,
        210
    );

    ctx.font =
        "italic 22px Georgia, serif";

    ctx.fillStyle =
        "#593b4a";

    ctx.fillText(
        "A little adventure with a very big Lovey",
        WIDTH / 2,
        258
    );

    // button
    const pulse =
        1 +
        Math.sin(frame * 0.06) *
        0.025;

    ctx.save();

    ctx.translate(
        WIDTH / 2,
        360
    );

    ctx.scale(
        pulse,
        pulse
    );

    ctx.fillStyle =
        "#ff78b7";

    ctx.strokeStyle =
        "#fff";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.roundRect(
        -145,
        -38,
        290,
        76,
        25
    );

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 27px Arial";

    ctx.fillText(
        "PRESS ANY KEY",
        0,
        9
    );

    ctx.restore();

    ctx.font =
        "16px Arial";

    ctx.fillStyle =
        "#493844";

    ctx.fillText(
        "A / D or Arrow Keys to move",
        WIDTH / 2,
        455
    );

    ctx.fillText(
        "Space to jump   •   J / K to throw tomatoes",
        WIDTH / 2,
        482
    );

    ctx.globalAlpha = 1;

}

// ============================================================
// GAME DRAW
// ============================================================

function drawBackground() {

    const theme =
        LEVEL_THEMES[
            level - 1
        ] ||
        LEVEL_THEMES[0];

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            HEIGHT
        );

    gradient.addColorStop(
        0,
        theme.skyTop
    );

    gradient.addColorStop(
        1,
        theme.skyBottom
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    drawSun();

    // distant clouds
    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const x =
            i * 300 -
            cameraX * 0.12;

        drawCloud(
            x,
            70 +
            (i % 3) * 32,
            0.7 +
            (i % 2) * 0.2
        );

    }

    // far hills
    ctx.fillStyle =
        theme.farHill;

    ctx.beginPath();

    ctx.moveTo(
        0,
        450
    );

    for (
        let x = 0;
        x <= WIDTH;
        x += 35
    ) {

        ctx.lineTo(
            x,
            390 +
            Math.sin(
                (
                    x +
                    cameraX * 0.18
                ) * 0.008
            ) * 42
        );

    }

    ctx.lineTo(
        WIDTH,
        HEIGHT
    );

    ctx.lineTo(
        0,
        HEIGHT
    );

    ctx.closePath();

    ctx.fill();

    // near hills
    ctx.fillStyle =
        theme.nearHill;

    ctx.beginPath();

    ctx.moveTo(
        0,
        470
    );

    for (
        let x = 0;
        x <= WIDTH;
        x += 30
    ) {

        ctx.lineTo(
            x,
            430 +
            Math.sin(
                (
                    x +
                    cameraX * 0.3
                ) * 0.011
            ) * 45
        );

    }

    ctx.lineTo(
        WIDTH,
        HEIGHT
    );

    ctx.lineTo(
        0,
        HEIGHT
    );

    ctx.closePath();

    ctx.fill();

    drawWorldDecor();

    // ground
    ctx.fillStyle =
        theme.ground;

    ctx.fillRect(
        0,
        GROUND_Y,
        WIDTH,
        HEIGHT - GROUND_Y
    );

    // grass edge
    ctx.strokeStyle =
        "#376f35";

    ctx.lineWidth = 2;

    for (
        let x = 0;
        x < WIDTH;
        x += 14
    ) {

        const xx =
            x -
            cameraX % 14;

        ctx.beginPath();

        ctx.moveTo(
            xx,
            GROUND_Y + 1
        );

        ctx.lineTo(
            xx + 3,
            GROUND_Y - 9
        );

        ctx.lineTo(
            xx + 7,
            GROUND_Y + 1
        );

        ctx.stroke();

    }

}

// ============================================================
// HUD
// ============================================================

function drawHUD() {

    if (gameState !== "playing") {
        return;
    }

    ctx.save();

    // health bar
    ctx.fillStyle =
        "rgba(50,25,35,0.75)";

    ctx.beginPath();

    ctx.roundRect(
        18,
        18,
        190,
        32,
        14
    );

    ctx.fill();

    ctx.fillStyle =
        "#f05b78";

    ctx.beginPath();

    ctx.roundRect(
        23,
        23,
        180 *
            clamp(
                player.health /
                player.maxHealth,
                0,
                1
            ),
        22,
        10
    );

    ctx.fill();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font =
        "bold 14px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "LOVEY",
        113,
        39
    );

    // Level badge
    ctx.fillStyle =
        "rgba(255,255,255,0.82)";

    ctx.beginPath();

    ctx.roundRect(
        225,
        18,
        105,
        32,
        14
    );

    ctx.fill();

    ctx.fillStyle =
        "#543848";

    ctx.fillText(
        "LEVEL " + level,
        277,
        39
    );

    // Score badge
    ctx.fillStyle =
        "rgba(255,255,255,0.82)";

    ctx.beginPath();

    ctx.roundRect(
        345,
        18,
        130,
        32,
        14
    );

    ctx.fill();

    ctx.fillStyle =
        "#543848";

    ctx.fillText(
        "♥ " + score,
        410,
        39
    );

    ctx.restore();

}

// ============================================================
// DRAW
// ============================================================

function draw() {

    if (gameState === "title") {

        drawTitleScreen();

        return;
    }

    drawBackground();

    foods.forEach(drawFood);
    tomatoes.forEach(drawTomato);
    enemies.forEach(drawEnemy);

    drawBoss();

    drawPlayer();

    // particles
    particles.forEach(function (p) {

        ctx.save();

        ctx.globalAlpha =
            clamp(
                p.life /
                p.maxLife,
                0,
                1
            );

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

        ctx.restore();

    });

    drawHUD();

    // game over
    if (gameState === "gameover") {

        ctx.fillStyle =
            "rgba(30,15,25,0.52)";

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        ctx.textAlign = "center";

        ctx.fillStyle = "#fff";

        ctx.font =
            "bold 58px Georgia, serif";

        ctx.fillText(
            "GAME OVER",
            WIDTH / 2,
            260
        );

        ctx.font =
            "22px Arial";

        ctx.fillText(
            "Press R to play again",
            WIDTH / 2,
            315
        );

    }

    // victory
    if (gameState === "victory") {

        ctx.fillStyle =
            "rgba(255,235,247,0.58)";

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        ctx.textAlign = "center";

        ctx.fillStyle =
            "#e45a9d";

        ctx.font =
            "bold 64px Georgia, serif";

        ctx.fillText(
            "YOU WIN!",
            WIDTH / 2,
            250
        );

        ctx.fillStyle =
            "#543848";

        ctx.font =
            "24px Georgia, serif";

        ctx.fillText(
            "Lovey is absolutely delighted.",
            WIDTH / 2,
            300
        );

        ctx.font =
            "18px Arial";

        ctx.fillText(
            "Press R to play again",
            WIDTH / 2,
            345
        );

    }

}

// ============================================================
// UPDATE
// ============================================================

function update() {

    if (gameState === "title") {

        titleAlpha =
            Math.min(
                1,
                titleAlpha + 0.025
            );

        return;
    }

    if (gameState !== "playing") {
        return;
    }

    frame++;

    // --------------------------------------------------------
    // MOVEMENT
    // --------------------------------------------------------

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

    player.x += player.vx;

    player.x =
        clamp(
            player.x,
            0,
            levelLength + 350
        );

    // gravity
    player.vy += 0.55;

    player.y += player.vy;

    const playerHeight =
        player.baseHeight *
        player.scale;

    if (
        player.y +
        playerHeight >
        GROUND_Y
    ) {

        player.y =
            GROUND_Y -
            playerHeight;

        player.vy = 0;

        player.onGround = true;

    } else {

        player.onGround = false;

    }

    cameraX =
        Math.max(
            0,
            player.x - 300
        );

    // --------------------------------------------------------
    // ATTACK
    // --------------------------------------------------------

    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    }

    if (player.attackAnim > 0) {
        player.attackAnim--;
    }

    if (player.invincible > 0) {
        player.invincible--;
    }

    // --------------------------------------------------------
    // AIM INDICATOR
    // --------------------------------------------------------

    const currentTarget =
        getTarget();

    if (currentTarget) {

        const originX =
            player.x +
            player.facing *
            player.baseWidth *
            player.scale;

        const originY =
            player.y +
            player.baseHeight *
            player.scale *
            0.4;

        player.aimAngle =
            Math.atan2(
                currentTarget.y -
                    originY,
                Math.abs(
                    currentTarget.x -
                    originX
                )
            );

    } else {

        player.aimAngle = 0;

    }

    // --------------------------------------------------------
    // TOMATOES
    // --------------------------------------------------------

    for (
        let i =
            tomatoes.length - 1;
        i >= 0;
        i--
    ) {

        const t =
            tomatoes[i];

        // Homing
        if (
            t.homing &&
            t.target
        ) {

            let tx;
            let ty;

            if (
                t.target === boss &&
                boss
            ) {

                tx =
                    boss.x +
                    boss.w / 2;

                ty =
                    boss.y +
                    boss.h / 2;

            } else if (
                enemies.includes(
                    t.target
                )
            ) {

                tx =
                    t.target.x +
                    t.target.w / 2;

                ty =
                    t.target.y +
                    t.target.h / 2;

            } else {

                t.target = null;

            }

            if (t.target) {

                const dx =
                    tx - t.x;

                const dy =
                    ty - t.y;

                const distanceToTarget =
                    Math.hypot(
                        dx,
                        dy
                    );

                if (
                    distanceToTarget > 1
                ) {

                    const desiredX =
                        dx /
                        distanceToTarget *
                        11.5;

                    const desiredY =
                        dy /
                        distanceToTarget *
                        11.5;

                    t.vx +=
                        (
                            desiredX -
                            t.vx
                        ) * 0.12;

                    t.vy +=
                        (
                            desiredY -
                            t.vy
                        ) * 0.12;

                }

            }

        }

        t.x += t.vx;
        t.y += t.vy;

        t.life--;

        let hit = false;

        // enemies
        for (
            let j =
                enemies.length - 1;
            j >= 0;
            j--
        ) {

            const e =
                enemies[j];

            if (
                distance(
                    t.x,
                    t.y,
                    e.x +
                        e.w / 2,
                    e.y +
                        e.h / 2
                ) <
                e.w * 0.65
            ) {

                e.hp -= 20;

                spawnParticles(
                    t.x,
                    t.y,
                    "#ff6b5e",
                    12
                );

                hit = true;

                if (e.hp <= 0) {

                    createFood(
                        e.x,
                        e.y
                    );

                    score += 40;

                    spawnParticles(
                        e.x +
                            e.w / 2,
                        e.y +
                            e.h / 2,
                        e.color,
                        22
                    );

                    enemies.splice(
                        j,
                        1
                    );

                }

                break;

            }

        }

        // boss
        if (
            !hit &&
            boss &&
            distance(
                t.x,
                t.y,
                boss.x +
                    boss.w / 2,
                boss.y +
                    boss.h / 2
            ) <
            boss.w * 0.55
        ) {

            boss.hp -= 15;

            spawnParticles(
                t.x,
                t.y,
                "#ff6b5e",
                14
            );

            hit = true;

            if (
                boss.hp <= 0 &&
                !levelTransitioning
            ) {

                score += 500;

                spawnParticles(
                    boss.x +
                        boss.w / 2,
                    boss.y +
                        boss.h / 2,
                    boss.color,
                    45
                );

                createFood(
                    boss.x,
                    boss.y
                );

                boss = null;

                levelTransitioning =
                    true;

                showMessage(
                    "BOSS DEFEATED!",
                    2000
                );

                setTimeout(
                    nextLevel,
                    2200
                );

            }

        }

        if (
            hit ||
            t.life <= 0 ||
            t.x <
                cameraX - 300 ||
            t.x >
                cameraX +
                WIDTH +
                500
        ) {

            tomatoes.splice(
                i,
                1
            );

        }

    }

    // --------------------------------------------------------
    // ENEMY SPAWNING
    // --------------------------------------------------------

    const now =
        performance.now();

    const spawnDelay =
        4200 +
        level * 600;

    if (
        now -
            lastEnemySpawn >
            spawnDelay &&
        player.x <
            levelLength - 500 &&
        enemies.length <
            MAX_ENEMIES
    ) {

        spawnEnemy();

        lastEnemySpawn =
            now;

    }

    // --------------------------------------------------------
    // ENEMY MOVEMENT
    // --------------------------------------------------------

    enemies.forEach(function (e) {

        const dx =
            player.x -
            e.x;

        if (
            Math.abs(dx) > 10
        ) {

            e.x +=
                Math.sign(dx) *
                e.speed;

        }

    });

    // --------------------------------------------------------
    // BOSS
    // --------------------------------------------------------

    if (
        !boss &&
        !bossSpawned &&
        !levelTransitioning &&
        player.x >
            levelLength - 180
    ) {

        spawnBoss();

    }

    if (boss) {

        const dx =
            player.x -
            boss.x;

        boss.x +=
            Math.sign(dx) *
            boss.speed;

    }

    // --------------------------------------------------------
    // FOOD
    // --------------------------------------------------------

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

        f.y += f.vy;

        f.vy += 0.22;

        if (
            f.y >
            GROUND_Y - 25
        ) {

            f.y =
                GROUND_Y - 25;

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

        if (
            distance(
                f.x + 16,
                f.y + 12,
                player.x +
                    pw / 2,
                player.y +
                    ph / 2
            ) <
            pw * 0.65 + 25
        ) {

            player.scale =
                Math.min(
                    5,
                    player.scale +
                    0.14
                );

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
                player.x +
                    pw / 2,
                player.y +
                    ph / 2,
                "#ffd65c",
                20
            );

            showMessage(
                "SHE'S GROWING!",
                700
            );

        }

    }

    // --------------------------------------------------------
    // ENEMY DAMAGE
    // --------------------------------------------------------

    enemies.forEach(function (e) {

        if (
            player.invincible <= 0 &&
            distance(
                e.x +
                    e.w / 2,
                e.y +
                    e.h / 2,
                player.x +
                    pw / 2,
                player.y +
                    ph / 2
            ) <
            pw * 0.48 +
            e.w * 0.42
        ) {

            player.health -= 10;

            player.invincible = 50;

            spawnParticles(
                player.x +
                    pw / 2,
                player.y +
                    ph / 2,
                "#ff4568",
                12
            );

            if (
                player.health <= 0
            ) {

                gameState =
                    "gameover";

                bgm.pause();

                showMessage(
                    "GAME OVER",
                    99999
                );

            }

        }

    });

    // --------------------------------------------------------
    // BOSS DAMAGE
    // --------------------------------------------------------

    if (
        boss &&
        player.invincible <= 0 &&
        distance(
            boss.x +
                boss.w / 2,
            boss.y +
                boss.h / 2,
            player.x +
                pw / 2,
            player.y +
                ph / 2
        ) <
        pw * 0.45 +
        boss.w * 0.4
    ) {

        player.health -= 16;

        player.invincible = 60;

        spawnParticles(
            player.x +
                pw / 2,
            player.y +
                ph / 2,
            "#ff4568",
            15
        );

        if (
            player.health <= 0
        ) {

            gameState =
                "gameover";

            bgm.pause();

            showMessage(
                "GAME OVER",
                99999
            );

        }

    }

    // --------------------------------------------------------
    // PARTICLES
    // --------------------------------------------------------

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

        p.vy += 0.15;

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

    // --------------------------------------------------------
    // UI
    // --------------------------------------------------------

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

    levelEl.textContent =
        level;

}

// ============================================================
// ENEMIES
// ============================================================

function spawnEnemy() {

    if (
        enemies.length >=
        MAX_ENEMIES
    ) {
        return;
    }

    const colors = [
        "#e45757",
        "#5aa65b",
        "#e7bd45",
        "#9b68bd",
        "#df7b3d"
    ];

    enemies.push({

        x:
            player.x +
            760 +
            rand(
                0,
                180
            ),

        y:
            GROUND_Y - 52,

        w: 52,
        h: 52,

        hp:
            35 +
            level * 14,

        speed:
            1.0 +
            Math.random() *
            0.7,

        color:
            colors[
                randInt(
                    0,
                    colors.length - 1
                )
            ]

    });

}

// ============================================================
// BOSS
// ============================================================

function spawnBoss() {

    if (
        boss ||
        bossSpawned
    ) {
        return;
    }

    bossSpawned = true;

    const bosses = [

        {
            name:
                "Giant Tomato Tyrant",
            color:
                "#c83d43",
            hp:
                300
        },

        {
            name:
                "Broccoli Behemoth",
            color:
                "#3d9149",
            hp:
                420
        },

        {
            name:
                "Pumpkin Overlord",
            color:
                "#df7d35",
            hp:
                560
        }

    ];

    const b =
        bosses[
            level - 1
        ] ||
        bosses[0];

    boss = {

        x:
            levelLength + 180,

        y: 325,

        w: 155,
        h: 165,

        hp: b.hp,
        maxHp: b.hp,

        color: b.color,

        speed:
            0.85,

        name: b.name

    };

    showMessage(
        "BOSS: " + b.name,
        2400
    );

}

// ============================================================
// FOOD
// ============================================================

function createFood(
    x,
    y
) {

    foods.push({

        x,
        y,

        vy: -3.5,

        life: 800

    });

}

// ============================================================
// NEXT LEVEL
// ============================================================

function nextLevel() {

    if (
        !levelTransitioning
    ) {
        return;
    }

    level++;

    if (
        level > 3
    ) {

        gameState =
            "victory";

        bgm.pause();

        messageEl.style.display =
            "none";

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
    tomatoes = [];
    foods = [];
    particles = [];

    boss = null;
    bossSpawned = false;

    levelTransitioning =
        false;

    levelLength =
        3800 +
        level * 500;

    lastEnemySpawn =
        performance.now();

    showMessage(
        "LEVEL " + level,
        1600
    );

}

// ============================================================
// START
// ============================================================

function startGame() {

    gameState =
        "playing";

    uiEl.style.display =
        "block";

    messageEl.style.display =
        "none";

    score = 0;
    level = 1;

    frame = 0;

    cameraX = 0;

    levelLength = 3800;

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

    player.facing = 1;
    player.aimAngle = 0;

    enemies = [];
    tomatoes = [];
    foods = [];
    particles = [];

    boss = null;

    bossSpawned = false;
    levelTransitioning = false;

    lastEnemySpawn =
        performance.now();

    levelEl.textContent = "1";
    healthEl.textContent = "100";
    sizeEl.textContent = "1.0";
    scoreEl.textContent = "0";

    bgm.pause();

    bgm.currentTime = 0;

    bgm.play().catch(
        function () {}
    );

    showMessage(
        "GO!",
        900
    );

}

// ============================================================
// MAIN LOOP
// ============================================================

function loop() {

    try {

        update();
        draw();

    } catch (error) {

        console.error(
            "Lovey's Delight error:",
            error
        );

    }

    requestAnimationFrame(loop);

}

// ============================================================
// INITIALIZE
// ============================================================

uiEl.style.display =
    "none";

messageEl.style.display =
    "none";

drawTitleScreen();

requestAnimationFrame(loop);
