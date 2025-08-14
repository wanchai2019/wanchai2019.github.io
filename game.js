let player;
let cursors;
let playerHP = 3;
let hearts = [];
let scene;
let enemies;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#333',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    parent: 'game-container'
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('heart', 'assets/heart.png');
    this.load.image('ground', 'assets/ground.png');
    this.load.image('enemy', 'assets/enemy.png');
}

function create() {
    scene = this;

    // พื้น
    const ground = this.physics.add.staticGroup();
    ground.create(400, 580, 'ground').setScale(2).refreshBody();

    // ผู้เล่น
    player = this.physics.add.sprite(100, 450, 'player').setScale(0.5);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, ground);

    // สร้างศัตรูหลายตัว
    enemies = this.physics.add.group();

    createEnemy(400, 500, 350, 450); // (x, y, minX, maxX)
    createEnemy(600, 500, 550, 750);

    this.physics.add.collider(enemies, ground);

    // ตรวจชน
    this.physics.add.overlap(player, enemies, handlePlayerEnemyCollision, null, this);

    // คีย์บอร์ด
    cursors = this.input.keyboard.createCursorKeys();

    // หัวใจ
    updateHearts();
}

// ฟังก์ชันสร้างศัตรู patrol
function createEnemy(x, y, minX, maxX) {
    const enemy = enemies.create(x, y, 'enemy').setScale(0.5);
    enemy.setCollideWorldBounds(true);
    enemy.minX = minX;
    enemy.maxX = maxX;
    enemy.direction = Phaser.Math.Between(0, 1) ? 1 : -1;
    enemy.speed = Phaser.Math.Between(50, 120);
    enemy.setVelocityX(enemy.speed * enemy.direction);
    return enemy;
}

function update() {
    // ควบคุมผู้เล่น
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }

    // อัปเดตศัตรู patrol
    enemies.children.iterate(enemy => {
        if (enemy.x <= enemy.minX && enemy.direction === -1) {
            enemy.direction = 1;
            enemy.speed = Phaser.Math.Between(50, 120);
            enemy.setVelocityX(enemy.speed);
        }
        if (enemy.x >= enemy.maxX && enemy.direction === 1) {
            enemy.direction = -1;
            enemy.speed = Phaser.Math.Between(50, 120);
            enemy.setVelocityX(-enemy.speed);
        }
    });
}

function handlePlayerEnemyCollision(player, enemy) {
    if (!player.invincible) {
        loseHP();
        player.invincible = true;
        scene.tweens.add({
            targets: player,
            alpha: { from: 1, to: 0.2 },
            yoyo: true,
            repeat: 5,
            duration: 100,
            onComplete: () => {
                player.alpha = 1;
                player.invincible = false;
            }
        });
    }
}

function updateHearts() {
    hearts.forEach(h => h.destroy());
    hearts = [];
    for (let i = 0; i < playerHP; i++) {
        const heart = scene.add.image(30 + i * 40, 50, 'heart')
            .setScrollFactor(0)
            .setScale(0.5)
            .setOrigin(0, 0);
        hearts.push(heart);
    }
}

function loseHP() {
    if (playerHP > 0) {
        playerHP--;
        updateHearts();
        if (playerHP <= 0) {
            gameOver();
        }
    }
}

function gameOver() {
    console.log('Game Over!');
}
