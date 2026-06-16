/**
 * ============================================================
 * DouknowAI Pet System - iframe reusable version
 * ============================================================
 * - 55px pet size
 * - Full viewport movement by default
 * - Optional block-plane movement via parent page rect message
 * - Parent-driven drag support while iframe remains click-through
 * - Direction-safe animation frames: right movement uses fixed right-facing frame
 * - Lightweight physics: inertia, friction, elastic boundaries, soft shadow
 * ============================================================
 */

const PET_CONFIG = {
  petCountDesktop: 1,
  petCountMobile: 1,
  mobileBreakpoint: 768,
  baseSize: 88,
  sizeRange: [1, 1],
  baseSpeed: 0.72,
  maxSpeed: 2.6,
  dragThrowScale: 0.22,
  friction: 0.992,
  boundaryRestitution: 0.78,
  speedRange: [0.85, 1.15],
  stateDurationRange: [2800, 7600],
  fleeRadius: 92,
  fleeMultiplier: 2.7,
  fleeDuration: 520,
  walkFrameInterval: 180,
  winkChance: 0.002,
  winkDuration: 260,
  breathAmplitude: 0.025,
  breathFrequency: 1.35,
  planePadding: 6,
  // 云朵素材（PNG，宽高比约 2:1）
  cloudScaleW: 1.7,
  cloudScaleH: 0.85,
  cloudOffsetY: 0.16,
  // 哲理金句
  talkIntervalRange: [9000, 18000],
  talkDuration: 4600,
  talkFadeMs: 360,
  talkFont: 15,
  talkMaxWidthRatio: 2.8,
  quotes: [
    '把每一个想法，做成能运行的东西。',
    '技术是骨架，人文是温度。',
    '不 FOMO，要 JOMO。',
    '写得慢，但写得真。',
    '克制地构建，认真地表达。',
    '从一行代码，到一台服务器。',
    '把路径写清楚，把选择讲明白。',
    '小工具的背后，是完整的工程能力。',
    '走得慢的人，不回头。',
    '先用起来，再谈完美。',
    '解决问题，比追新技术更值得。',
    'Build with rigor, write with soul.'
  ],
  frames: {
    idle: './assets/douknow/idle.png',
    idleWink: './assets/douknow/idle-wink.png',
    walkFront1: './assets/douknow/walk-front-1.png',
    walkFront2: './assets/douknow/walk-front-2.png',
    walkLeft: './assets/douknow/walk-left-1.png',
    // 原 walk-right-1.png 实际仍偏左，会产生“倒退感”。这里使用镜像修正版。
    walkRight: './assets/douknow/walk-right-fixed.png',
    walkBack: './assets/douknow/walk-back-1.png',
    sleep: './assets/douknow/sleep.png',
    cloud: './assets/douknow/jindou-cloud.png'
  }
};

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function length(x, y) {
  return Math.sqrt(x * x + y * y);
}

function normalizeSpeed(vx, vy, maxSpeed) {
  const len = length(vx, vy);
  if (len <= maxSpeed || len < 0.0001) return { vx, vy };
  const scale = maxSpeed / len;
  return { vx: vx * scale, vy: vy * scale };
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('[DouknowPet] 图片加载失败:', src);
      const placeholder = document.createElement('canvas');
      placeholder.width = 1;
      placeholder.height = 1;
      const placeholderImg = new Image();
      placeholderImg.onload = () => resolve(placeholderImg);
      placeholderImg.src = placeholder.toDataURL();
    };
    img.src = src;
  });
}

const Direction = {
  FRONT: 'front',
  BACK: 'back',
  LEFT: 'left',
  RIGHT: 'right'
};

const PetState = {
  WALK: 'walk',
  IDLE: 'idle',
  SLEEP: 'sleep'
};

class DouknowPet {
  constructor(ctx, images, opts = {}, canvasWidth, canvasHeight) {
    this.ctx = ctx;
    this.images = images;
    this.canvasW = canvasWidth;
    this.canvasH = canvasHeight;
    this.bounds = { left: 0, top: 0, width: canvasWidth, height: canvasHeight };

    this.sizeScale = opts.sizeScale || 1;
    this.speedScale = opts.speedScale || 1;
    this.size = PET_CONFIG.baseSize * this.sizeScale;

    this.x = opts.x != null ? opts.x : canvasWidth * 0.5;
    this.y = opts.y != null ? opts.y : canvasHeight * 0.72;

    const angle = randomRange(0, Math.PI * 2);
    this.baseSpeed = PET_CONFIG.baseSpeed * this.speedScale;
    this.vx = Math.cos(angle) * this.baseSpeed;
    this.vy = Math.sin(angle) * this.baseSpeed;

    this.direction = Direction.FRONT;
    this.state = PetState.IDLE;
    this.stateTimer = 0;

    this.walkFrameIndex = 0;
    this.walkFrameTimer = 0;
    this.isWinking = false;
    this.winkTimer = 0;

    this.isFleeing = false;
    this.fleeTimer = 0;
    this.fleeVx = 0;
    this.fleeVy = 0;

    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.lastDragX = this.x;
    this.lastDragY = this.y;
    this.lastDragTime = performance.now();

    this.breathPhase = randomRange(0, Math.PI * 2);
    this.sleepBubbleTimer = 0;
    this.sleepBubbles = [];
    this.squash = 0;

    // 哲理金句
    this.talkTimer = randomRange(PET_CONFIG.talkIntervalRange[0], PET_CONFIG.talkIntervalRange[1]);
    this.talkText = '';
    this.talkAlpha = 0;
    this.talkRemaining = 0;

    this.pickNewState();
    this.clampToBounds();
  }

  setBounds(bounds) {
    if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) return;
    const minSide = this.size + PET_CONFIG.planePadding * 2;
    if (bounds.width < minSide || bounds.height < minSide) return;

    this.bounds = {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height
    };
    this.clampToBounds();
  }

  getBoundsLimits() {
    const half = this.size * 0.5;
    const pad = PET_CONFIG.planePadding;
    return {
      minX: this.bounds.left + half + pad,
      maxX: this.bounds.left + this.bounds.width - half - pad,
      minY: this.bounds.top + half + pad,
      maxY: this.bounds.top + this.bounds.height - half - pad
    };
  }

  clampToBounds() {
    const b = this.getBoundsLimits();
    this.x = clamp(this.x, b.minX, b.maxX);
    this.y = clamp(this.y, b.minY, b.maxY);
  }

  pickNewState() {
    if (this.isDragging) return;
    const roll = Math.random();
    if (roll < 0.70) this.setState(PetState.WALK);
    else if (roll < 0.90) this.setState(PetState.IDLE);
    else this.setState(PetState.SLEEP);
  }

  setState(newState) {
    if (this.isDragging) return;
    this.state = newState;
    this.stateTimer = randomRange(PET_CONFIG.stateDurationRange[0], PET_CONFIG.stateDurationRange[1]);

    if (newState === PetState.WALK) {
      this.pickRandomVelocity();
    } else {
      this.vx = 0;
      this.vy = 0;
      if (newState === PetState.SLEEP) this.sleepBubbles = [];
    }
  }

  pickRandomVelocity() {
    const angle = randomRange(0, Math.PI * 2);
    this.vx = Math.cos(angle) * this.baseSpeed;
    this.vy = Math.sin(angle) * this.baseSpeed;
    this.updateDirection();
  }

  updateDirection() {
    const absVx = Math.abs(this.vx);
    const absVy = Math.abs(this.vy);
    if (absVx <= 0.06 && absVy <= 0.06) return;

    if (absVx >= absVy) {
      this.direction = this.vx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      this.direction = this.vy > 0 ? Direction.FRONT : Direction.BACK;
    }
  }

  startDrag(px, py, time) {
    this.isDragging = true;
    this.isFleeing = false;
    this.state = PetState.IDLE;
    this.dragOffsetX = this.x - px;
    this.dragOffsetY = this.y - py;
    this.lastDragX = px;
    this.lastDragY = py;
    this.lastDragTime = time || performance.now();
    this.vx = 0;
    this.vy = 0;
    this.sleepBubbles = [];
  }

  dragTo(px, py, time) {
    if (!this.isDragging) return;
    const now = time || performance.now();
    const dt = Math.max(8, now - this.lastDragTime);
    const targetX = px + this.dragOffsetX;
    const targetY = py + this.dragOffsetY;
    const b = this.getBoundsLimits();
    const nextX = clamp(targetX, b.minX, b.maxX);
    const nextY = clamp(targetY, b.minY, b.maxY);

    this.vx = (nextX - this.x) / (dt / 16);
    this.vy = (nextY - this.y) / (dt / 16);
    const capped = normalizeSpeed(this.vx, this.vy, PET_CONFIG.maxSpeed * 1.5);
    this.vx = capped.vx;
    this.vy = capped.vy;

    this.x = nextX;
    this.y = nextY;
    this.lastDragX = px;
    this.lastDragY = py;
    this.lastDragTime = now;
    this.updateDirection();
  }

  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    const capped = normalizeSpeed(this.vx * PET_CONFIG.dragThrowScale, this.vy * PET_CONFIG.dragThrowScale, PET_CONFIG.maxSpeed);
    this.vx = capped.vx;
    this.vy = capped.vy;
    this.state = PetState.WALK;
    this.stateTimer = randomRange(1800, 3600);
    this.updateDirection();
  }

  update(dt, time, mouseX, mouseY) {
    if (this.isDragging) {
      this.breathPhase += (dt / 1000) * PET_CONFIG.breathFrequency * Math.PI * 2;
      return;
    }

    if (!this.isFleeing && this.state !== PetState.SLEEP && Number.isFinite(mouseX) && Number.isFinite(mouseY)) {
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PET_CONFIG.fleeRadius && dist > 1) {
        this.isFleeing = true;
        this.fleeTimer = PET_CONFIG.fleeDuration;
        const fleeAngle = Math.atan2(dy, dx);
        const fleeSpeed = this.baseSpeed * PET_CONFIG.fleeMultiplier;
        this.fleeVx = Math.cos(fleeAngle) * fleeSpeed;
        this.fleeVy = Math.sin(fleeAngle) * fleeSpeed;
      }
    }

    if (this.isFleeing) {
      this.fleeTimer -= dt;
      if (this.fleeTimer <= 0) {
        this.isFleeing = false;
        if (this.state === PetState.WALK) this.pickRandomVelocity();
      }
    }

    this.stateTimer -= dt;
    if (this.stateTimer <= 0) this.pickNewState();

    if (this.state === PetState.WALK) this.updateWalk(dt);
    else if (this.state === PetState.IDLE) this.updateIdle(dt);
    else if (this.state === PetState.SLEEP) this.updateSleep(dt, time);

    this.applyBoundaries();
    this.squash *= 0.88;
    this.breathPhase += (dt / 1000) * PET_CONFIG.breathFrequency * Math.PI * 2;
    this.updateTalk(dt);
  }

  updateTalk(dt) {
    // 正在显示 → 淡入/停留/淡出
    if (this.talkText) {
      this.talkRemaining -= dt;
      if (this.talkRemaining > PET_CONFIG.talkDuration - PET_CONFIG.talkFadeMs) {
        this.talkAlpha = Math.min(1, this.talkAlpha + dt / PET_CONFIG.talkFadeMs);
      } else if (this.talkRemaining < PET_CONFIG.talkFadeMs) {
        this.talkAlpha = Math.max(0, this.talkAlpha - dt / PET_CONFIG.talkFadeMs);
      } else {
        this.talkAlpha = 1;
      }
      if (this.talkRemaining <= 0) {
        this.talkText = '';
        this.talkAlpha = 0;
        this.talkTimer = randomRange(PET_CONFIG.talkIntervalRange[0], PET_CONFIG.talkIntervalRange[1]);
      }
      return;
    }

    // 沉默期 → 随机触发（睡觉/拖拽时不说话）
    this.talkTimer -= dt;
    if (this.talkTimer <= 0 && !this.isDragging && this.state !== PetState.SLEEP) {
      this.sayRandomQuote();
    }
  }

  sayRandomQuote() {
    const list = PET_CONFIG.quotes;
    if (!list || list.length === 0) return;
    const next = list[Math.floor(Math.random() * list.length)];
    if (next === this.talkText && list.length > 1) {
      this.sayRandomQuote();
      return;
    }
    this.talkText = next;
    this.talkRemaining = PET_CONFIG.talkDuration;
    this.talkAlpha = 0;
  }

  updateWalk(dt) {
    if (this.isFleeing) {
      this.vx = this.fleeVx;
      this.vy = this.fleeVy;
    } else {
      this.vx *= PET_CONFIG.friction;
      this.vy *= PET_CONFIG.friction;
      if (length(this.vx, this.vy) < this.baseSpeed * 0.55) {
        const angle = Math.atan2(this.vy || randomRange(-1, 1), this.vx || randomRange(-1, 1));
        this.vx = Math.cos(angle) * this.baseSpeed;
        this.vy = Math.sin(angle) * this.baseSpeed;
      }
    }

    this.x += this.vx * (dt / 16);
    this.y += this.vy * (dt / 16);
    this.updateDirection();

    this.walkFrameTimer += dt;
    if (this.walkFrameTimer >= PET_CONFIG.walkFrameInterval) {
      this.walkFrameTimer = 0;
      this.walkFrameIndex = (this.walkFrameIndex + 1) % 2;
    }
  }

  updateIdle(dt) {
    if (!this.isWinking) {
      if (Math.random() < PET_CONFIG.winkChance * (dt / 16)) {
        this.isWinking = true;
        this.winkTimer = PET_CONFIG.winkDuration;
      }
    } else {
      this.winkTimer -= dt;
      if (this.winkTimer <= 0) this.isWinking = false;
    }
  }

  updateSleep(dt, time) {
    this.sleepBubbleTimer += dt;
    if (this.sleepBubbleTimer > 1200) {
      this.sleepBubbleTimer = 0;
      this.sleepBubbles.push({
        x: this.x + this.size * 0.3,
        y: this.y - this.size * 0.3,
        alpha: 1,
        scale: 0.5,
        vy: -0.3
      });
    }

    for (let i = this.sleepBubbles.length - 1; i >= 0; i--) {
      const b = this.sleepBubbles[i];
      b.y += b.vy * (dt / 16);
      b.x += Math.sin(time / 500 + i) * 0.15 * (dt / 16);
      b.alpha -= 0.003 * (dt / 16);
      b.scale += 0.003 * (dt / 16);
      if (b.alpha <= 0) this.sleepBubbles.splice(i, 1);
    }
  }

  applyBoundaries() {
    const b = this.getBoundsLimits();
    let bounced = false;

    if (this.x < b.minX) {
      this.x = b.minX;
      this.vx = Math.abs(this.vx) * PET_CONFIG.boundaryRestitution;
      bounced = true;
    } else if (this.x > b.maxX) {
      this.x = b.maxX;
      this.vx = -Math.abs(this.vx) * PET_CONFIG.boundaryRestitution;
      bounced = true;
    }

    if (this.y < b.minY) {
      this.y = b.minY;
      this.vy = Math.abs(this.vy) * PET_CONFIG.boundaryRestitution;
      bounced = true;
    } else if (this.y > b.maxY) {
      this.y = b.maxY;
      this.vy = -Math.abs(this.vy) * PET_CONFIG.boundaryRestitution;
      bounced = true;
    }

    if (bounced) {
      this.squash = 0.12;
      this.updateDirection();
      if (this.isFleeing) {
        this.fleeVx = this.vx;
        this.fleeVy = this.vy;
      }
    }
  }

  getCurrentFrame() {
    if (this.isDragging) return this.images.idle;

    switch (this.state) {
      case PetState.IDLE:
        return this.isWinking ? this.images.idleWink : this.images.idle;
      case PetState.WALK:
        if (this.direction === Direction.LEFT) return this.images.walkLeft;
        if (this.direction === Direction.RIGHT) return this.images.walkRight;
        if (this.direction === Direction.BACK) return this.images.walkBack;
        return this.walkFrameIndex === 0 ? this.images.walkFront1 : this.images.walkFront2;
      case PetState.SLEEP:
        return this.images.sleep;
      default:
        return this.images.idle;
    }
  }

  draw(ctx) {
    const frame = this.getCurrentFrame();

    let breathScale = 1;
    if (this.state === PetState.IDLE || this.state === PetState.SLEEP || this.isDragging) {
      breathScale = 1 + Math.sin(this.breathPhase) * PET_CONFIG.breathAmplitude;
    }

    const squashX = 1 + this.squash;
    const squashY = 1 - this.squash * 0.75;
    const drawW = this.size * breathScale * squashX;
    const drawH = this.size * breathScale * squashY;
    const drawX = this.x - drawW * 0.5;
    const drawY = this.y - drawH * 0.5;

    ctx.save();

    const cloud = this.images.cloud;
    const cloudW = this.size * (PET_CONFIG.cloudScaleW + Math.min(0.28, Math.abs(this.vx) * 0.04));
    const cloudH = this.size * PET_CONFIG.cloudScaleH;
    const cloudX = this.x - cloudW * 0.5;
    const cloudY = this.y + this.size * PET_CONFIG.cloudOffsetY;
    if (cloud) {
      ctx.globalAlpha = this.isDragging ? 0.92 : 0.82;
      ctx.drawImage(cloud, cloudX, cloudY, cloudW, cloudH);
      ctx.globalAlpha = 1;
    } else {
      const shadowW = this.size * 0.70;
      const shadowH = this.size * 0.14;
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + this.size * 0.42, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 哲理金句气泡（绘于宠物上方）
    if (this.talkText) {
      this.drawTalkBubble(ctx);
    }

    if (this.state === PetState.SLEEP) {
      for (const b of this.sleepBubbles) {
        ctx.save();
        ctx.globalAlpha = b.alpha * 0.7;
        ctx.font = `${Math.round(12 * b.scale)}px sans-serif`;
        ctx.fillStyle = '#8B9EFF';
        ctx.textAlign = 'center';
        ctx.fillText('z', b.x, b.y);
        ctx.restore();
      }
    }

    ctx.drawImage(frame, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  drawTalkBubble(ctx) {
    const text = this.talkText;
    const fontSize = PET_CONFIG.talkFont;
    const padX = 14;
    const padY = 9;

    ctx.save();
    ctx.font = `400 ${fontSize}px "Noto Sans SC", "Work Sans", sans-serif`;
    ctx.textBaseline = 'middle';

    // 测量并限制最大宽度，超宽自动换行
    const maxWidth = this.size * PET_CONFIG.talkMaxWidthRatio;
    const lines = this.wrapText(ctx, text, maxWidth);
    const lineHeight = fontSize * 1.35;

    let bubbleW = 0;
    for (const line of lines) bubbleW = Math.max(bubbleW, ctx.measureText(line).width);
    bubbleW = Math.min(maxWidth, bubbleW + padX * 2);
    const bubbleH = lines.length * lineHeight + padY * 2;

    const bubbleX = this.x - bubbleW * 0.5;
    const bubbleY = this.y - this.size * 0.62 - bubbleH - 8;

    ctx.globalAlpha = this.talkAlpha;

    // 气泡底色 + 描边 + 小尖
    const r = 10;
    ctx.fillStyle = '#FFFDF7';
    ctx.strokeStyle = '#E2C574';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bubbleX + r, bubbleY);
    ctx.lineTo(bubbleX + bubbleW - r, bubbleY);
    ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r);
    ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r);
    ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH);
    // 底部尖角
    ctx.lineTo(this.x + 6, bubbleY + bubbleH);
    ctx.lineTo(this.x, bubbleY + bubbleH + 8);
    ctx.lineTo(this.x - 6, bubbleY + bubbleH);
    ctx.lineTo(bubbleX + r, bubbleY + bubbleH);
    ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r);
    ctx.lineTo(bubbleX, bubbleY + r);
    ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + r, bubbleY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 文字
    ctx.fillStyle = '#3a3a3a';
    ctx.textAlign = 'center';
    const startY = bubbleY + padY + lineHeight * 0.5;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], this.x, startY + i * lineHeight);
    }

    ctx.restore();
  }

  wrapText(ctx, text, maxWidth) {
    // 逐字符测量（兼容中英文混排）
    const lines = [];
    let current = '';
    for (const ch of text) {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  containsPoint(px, py) {
    const half = this.size * 0.62;
    return px >= this.x - half && px <= this.x + half && py >= this.y - half && py <= this.y + half;
  }

  getHitBounds() {
    const half = this.size * 0.68;
    return {
      left: this.x - half,
      top: this.y - half,
      right: this.x + half,
      bottom: this.y + half,
      x: this.x,
      y: this.y,
      size: this.size,
      dragging: this.isDragging
    };
  }
}

class PetParty {
  constructor() {
    this.canvas = document.getElementById('pet-canvas');
    if (!this.canvas) {
      console.error('[DouknowPet] 未找到 #pet-canvas 元素');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.pets = [];
    this.images = {};
    this.imagesLoaded = false;
    this.mouseX = Number.NaN;
    this.mouseY = Number.NaN;
    this.lastTime = 0;
    this.rafId = null;
    this.isRunning = false;
    this.dpr = window.devicePixelRatio || 1;
    this.boundsPostTimer = 0;
    this.pendingSurfaceRect = null;

    this.init();
  }

  async init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.bindLocalPointerEvents();
    this.bindParentBridge();

    await this.loadImages();
    this.createPets();
    if (this.pendingSurfaceRect) this.setSurfaceRect(this.pendingSurfaceRect);

    this.isRunning = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((t) => this.loop(t));
    this.postBounds();
    console.log('[DouknowPet] 豆懂AI宠物系统已启动');
  }

  resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    for (const pet of this.pets) {
      pet.canvasW = w;
      pet.canvasH = h;
      if (!pet.bounds) pet.setBounds({ left: 0, top: 0, width: w, height: h });
    }
  }

  async loadImages() {
    const entries = Object.entries(PET_CONFIG.frames);
    await Promise.all(entries.map(async ([key, src]) => {
      this.images[key] = await loadImage(src);
    }));
    this.imagesLoaded = true;
  }

  createPets() {
    const isMobile = window.innerWidth < PET_CONFIG.mobileBreakpoint;
    const count = isMobile ? PET_CONFIG.petCountMobile : PET_CONFIG.petCountDesktop;
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const sizeScale = randomRange(PET_CONFIG.sizeRange[0], PET_CONFIG.sizeRange[1]);
      const speedScale = randomRange(PET_CONFIG.speedRange[0], PET_CONFIG.speedRange[1]);
      const pet = new DouknowPet(this.ctx, this.images, {
        x: w * 0.22 + i * 24,
        y: h * 0.72,
        sizeScale,
        speedScale
      }, w, h);
      this.pets.push(pet);
    }
  }

  bindLocalPointerEvents() {
    // 独立打开 pet.html 时也能拖拽；嵌入 iframe 时主要由父页面 postMessage 驱动。
    const getPoint = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    this.canvas.addEventListener('pointermove', (e) => {
      const p = getPoint(e);
      this.mouseX = p.x;
      this.mouseY = p.y;
      const draggingPet = this.pets.find((pet) => pet.isDragging);
      if (draggingPet) {
        draggingPet.dragTo(p.x, p.y, performance.now());
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      const p = getPoint(e);
      const pet = this.pets.find((item) => item.containsPoint(p.x, p.y));
      if (!pet) return;
      pet.startDrag(p.x, p.y, performance.now());
      this.canvas.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });

    const end = () => {
      for (const pet of this.pets) pet.endDrag();
      this.postBounds();
    };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
    this.canvas.addEventListener('mouseleave', () => {
      this.mouseX = Number.NaN;
      this.mouseY = Number.NaN;
    });
  }

  bindParentBridge() {
    window.addEventListener('message', (event) => {
      const data = event.data || {};
      if (!data || data.source !== 'techdaily-parent') return;

      if (data.type === 'douknow-pet-surface') {
        this.setSurfaceRect(data.rect);
      } else if (data.type === 'douknow-pet-pointer') {
        this.mouseX = Number(data.x);
        this.mouseY = Number(data.y);
      } else if (data.type === 'douknow-pet-drag-start') {
        const pet = this.pets[0];
        if (pet) pet.startDrag(Number(data.x), Number(data.y), performance.now());
      } else if (data.type === 'douknow-pet-drag-move') {
        const pet = this.pets[0];
        if (pet) pet.dragTo(Number(data.x), Number(data.y), performance.now());
      } else if (data.type === 'douknow-pet-drag-end') {
        const pet = this.pets[0];
        if (pet) pet.endDrag();
        this.postBounds();
      }
    });
  }

  setSurfaceRect(rect) {
    if (!rect) return;
    const safe = {
      left: clamp(Number(rect.left) || 0, 0, window.innerWidth),
      top: clamp(Number(rect.top) || 0, 0, window.innerHeight),
      width: Math.max(0, Number(rect.width) || 0),
      height: Math.max(0, Number(rect.height) || 0)
    };
    this.pendingSurfaceRect = safe;
    for (const pet of this.pets) pet.setBounds(safe);
  }

  loop(timestamp) {
    if (!this.isRunning) return;
    const dt = Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;

    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    this.ctx.clearRect(0, 0, width, height);

    for (const pet of this.pets) {
      pet.update(dt, timestamp, this.mouseX, this.mouseY);
      pet.draw(this.ctx);
    }

    this.boundsPostTimer += dt;
    if (this.boundsPostTimer > 80) {
      this.boundsPostTimer = 0;
      this.postBounds();
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  postBounds() {
    if (!window.parent || window.parent === window || !this.pets[0]) return;
    window.parent.postMessage({
      source: 'douknow-pet',
      type: 'douknow-pet-bounds',
      bounds: this.pets[0].getHitBounds()
    }, '*');
  }

  destroy() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PetParty());
} else {
  new PetParty();
}
