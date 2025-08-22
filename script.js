// ============== DOM ELEMENTS ==============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const gameControls = document.getElementById('game-controls');
const upButton = document.getElementById('upButton');
const downButton = document.getElementById('downButton');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const shootButton = document.getElementById('shootButton');
const scoreDisplay = document.getElementById('score-display');
const livesDisplay = document.getElementById('lives-display');
const highScoreDisplay = document.getElementById('high-score-display');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageButton = document.getElementById('message-button');

// ============== IMAGE LOADING ==============
const images = {
    player: null,
    bg: null,
    enemies: [],
    shield: null,
    rapidFire: null,
    bullet: null,
    bulletRapid: null,
    explosion: null,
    boss: null,
    bossGun: null, // NEW: เพิ่มภาพไอเท็มและกระสุนปืนยิงบอส
    gunufo: null
};

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(`Failed to load image: ${src}`);
        img.src = src;
    });
}

const imageSources = {
    player: './img/sprite.png',
    bg: './img/bg.jpg',
    enemy1: './img/enemy1.png',
    enemy2: './img/enemy2.png',
    enemy3: './img/enemy3.png',
    shield: './img/shield.png',
    rapidFire: './img/rapid-fire.png',
    bullet: './img/fire.png',
    bulletRapid: './img/fire2.png',
    explosion: './img/boom.png',
    boss: './img/boss.png',
    bossGun: './img/shootboss.png', // NEW: เพิ่ม path ของภาพปืนยิงบอส
    gunufo: './img/gunufo.png'
};

Promise.all([
    loadImage(imageSources.player),
    loadImage(imageSources.bg),
    loadImage(imageSources.enemy1),
    loadImage(imageSources.enemy2),
    loadImage(imageSources.enemy3),
    loadImage(imageSources.shield),
    loadImage(imageSources.rapidFire),
    loadImage(imageSources.bullet),
    loadImage(imageSources.bulletRapid),
    loadImage(imageSources.explosion),
    loadImage(imageSources.boss),
    loadImage(imageSources.bossGun),
    loadImage(imageSources.gunufo) // ตัวสุดท้าย
]).then(([playerImg, bgImg, enemy1Img, enemy2Img, enemy3Img, shieldImg, rapidFireImg, bulletImg, bulletRapidImg, explosionImg, bossImg, bossGunImg, gunufoImg]) => { // เพิ่มตัวแปร gunufoImg
    images.player = playerImg;
    images.bg = bgImg;
    images.enemies = [enemy1Img, enemy2Img, enemy3Img];
    images.shield = shieldImg;
    images.rapidFire = rapidFireImg;
    images.bullet = bulletImg;
    images.bulletRapid = bulletRapidImg;
    images.explosion = explosionImg;
    images.boss = bossImg;
    images.bossGun = bossGunImg;
    images.gunufo = gunufoImg;

    console.log("All images loaded successfully.");
    startButton.disabled = false;
    startButton.textContent = 'Start';
    resizeCanvas();
}).catch(error => {
    console.error(error);
    startButton.textContent = 'There was an error loading.';
    startButton.disabled = true;
});


// ============== SOUNDS ==============
const normalShootSound = new Audio('sound/shoot.mp3');
const rapidFireShootSound = new Audio('sound/shoot2.mp3');
const explosionSound = new Audio('sound/expo.mp3');
const backgroundMusic = new Audio('sound/funny.mp3');
backgroundMusic.loop = true;
const playerHitSound = new Audio('sound/spritexpo.mp3');
const powerUpSound = new Audio('sound/powerup.mp3');
const bossGunSound = new Audio('sound/gunboss.mp3'); // NEW: เพิ่มเสียงปืนยิงบอส
const bossBulletSound = new Audio('sound/soundgunufo.mp3');

// ============== GAME STATE & VARIABLES ==============
let gameActive = false;
let animationFrameId;
let score = 0;
let lives = 3; 
let highScore = 0;
let obstacleSpawnInterval;
let powerUpSpawnInterval;
let rapidFireTimeout;
let bossGunTimeout; // NEW: ตัวจับเวลาสำหรับปืนยิงบอส

const player = { x: 0, y: 0, width: 40, height: 40, speed: 5, isShielded: false, rapidFireActive: false, hasBossGun: false }; // NEW: hasBossGun state
let canShoot = true;

let bullets = [];
const bulletProperties = { width: 10, height: 20, speed: 7 };

let obstacles = [];
let powerUps = [];
let explosions = [];
let obstacleProperties = { width: 40, height: 40, speed: 2 };
let spawnRate = 1000;
let difficultyThreshold = 1000;

let isBossActive = false;
let boss = {};
let bossBullets = [];
const BOSS_SPAWN_SCORE = 3000;
let nextBossScore = BOSS_SPAWN_SCORE;

let rightPressed = false, leftPressed = false, upPressed = false, downPressed = false;

// ============== HIGH SCORE FUNCTIONS ==============
function loadHighScore() {
    highScore = localStorage.getItem('endlessShooterHighScore') || 0;
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

function checkAndSaveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('endlessShooterHighScore', highScore);
        highScoreDisplay.textContent = `High Score: ${highScore}`;
    }
}

// ============== EVENT LISTENERS (No changes) ==============
document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') { rightPressed = true; } 
    else if (e.key === 'Left' || e.key === 'ArrowLeft') { leftPressed = true; } 
    else if (e.key === 'Up' || e.key === 'ArrowUp') { upPressed = true; } 
    else if (e.key === 'Down' || e.key === 'ArrowDown') { downPressed = true; } 
    else if (e.key === ' ' && gameActive) { shoot(); }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') { rightPressed = false; } 
    else if (e.key === 'Left' || e.key === 'ArrowLeft') { leftPressed = false; } 
    else if (e.key === 'Up' || e.key === 'ArrowUp') { upPressed = false; } 
    else if (e.key === 'Down' || e.key === 'ArrowDown') { downPressed = false; }
});
upButton.addEventListener('mousedown', () => upPressed = true);
upButton.addEventListener('mouseup', () => upPressed = false);
upButton.addEventListener('touchstart', (e) => { e.preventDefault(); upPressed = true; });
upButton.addEventListener('touchend', (e) => { e.preventDefault(); upPressed = false; });
downButton.addEventListener('mousedown', () => downPressed = true);
downButton.addEventListener('mouseup', () => downPressed = false);
downButton.addEventListener('touchstart', (e) => { e.preventDefault(); downPressed = true; });
downButton.addEventListener('touchend', (e) => { e.preventDefault(); downPressed = false; });
leftButton.addEventListener('mousedown', () => leftPressed = true);
leftButton.addEventListener('mouseup', () => leftPressed = false);
leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); leftPressed = true; });
leftButton.addEventListener('touchend', (e) => { e.preventDefault(); leftPressed = false; });
rightButton.addEventListener('mousedown', () => rightPressed = true);
rightButton.addEventListener('mouseup', () => rightPressed = false);
rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); rightPressed = true; });
rightButton.addEventListener('touchend', (e) => { e.preventDefault(); rightPressed = false; });
shootButton.addEventListener('click', shoot);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);
let touchStartX = 0, touchStartY = 0;
function handleTouchStart(e) { e.preventDefault(); const touch = e.touches[0]; touchStartX = touch.clientX; touchStartY = touch.clientY; }
function handleTouchMove(e) { e.preventDefault(); const touch = e.touches[0]; const moveDistanceX = touch.clientX - touchStartX; const moveDistanceY = touch.clientY - touchStartY; const threshold = 10; leftPressed = false; rightPressed = false; upPressed = false; downPressed = false; if (Math.abs(moveDistanceX) > Math.abs(moveDistanceY) && Math.abs(moveDistanceX) > threshold) { if (moveDistanceX > 0) { rightPressed = true; } else { leftPressed = true; } } else if (Math.abs(moveDistanceY) > Math.abs(moveDistanceX) && Math.abs(moveDistanceY) > threshold) { if (moveDistanceY > 0) { downPressed = true; } else { upPressed = true; } } }
function handleTouchEnd(e) { e.preventDefault(); leftPressed = false; rightPressed = false; upPressed = false; downPressed = false; }

// ============== GAME LOGIC FUNCTIONS ==============
function initGame() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 50;
    obstacles = [];
    powerUps = [];
    bullets = [];
    explosions = []; 
    bossBullets = [];
    isBossActive = false;
    boss = {};
    if (boss.shootInterval) clearInterval(boss.shootInterval);
    player.isShielded = false;
    player.rapidFireActive = false;
    player.hasBossGun = false;
    canShoot = true;
    clearTimeout(rapidFireTimeout);
    clearTimeout(bossGunTimeout);
    score = 0;
    // ลบบรรทัดนี้ออก
    // lives = 3; 
    obstacleProperties.speed = 2;
    spawnRate = 1000;
    difficultyThreshold = 1000;
    nextBossScore = BOSS_SPAWN_SCORE;
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;
}

// ... (drawPlayer, drawObstacles, drawBullets, drawPowerUps, drawExplosions, spawnExplosion functions remain the same) ...
function drawPlayer() { 
    if (!images.player) return;
    if (player.hasBossGun) { // NEW: Visual effect for boss gun
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 69, 0, 0.5)'; // Orange glow
        ctx.fill();
        ctx.closePath();
    } else if (player.rapidFireActive) {
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 159, 64, 0.5)';
        ctx.fill();
        ctx.closePath();
    }
    if (player.isShielded) {
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(52, 144, 220, 0.5)';
        ctx.fill();
        ctx.closePath();
    }
    ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
}
function drawObstacles() { 
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        if (obstacle.isTough && obstacle.hp > 1) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    });
}
function drawBullets() { 
    bullets.forEach(bullet => {
        ctx.drawImage(bullet.img, bullet.x, bullet.y, bullet.width, bullet.height);
    });
}
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.drawImage(powerUp.img, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
}
function drawExplosions() {
    explosions.forEach(explosion => {
        ctx.drawImage(images.explosion, explosion.x, explosion.y, explosion.width, explosion.height);
    });
}
function spawnExplosion(x, y, size = 'normal') {
    const explosionSize = size === 'large' ? 100 : obstacleProperties.width;
    explosions.push({
        x: x,
        y: y,
        width: explosionSize,
        height: explosionSize,
        timer: 15 
    });
}

// ... (All Boss Functions remain the same) ...
function spawnBoss() {
    isBossActive = true;
    obstacles = [];
    powerUps = [];
    clearInterval(obstacleSpawnInterval);
    clearInterval(powerUpSpawnInterval);

    boss = {
        x: canvas.width / 2 - 50,
        y: -100,
        width: 100,
        height: 100,
        speed: 2,
        dx: 2,
        hp: 100,
        maxHp: 100,
        isEntering: true,
        shootInterval: null
    };

    setTimeout(() => {
        boss.isEntering = false;
        boss.shootInterval = setInterval(() => {
    if (isBossActive) {
        bossBullets.push({
            x: boss.x + boss.width / 2 - 10, // ปรับให้ตรงกลาง boss
            y: boss.y + boss.height,
            width: 20,
            height: 20,
            speed: 4
        });
        // เล่นเสียงทุกครั้งที่ spawn bullet
        bossBulletSound.currentTime = 0;
        bossBulletSound.play();
    }
}, 1500);

        // NEW: เริ่มสร้าง Power-up เฉพาะตอนสู้บอส
        powerUpSpawnInterval = setInterval(spawnPowerUp, 8000); // 8 วินาทีเกิดที
    }, 2000);
}
function updateBoss() {
    if (!isBossActive) return;
    if (boss.isEntering && boss.y < 50) {
        boss.y += 1;
        return;
    }
    
    boss.x += boss.dx;
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
        boss.dx *= -1;
    }

    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const bBullet = bossBullets[i];
        bBullet.y += bBullet.speed;
        if (bBullet.y > canvas.height) {
            bossBullets.splice(i, 1);
        }
    }
}
function drawBoss() {
    if (!isBossActive) return;
    ctx.drawImage(images.boss, boss.x, boss.y, boss.width, boss.height);
}
function drawBossHealthBar() {
    if (!isBossActive) return;
    const barWidth = canvas.width * 0.8;
    const barHeight = 20;
    const x = canvas.width / 2 - barWidth / 2;
    const y = 10;
    const hpPercentage = boss.hp / boss.maxHp;

    ctx.fillStyle = '#444';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, barWidth * hpPercentage, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.strokeRect(x, y, barWidth, barHeight);
}
function drawBossBullets() {
    bossBullets.forEach(bBullet => {
        if (images.gunufo) {
            ctx.drawImage(images.gunufo, bBullet.x, bBullet.y, 20, 20);
        } else {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(bBullet.x, bBullet.y, bBullet.width, bBullet.height);
        }
    });
}

function defeatBoss() {
    isBossActive = false;
    clearInterval(boss.shootInterval);
    clearInterval(powerUpSpawnInterval);
    boss = {};
    bossBullets = [];
    
    spawnExplosion(player.x - 25, player.y - 100, 'large');
    score += 2000;
    scoreDisplay.textContent = `Score: ${score}`;

    lives = 1; 
    
    gameActive = false;
    cancelAnimationFrame(animationFrameId);
    backgroundMusic.pause();
    messageBox.style.display = 'block';
    gameControls.classList.add('hidden');
    startButton.classList.remove('hidden');
    checkAndSaveHighScore();
    
    // ตั้งค่าข้อความเมื่อชนะ
    document.getElementById('message-title').textContent = 'You Win!'; 
    messageText.textContent = `You have defeated the boss! Your score: ${score}`;

    messageButton.textContent = 'Continue'; 
    messageButton.onclick = () => {
        messageBox.style.display = 'none';
        gameActive = true;
        
        nextBossScore += BOSS_SPAWN_SCORE + 2000;
        obstacleProperties.speed += 0.5;
        if (spawnRate > 400) spawnRate -= 100;
        
        startGameSpawners();
        backgroundMusic.play();
        update();
    };
}

function startGameSpawners() {
    obstacleProperties.speed += 0.2;
    if (spawnRate > 400) spawnRate -= 50;

    obstacleSpawnInterval = setInterval(spawnObstacle, spawnRate);
    powerUpSpawnInterval = setInterval(spawnPowerUp, 15000);
}

// --- SHOOT FUNCTION (MAJOR CHANGE) ---
function shoot() {
    if (!canShoot || !gameActive) return;

    let bulletImg, shootSound, shootDelay, damage, width, height;

    if (player.hasBossGun) {
        bulletImg = images.bossGun;
        shootSound = bossGunSound;
        shootDelay = 200; // ยิงเร็ว
        damage = 5; // ทำดาเมจ 5 หน่วย
        width = 20;
        height = 30;
    } else if (player.rapidFireActive) {
        bulletImg = images.bulletRapid;
        shootSound = rapidFireShootSound;
        shootDelay = 100;
        damage = 1;
        width = bulletProperties.width;
        height = bulletProperties.height;
    } else {
        bulletImg = images.bullet;
        shootSound = normalShootSound;
        shootDelay = 500;
        damage = 1;
        width = bulletProperties.width;
        height = bulletProperties.height;
    }

    bullets.push({ 
        x: player.x + player.width / 2 - width / 2, 
        y: player.y, 
        width: width, 
        height: height, 
        speed: bulletProperties.speed,
        img: bulletImg,
        damage: damage // NEW: เพิ่มค่า damage ให้กระสุน
    });
    
    shootSound.currentTime = 0;
    shootSound.play();

    canShoot = false;
    setTimeout(() => {
        canShoot = true;
    }, shootDelay);
}

// --- POWERUP COLLISION (MAJOR CHANGE) ---
function checkPowerUpCollision() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pUp = powerUps[i];
        if (player.x < pUp.x + pUp.width && player.x + player.width > pUp.x && player.y < pUp.y + pUp.height && player.y + player.height > pUp.y) {
            powerUpSound.play();
            switch (pUp.type) {
                case 'shield':
                    player.isShielded = true;
                    break;
                case 'rapidFire':
                    player.rapidFireActive = true;
                    clearTimeout(rapidFireTimeout);
                    rapidFireTimeout = setTimeout(() => {
                        player.rapidFireActive = false;
                    }, 10000);
                    break;
                case 'bossGun': // NEW CASE
                    player.hasBossGun = true;
                    clearTimeout(bossGunTimeout);
                    bossGunTimeout = setTimeout(() => {
                        player.hasBossGun = false;
                    }, 10000); // มีผล 10 วินาที
                    break;
            }
            powerUps.splice(i, 1);
        }
    }
}

// ... (checkPlayerCollision and handlePlayerHit remain the same) ...
function checkPlayerCollision() { 
    for (let i = obstacles.length - 1; i >= 0; i--) { 
        const obs = obstacles[i]; 
        if (player.x < obs.x + obs.width && player.x + player.width > obs.x && player.y < obs.y + obs.height && player.y + player.height > obs.y) { 
            spawnExplosion(obs.x, obs.y);
            handlePlayerHit();
            obstacles.splice(i, 1);
            return;
        } 
    } 
    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const bBullet = bossBullets[i];
        if (player.x < bBullet.x + bBullet.width && player.x + player.width > bBullet.x && player.y < bBullet.y + bBullet.height && player.y + player.height > bBullet.y) {
            spawnExplosion(player.x, player.y);
            handlePlayerHit();
            bossBullets.splice(i, 1);
            return;
        }
    }
    // โค้ดที่ถูกต้อง (ไม่ซ้ำซ้อน)
    if (isBossActive && player.x < boss.x + boss.width && player.x + player.width > boss.x && player.y < boss.y + boss.height && player.y + player.height > boss.y) {
        if (boss.hp <= 0) {
            return;
        }
        spawnExplosion(player.x, player.y, 'large');
        handlePlayerHit();
        handlePlayerHit();
        return;
    }
}

function handlePlayerHit() {
    if (player.isShielded) {
        player.isShielded = false;
        playerHitSound.play();
    } else {
        playerHitSound.play();
        player.rapidFireActive = false;
        player.hasBossGun = false; // NEW: ยกเลิกปืนบอสเมื่อโดนโจมตี
        clearTimeout(rapidFireTimeout);
        clearTimeout(bossGunTimeout);
        lives--; 
        livesDisplay.textContent = `Lives: ${lives}`; 
        if (lives <= 0) { 
            endGame(); 
        }
    }
}


// --- BULLET COLLISION (MAJOR CHANGE) ---
function checkBulletCollision() { 
    for (let i = bullets.length - 1; i >= 0; i--) { 
        const bullet = bullets[i]; 

        for (let j = obstacles.length - 1; j >= 0; j--) { 
            const obs = obstacles[j]; 
            if (bullet.x < obs.x + obs.width && bullet.x + bullet.width > obs.x && bullet.y < obs.y + obs.height && bullet.y + bullet.height > obs.y) { 
                bullets.splice(i, 1);
                obs.hp--;

                if (obs.hp <= 0) {
                    spawnExplosion(obs.x, obs.y);
                    obstacles.splice(j, 1); 
                    score += 100; 
                    scoreDisplay.textContent = `Score: ${score}`; 
                    explosionSound.currentTime = 0;
                    explosionSound.play();
                }
                return; 
            } 
        } 
        
        if (isBossActive && bullet.x < boss.x + boss.width && bullet.x + bullet.width > boss.x && bullet.y < boss.y + boss.height && bullet.y + bullet.height > boss.y) {
            boss.hp -= bullet.damage; // ใช้ค่า damage จากกระสุน
            spawnExplosion(bullet.x, bullet.y);
            bullets.splice(i, 1);
            if (boss.hp <= 0) {
                defeatBoss();
            }
            return;
        }
    } 
}

// ... (update function remains mostly the same, just a few tweaks) ...
function update() {
    if (!gameActive) return;
    
    ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawObstacles();
    drawBullets();
    drawPowerUps();
    drawExplosions();
    if(isBossActive) {
        drawBoss();
        drawBossHealthBar();
        drawBossBullets();
    }

    if (rightPressed && player.x < canvas.width - player.width) { player.x += player.speed; }
    if (leftPressed && player.x > 0) { player.x -= player.speed; }
    if (upPressed && player.y > 0) { player.y -= player.speed; }
    if (downPressed && player.y < canvas.height - player.height) { player.y += player.speed; }
    
    if(isBossActive) {
        updateBoss();
    } else {
        obstacles.forEach(obstacle => {
            obstacle.y += obstacle.speed;
            obstacle.x += obstacle.dx;

            if (obstacle.dx !== 0 && (obstacle.x <= 0 || obstacle.x + obstacle.width >= canvas.width)) {
                obstacle.dx *= -1;
            }
        });
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y + bullets[i].height < 0) {
            bullets.splice(i, 1);
        }
    }
    
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].timer--;
        if (explosions[i].timer <= 0) {
            explosions.splice(i, 1);
        }
    }

    powerUps.forEach(pUp => { pUp.y += pUp.speed; });
    
    if (!isBossActive) {
        if (score >= difficultyThreshold) {
            difficultyThreshold += 1000;
        }
        if (score >= nextBossScore) {
            spawnBoss();
        }
    }

    checkBulletCollision();
    checkPlayerCollision(); 
    checkPowerUpCollision();
    animationFrameId = requestAnimationFrame(update);
}


// --- POWERUP SPAWNING (MAJOR CHANGE) ---
function spawnPowerUp() {
    if (powerUps.length > 1) return; // จำกัด Power-up บนจอ

    let availablePowerUps = [];
    if (isBossActive) {
        // ถ้าสู้กับบอสอยู่ ให้มีโอกาสเกิดแค่ปืนยิงบอส
        availablePowerUps.push({ type: 'bossGun', img: images.bossGun });
    } else {
        // ถ้าอยู่ในโหมดปกติ
        availablePowerUps = [
            { type: 'shield', img: images.shield },
            { type: 'rapidFire', img: images.rapidFire }
        ];
    }
    
    if (availablePowerUps.length === 0) return;

    const randomPowerUp = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
    powerUps.push({
        x: Math.random() * (canvas.width - 35),
        y: -35,
        width: 35,
        height: 35,
        speed: 1.5,
        img: randomPowerUp.img,
        type: randomPowerUp.type
    });
}


// ... (The rest of the functions: endGame, spawnObstacle, startGame, resizeCanvas, INITIALIZATION are the same or have minor changes already included above) ...
function endGame() {
    gameActive = false;
    clearInterval(obstacleSpawnInterval);
    clearInterval(powerUpSpawnInterval);
    if (boss.shootInterval) clearInterval(boss.shootInterval);
    clearTimeout(rapidFireTimeout);
    clearTimeout(bossGunTimeout);
    cancelAnimationFrame(animationFrameId);
    messageBox.style.display = 'block';
    gameControls.classList.add('hidden');
    startButton.classList.remove('hidden'); 
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    checkAndSaveHighScore();
    
    // ตั้งค่าข้อความเมื่อแพ้
    document.getElementById('message-title').textContent = 'Game Over !!!'; 
    
    // ข้อความแสดงคะแนนเมื่อแพ้
    messageText.textContent = `Your Score ${score}`;
    messageButton.onclick = () => {
        messageBox.style.display = 'none';
        initGame();
        startGame();
    };
}

function spawnObstacle() {
    const randomEnemyImg = images.enemies[Math.floor(Math.random() * images.enemies.length)];
    const isTough = Math.random() < 0.25;
    const isMoving = Math.random() < 0.35;
    obstacles.push({
        x: Math.random() * (canvas.width - obstacleProperties.width),
        y: -obstacleProperties.height,
        width: obstacleProperties.width,
        height: obstacleProperties.height,
        speed: obstacleProperties.speed,
        img: randomEnemyImg,
        hp: isTough ? 2 : 1,
        isTough: isTough,
        dx: isMoving ? (Math.random() < 0.5 ? 1 : -1) * (obstacleProperties.speed / 2) : 0
    });
}
function startGame() {
    startButton.classList.add('hidden');
    gameControls.classList.remove('hidden');
    gameActive = true;

    // เพิ่มบรรทัดนี้
    lives = 3;
    livesDisplay.textContent = `Lives: ${lives}`;

    startGameSpawners();
    backgroundMusic.play();
    update();
}
function resizeCanvas() { 
    const oldWidth = canvas.width;
    const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.8, 500); 
    
    canvas.width = size; 
    canvas.height = size; 
    
    const scaleX = canvas.width / oldWidth;

    if (gameActive && oldWidth > 0) {
        player.x *= scaleX;
        
        if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
        }

        [obstacles, bullets, powerUps, bossBullets].forEach(arr => {
            arr.forEach(item => {
                item.x *= scaleX;
            });
        });
        if (isBossActive) boss.x *= scaleX;

    } else {
        initGame();
    }

    if (images.bg) {
        ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height); 
    }

    drawPlayer();
}
startButton.addEventListener('click', () => { 
    initGame(); 
    startGame(); 
});
window.onload = function () {
    loadHighScore();
};
window.addEventListener('resize', resizeCanvas);

