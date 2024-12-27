// 全局變量
let player1, player2;
let bullets = [];
let bgImg;
let bgX = 0;
const PLAYER_SCALE = 3;
let gravity = 0.8;

// 玩家1的設置
let player1Config = {
  idle: {
    frameCount: 1,
    frameDelay: 5,
    width: 46,
    height: 61,
    frames: []
  },
  walk: {
    frameCount: 1,
    frameDelay: 5,
    width: 231/4,
    height: 60,
    frames: []
  },
  jump: {
    frameCount: 1,
    frameDelay: 5,
    width: 172/3,
    height: 66,
    frames: []
  },
  attack: {
    frameCount: 1,
    frameDelay: 3,
    width: 46,
    height: 61,
    frames: []
  }
};

// 玩家2的設置
let player2Config = {
  idle: {
    frameCount: 1,
    frameDelay: 5,
    width: 41,
    height: 69,
    frames: []
  },
  walk: {
    frameCount: 1,
    frameDelay: 5,
    width: 279/4,
    height: 70,
    frames: []
  },
  jump: {
    frameCount: 1,
    frameDelay: 5,
    width: 177/2,
    height: 105,
    frames: []
  },
  attack: {
    frameCount: 1,
    frameDelay: 5,
    width: 41,
    height: 60,
    frames: []
  }
};

// 在全局變量區域添加血條配置
const HEALTH_BAR = {
  width: 200,
  height: 20,
  margin: 10,
  borderSize: 2
};

// 在全局變量區域添加文字設置
const BG_TEXT = {
  content: 'TKUET',
  size: 150,  // 文字大小
  color: 'rgba(255, 255, 255, 0.3)',  // 半透明白色
  yPosition: 0.3  // 在螢幕高度的 30% 位置
};

// 在全局變量區域添加遊戲狀態
let gameStats = {
  player1: { wins: 0, losses: 0, draws: 0 },
  player2: { wins: 0, losses: 0, draws: 0 }
};

let gameOver = false;
let winner = null;

function preload() {
  console.log('Starting to load images...');
  
  // 載入背景圖片
  bgImg = loadImage('assets/background.jpg');
  
  // 載入玩家1的圖片
  for (let action in player1Config) {
    player1Config[action].frames = [];
    try {
      let img = loadImage(`assets/player1/${action}0.png`,
        // 成功載入時的回調
        loadedImg => {
          console.log(`Loaded player1 ${action}0.png`);
          player1Config[action].frames[0] = loadedImg;
        },
        // 載入失敗時的回調
        () => {
          console.log(`Failed to load player1 ${action}0.png, using default`);
          let defaultImg = createImage(player1Config[action].width, player1Config[action].height);
          defaultImg.loadPixels();
          defaultImg.updatePixels();
          player1Config[action].frames[0] = defaultImg;
        }
      );
    } catch (e) {
      console.log(`Failed to load player1 ${action}0.png, using default`);
      let defaultImg = createImage(player1Config[action].width, player1Config[action].height);
      defaultImg.loadPixels();
      defaultImg.updatePixels();
      player1Config[action].frames[0] = defaultImg;
    }
  }
  
  // 載入玩家2的圖片
  for (let action in player2Config) {
    player2Config[action].frames = [];
    for (let i = 0; i < player2Config[action].frameCount; i++) {
      let img = loadImage(`assets/player2/${action}${i}.png`);
      player2Config[action].frames.push(img);
    }
  }
}

class Player {
  constructor(x, y, config, health, isPlayer1) {
    this.x = x;
    this.y = y;
    this.config = config;
    this.health = health;
    this.isPlayer1 = isPlayer1;
    this.speed = 5 * PLAYER_SCALE;
    this.ySpeed = 0;
    this.isJumping = false;
    this.isAttacking = false;
    this.currentAction = 'idle';
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.lastDirection = this.isPlayer1 ? 1 : -1;
  }
  
  update() {
    // 重力效果
    this.ySpeed += gravity;
    this.y += this.ySpeed;
    
    // 地板碰撞
    if (this.y > height - this.config[this.currentAction].height * PLAYER_SCALE) {
      this.y = height - this.config[this.currentAction].height * PLAYER_SCALE;
      this.ySpeed = 0;
      this.isJumping = false;
    }
    
    // 預設動作為站立
    let newAction = 'idle';
    
    // 玩家1控制 (WASD)
    if (this.isPlayer1) {
      if (keyIsDown(65) || keyIsDown(68)) { // A or D
        newAction = 'walk';
        if (keyIsDown(65)) { // A
          // 限制左邊界
          if (this.x > 0) {
            this.x -= this.speed;
          }
          this.lastDirection = -1;
        }
        if (keyIsDown(68)) { // D
          // 限制右邊界
          if (this.x < width - this.config[this.currentAction].width * PLAYER_SCALE) {
            this.x += this.speed;
          }
          this.lastDirection = 1;
        }
      }
      
      if (keyIsDown(87) && !this.isJumping) { // W
        this.ySpeed = -20;
        this.isJumping = true;
      }
    }
    // 玩家2控制 (方向鍵)
    else {
      if (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW)) {
        newAction = 'walk';
        if (keyIsDown(LEFT_ARROW)) {
          this.x -= this.speed;
          this.lastDirection = -1;
        }
        if (keyIsDown(RIGHT_ARROW)) {
          this.x += this.speed;
          this.lastDirection = 1;
        }
      }
      
      if (keyIsDown(UP_ARROW) && !this.isJumping) {
        this.ySpeed = -20;
        this.isJumping = true;
      }
    }
    
    // 跳躍動作優先
    if (this.isJumping) {
      newAction = 'jump';
    }
    
    // 攻擊動作優先於其他動作
    if (this.isAttacking) {
      newAction = 'attack';
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }
    
    // 更新當前動作
    if (this.currentAction !== newAction) {
      this.currentAction = newAction;
      this.currentFrame = 0;
      this.frameTimer = 0;
    }
    
    // 更新動畫幀
    this.frameTimer++;
    if (this.frameTimer > this.config[this.currentAction].frameDelay) {
      this.currentFrame = (this.currentFrame + 1) % this.config[this.currentAction].frameCount;
      this.frameTimer = 0;
    }
  }
  
  attack() {
    this.isAttacking = true;
    this.attackTimer = 10;
  }
  
  show() {
    push();
    translate(this.x + this.config[this.currentAction].width * PLAYER_SCALE/2, 
             this.y + this.config[this.currentAction].height * PLAYER_SCALE/2);
    scale(this.lastDirection * PLAYER_SCALE, PLAYER_SCALE);
    
    let currentConfig = this.config[this.currentAction];
    if (currentConfig.frames[this.currentFrame]) {
      image(currentConfig.frames[this.currentFrame], 
            -currentConfig.width/2, -currentConfig.height/2, 
            currentConfig.width, currentConfig.height);
    }
    pop();
    
    // 顯示生命值
    fill(255);
    textSize(12 * PLAYER_SCALE);
    textAlign(CENTER);
    text(`HP: ${this.health}`, 
         this.x + currentConfig.width * PLAYER_SCALE/2, 
         this.y - 10 * PLAYER_SCALE);
  }
}

class Bullet {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = 10 * PLAYER_SCALE;
    this.size = 10 * PLAYER_SCALE;
  }
  
  update() {
    this.x += this.speed * this.direction;
  }
  
  show() {
    fill(255, 0, 0);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
  }
  
  hits(player) {
    let currentConfig = player.config[player.currentAction];
    let hitX = this.x > player.x && 
               this.x < player.x + currentConfig.width * PLAYER_SCALE;
    let hitY = this.y > player.y && 
               this.y < player.y + currentConfig.height * PLAYER_SCALE;
    return hitX && hitY;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  player1 = new Player(width/4, height/2, player1Config, 100, true);
  player2 = new Player(3*width/4, height/2, player2Config, 100, false);
}

function draw() {
  // 背景移動
  let bgScale = max(width/bgImg.width, height/bgImg.height);
  let scaledW = bgImg.width * bgScale;
  let scaledH = bgImg.height * bgScale;
  
  image(bgImg, bgX, 0, scaledW, height);
  image(bgImg, bgX + scaledW, 0, scaledW, height);
  
  if (bgX <= -scaledW) {
    bgX = 0;
  }
  bgX -= 2;
  
  // 繪製背景文字 'TKUET'
  push();
  textSize(BG_TEXT.size);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  fill(BG_TEXT.color);
  text(BG_TEXT.content, width/2, height * BG_TEXT.yPosition);
  pop();
  
  // 繪製血條
  drawHealthBar(
    HEALTH_BAR.margin, 
    HEALTH_BAR.margin, 
    player1.health, 
    100,  // 最大血量
    color(0, 255, 0),  // 綠色血條
    'Player 1'
  );

  drawHealthBar(
    width - HEALTH_BAR.width - HEALTH_BAR.margin, 
    HEALTH_BAR.margin, 
    player2.health, 
    100,  // 最大血量
    color(255, 0, 0),  // 紅色血條
    'Player 2'
  );
  
  // 更新和顯示玩家
  player1.update();
  player2.update();
  player1.show();
  player2.show();
  
  // 更新和顯示子彈
  for (let i = bullets.length-1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    
    if (bullets[i].hits(player1)) {
      player1.health -= 10;
      bullets.splice(i, 1);
    } else if (bullets[i].hits(player2)) {
      player2.health -= 10;
      bullets.splice(i, 1);
    } else if (bullets[i].x > width || bullets[i].x < 0) {
      bullets.splice(i, 1);
    }
  }
  
  // 檢查遊戲結束
  if (!gameOver && (player1.health <= 0 || player2.health <= 0)) {
    handleGameEnd();
  }

  // 如果遊戲結束，顯示勝利訊息
  if (gameOver) {
    push();
    textSize(100);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    fill('rgba(0, 0, 0, 0.7)');
    rect(0, height/2 - 100, width, 200);
    fill(255);
    
    let message = winner === null ? "Draw Game!" : 
                  `${winner} Wins!`;
    text(message, width/2, height/2);
    
    textSize(30);
    text("Press ENTER to play again", width/2, height/2 + 50);
    pop();
  }

  // 顯示戰績
  drawStats(HEALTH_BAR.margin, 
           HEALTH_BAR.margin + HEALTH_BAR.height + 10, 
           gameStats.player1);
  
  drawStats(width - HEALTH_BAR.width - HEALTH_BAR.margin, 
           HEALTH_BAR.margin + HEALTH_BAR.height + 10, 
           gameStats.player2, 
           false);
}

function keyPressed() {
  if (gameOver) {
    if (keyCode === ENTER) {
      resetGame();
      return;
    }
  }
  
  // 玩家1發射子彈 (F鍵)
  if (keyCode === 70) {
    bullets.push(new Bullet(
      player1.x + player1Config[player1.currentAction].width * PLAYER_SCALE, 
      player1.y + player1Config[player1.currentAction].height * PLAYER_SCALE/2, 
      1
    ));
    player1.attack();
  }
  // 玩家2發射子彈 (空白鍵)
  if (keyCode === 32) {
    bullets.push(new Bullet(
      player2.x, 
      player2.y + player2Config[player2.currentAction].height * PLAYER_SCALE/2, 
      -1
    ));
    player2.attack();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 添加繪製血條的函數
function drawHealthBar(x, y, currentHealth, maxHealth, barColor, playerName) {
  push();
  
  // 繪製血條外框
  noFill();
  stroke(255);
  strokeWeight(HEALTH_BAR.borderSize);
  rect(x, y, HEALTH_BAR.width, HEALTH_BAR.height);
  
  // 繪製血條
  noStroke();
  fill(barColor);
  let healthWidth = map(currentHealth, 0, maxHealth, 0, HEALTH_BAR.width);
  rect(x, y, healthWidth, HEALTH_BAR.height);
  
  // 繪製血量文字
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(HEALTH_BAR.height * 0.7);
  text(`${playerName}: ${currentHealth}/${maxHealth}`, 
       x + HEALTH_BAR.width/2, 
       y + HEALTH_BAR.height/2);
  
  pop();
}

// 添加遊戲結束處理函數
function handleGameEnd() {
  gameOver = true;
  
  if (player1.health <= 0 && player2.health <= 0) {
    // 平手
    winner = null;
    gameStats.player1.draws++;
    gameStats.player2.draws++;
  } else if (player1.health <= 0) {
    // 玩家2勝
    winner = "Player 2";
    gameStats.player1.losses++;
    gameStats.player2.wins++;
  } else {
    // 玩家1勝
    winner = "Player 1";
    gameStats.player1.wins++;
    gameStats.player2.losses++;
  }
}

// 添加重置遊戲函數
function resetGame() {
  player1.health = 100;
  player2.health = 100;
  player1.x = width/4;
  player2.x = 3*width/4;
  player1.y = height/2;
  player2.y = height/2;
  bullets = [];
  gameOver = false;
  winner = null;
}

// 添加戰績顯示函數
function drawStats(x, y, stats, isLeft = true) {
  push();
  textSize(20);
  textAlign(isLeft ? LEFT : RIGHT);
  fill(255);
  text(`Wins: ${stats.wins}`, x + (isLeft ? 0 : HEALTH_BAR.width), y);
  text(`Losses: ${stats.losses}`, x + (isLeft ? 0 : HEALTH_BAR.width), y + 25);
  text(`Draws: ${stats.draws}`, x + (isLeft ? 0 : HEALTH_BAR.width), y + 50);
  pop();
}
