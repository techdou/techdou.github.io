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
  mobileBreakpoint: 768,
  baseSize: 88,
  baseSpeed: 0.72,
  maxSpeed: 2.6,
  dragThrowScale: 0.22,
  friction: 0.992,
  boundaryRestitution: 0.78,
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
  // 宠物间分离（防止穿插/重叠）
  petSeparationDist: 105,   // 在此距离内开始互相推开
  petSeparationForce: 0.45, // 推力强度
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
  // 双宠物皮肤：绿色科技豆（techdou.com）+ 橙色豆懂AI（douknowai）
  // 当前桌面端只保留小豆登场；科技豆/豆懂AI用 enabled:false 暂时下线，定义保留以便随时恢复。
  skins: [
    {
      id: 'techdou',
      name: '科技豆',
      enabled: false,
      startXRatio: 0.26,
      quotes: [
        '日拱一卒，功不唐捐。',
        '写清楚，比写漂亮重要。',
        '好的代码，读起来像散文。',
        '简单，是删出来的。',
        '先把东西做出来，再谈好不好。',
        '慢一点，反而快。',
        '记录，是给未来的自己写信。',
        '工具的意义，是让思考更专注。',
        '把复杂留给自己，把简单留给别人。',
        '长期主义，就是每天做一点。',
        '把手头这件小事做完整。',
        '克制，是一种技术审美。',
        '今日宜：修一个小 bug。',
        '保持好奇，保持耐心。',
        '技术是手段，生活才是目的。'
      ],
      frames: {
        idle: './assets/techdou/idle.webp?v=2',
        idleWink: './assets/techdou/idle-wink.webp?v=2',
        walkFront1: './assets/techdou/walk-front-1.webp?v=2',
        walkFront2: './assets/techdou/walk-front-2.webp?v=2',
        walkLeft: './assets/techdou/walk-left.webp?v=2',
        walkRight: './assets/techdou/walk-right.webp?v=2',
        walkBack: './assets/techdou/walk-back-1.webp?v=2',
        sleep: './assets/techdou/sleep.webp?v=2',
        cloud: './assets/techdou/jindou-cloud.webp?v=2'
      }
    },
    {
      id: 'douknow',
      name: '豆懂AI',
      enabled: false,
      startXRatio: 0.74,
      quotes: [
        '知之为知之，不知为不知。',
        '听懂问题，比给出答案更难。',
        '好的回答，从好的提问开始。',
        '学问，是学着问。',
        '把书读薄，把事想透。',
        '答案会过时，思考不会。',
        '你慢慢问，我认真答。',
        '一词一句，皆有来处。',
        '授人以鱼，不如授人以渔。',
        '温故而知新。',
        '把复杂的讲简单，是本事。',
        '理解，是最温柔的能力。',
        '今天也想明白一件小事。',
        '三人行，必有我师。'
      ],
      // 底座（水果盘）相对尺寸/位置微调，缺省回退到全局云朵参数
      cloudScaleW: 1.5,
      cloudScaleH: 0.71,
      cloudOffsetY: 0.2,
      frames: {
        idle: './assets/douknow/idle.webp?v=2',
        idleWink: './assets/douknow/idle-wink.webp?v=2',
        walkFront1: './assets/douknow/walk-front-1.webp?v=2',
        walkFront2: './assets/douknow/walk-front-2.webp?v=2',
        walkLeft: './assets/douknow/walk-left.webp?v=2',
        walkRight: './assets/douknow/walk-right.webp?v=2',
        walkBack: './assets/douknow/walk-back-1.webp?v=2',
        sleep: './assets/douknow/sleep.webp?v=2',
        cloud: './assets/douknow/fruit-plate.webp?v=2'
      }
    },
    {
      id: 'xiaodou',
      name: '小豆',
      startXRatio: 0.5,
      // 小豆是"主角"，比另外两只稍大，凸显存在感
      sizeScale: 1.15,
      // idle 变体：IDLE 状态下随机切换这些帧（getCurrentFrame 会用到）
      idleVariants: ['idle-think', 'idle-look'],
      // idle 状态偶尔触发的"事件"帧，播放一次后回到 idle
      idleEvents: [
        { frame: 'wave', chance: 0.15, duration: 1800 },
        { frame: 'happy', chance: 0.08, duration: 1600 }
      ],
      quotes: [
        '路还长，慢慢走。',
        '把书读薄，把事做实。',
        '好奇是起点，耐心是路。',
        '先理解问题，再寻找答案。',
        '细节里藏着答案。',
        '换个角度，往往就通了。',
        '教是最好的学。',
        '慢一点，反而快。',
        '今日宜：学一件小事。',
        '把复杂留给自己，把简单留给别人。',
        '看得近一点，世界会不一样。',
        '记录，是给未来的自己写信。',
        '保持好奇，保持耐心。',
        '技术是手段，人是目的。'
      ],
      // 底座（书卷）相对尺寸/位置：比云朵窄一点、更贴近脚下
      cloudScaleW: 1.4,
      cloudScaleH: 0.62,
      cloudOffsetY: 0.22,
      frames: {
        idle: './assets/xiaodou/idle.webp?v=1',
        idleWink: './assets/xiaodou/idle-wink.webp?v=1',
        // 新增 idle 变体（老 pet 没这些 key，getCurrentFrame 会 fallback）
        idleThink: './assets/xiaodou/idle-think.webp?v=1',
        idleLook: './assets/xiaodou/idle-look.webp?v=1',
        // walk 系列：每方向 2 帧循环
        walkFront1: './assets/xiaodou/walk-front-1.webp?v=1',
        walkFront2: './assets/xiaodou/walk-front-2.webp?v=1',
        walkLeft1: './assets/xiaodou/walk-left-1.webp?v=1',
        walkLeft2: './assets/xiaodou/walk-left-2.webp?v=1',
        walkRight1: './assets/xiaodou/walk-right-1.webp?v=1',
        walkRight2: './assets/xiaodou/walk-right-2.webp?v=1',
        walkBack1: './assets/xiaodou/walk-back-1.webp?v=1',
        walkBack2: './assets/xiaodou/walk-back-2.webp?v=1',
        // sleep 系列：2 帧呼吸
        sleep: './assets/xiaodou/sleep.webp?v=1',
        sleep2: './assets/xiaodou/sleep-2.webp?v=1',
        // 互动事件帧
        wave: './assets/xiaodou/wave.webp?v=1',
        happy: './assets/xiaodou/happy.webp?v=1',
        // 底座（书卷）
        cloud: './assets/xiaodou/scroll.webp?v=1'
      }
    }
  ]
};

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// 'idle-think' → 'idleThink'：把 kebab-case 帧名转成 frames 对象的驼峰 key
function camelKey(kebab) {
  return kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
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
  constructor(ctx, skin, images, opts = {}, canvasWidth, canvasHeight) {
    this.ctx = ctx;
    this.skin = skin;
    this.images = images;
    this.quotes = skin.quotes || [];
    this.canvasW = canvasWidth;
    this.canvasH = canvasHeight;
    this.bounds = { left: 0, top: 0, width: canvasWidth, height: canvasHeight };
    this.exclusions = []; // 禁区矩形列表（父页面下发：导航/卡片/标题等不可进入区域）

    this.sizeScale = opts.sizeScale != null ? opts.sizeScale : (skin.sizeScale != null ? skin.sizeScale : 1);
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

    // 新增：sleep 2 帧呼吸循环
    this.sleepFrameIndex = 0;
    this.sleepFrameTimer = 0;
    // 新增：idle 变体（think/look）随机切换
    this.idleVariant = null;
    this.idleVariantTimer = 0;
    // 新增：idle 事件帧（wave/happy）偶尔播放
    this.idleEventFrame = null;
    this.idleEventTimer = 0;

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

  setExclusions(rects) {
    this.exclusions = (Array.isArray(rects) ? rects : []).filter(r =>
      r && Number.isFinite(r.left) && Number.isFinite(r.top) && r.width > 0 && r.height > 0
    );
  }

  // 禁区：走进矩形就被推到最近的一条边，并反弹速度（导航/卡片/标题不被遮挡）
  applyExclusions() {
    if (!this.exclusions.length) return;
    const pad = this.size * 0.5 + 8;
    for (const e of this.exclusions) {
      const left = e.left - pad, right = e.left + e.width + pad;
      const top = e.top - pad, bottom = e.top + e.height + pad;
      if (this.x <= left || this.x >= right || this.y <= top || this.y >= bottom) continue;
      const dl = this.x - left, dr = right - this.x;
      const dtp = this.y - top, db = bottom - this.y;
      const m = Math.min(dl, dr, dtp, db);
      if (m === dl) { this.x = left; if (this.vx > 0) this.vx = -this.vx; }
      else if (m === dr) { this.x = right; if (this.vx < 0) this.vx = -this.vx; }
      else if (m === dtp) { this.y = top; if (this.vy > 0) this.vy = -this.vy; }
      else { this.y = bottom; if (this.vy < 0) this.vy = -this.vy; }
    }
    this.updateDirection();
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
    this.applyExclusions();
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
    const list = this.quotes;
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
    // 1) 眨眼（原有逻辑）
    if (!this.isWinking) {
      if (Math.random() < PET_CONFIG.winkChance * (dt / 16)) {
        this.isWinking = true;
        this.winkTimer = PET_CONFIG.winkDuration;
      }
    } else {
      this.winkTimer -= dt;
      if (this.winkTimer <= 0) this.isWinking = false;
    }

    // 2) idle 事件帧（wave/happy）播放中 → 倒计时，结束清空
    if (this.idleEventFrame) {
      this.idleEventTimer -= dt;
      if (this.idleEventTimer <= 0) this.idleEventFrame = null;
      return;  // 事件帧播放期间不切换变体
    }

    // 3) idle 事件触发（仅 skin 配置了 idleEvents 时）
    const events = this.skin.idleEvents;
    if (events && events.length > 0 && !this.idleVariant && !this.isWinking) {
      for (const ev of events) {
        // 低频触发：chance * (dt/16) * 0.1
        if (Math.random() < ev.chance * (dt / 16) * 0.1) {
          const imgKey = camelKey(ev.frame);
          if (this.images[imgKey]) {
            this.idleEventFrame = imgKey;
            this.idleEventTimer = ev.duration;
            return;
          }
        }
      }
    }

    // 4) idle 变体（think/look）切换：当前无变体时，有概率切一个
    const variants = this.skin.idleVariants;
    if (variants && variants.length > 0 && !this.idleVariant && !this.isWinking) {
      if (Math.random() < 0.0008 * (dt / 16)) {
        const key = camelKey(variants[Math.floor(Math.random() * variants.length)]);
        if (this.images[key]) {
          this.idleVariant = key;
          this.idleVariantTimer = randomRange(3000, 6000);
        }
      }
    }

    // 5) idle 变体倒计时
    if (this.idleVariant) {
      this.idleVariantTimer -= dt;
      if (this.idleVariantTimer <= 0) this.idleVariant = null;
    }
  }

  updateSleep(dt, time) {
    // sleep 2 帧呼吸循环（仅 sleep2 存在时生效）
    if (this.images.sleep2) {
      this.sleepFrameTimer += dt;
      if (this.sleepFrameTimer >= 2400) {
        this.sleepFrameTimer = 0;
        this.sleepFrameIndex = (this.sleepFrameIndex + 1) % 2;
      }
    }

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

    // idle 事件帧（wave/happy）播放中优先
    if (this.state === PetState.IDLE && this.idleEventFrame && this.images[this.idleEventFrame]) {
      return this.images[this.idleEventFrame];
    }

    switch (this.state) {
      case PetState.IDLE:
        // 眨眼优先
        if (this.isWinking && this.images.idleWink) return this.images.idleWink;
        // idle 变体（think/look），无则 fallback 到 idle
        if (this.idleVariant && this.images[this.idleVariant]) return this.images[this.idleVariant];
        return this.images.idle;
      case PetState.WALK:
        // 每方向优先 2 帧循环，fallback 到老单帧 key（walkLeft/walkRight/walkBack）
        if (this.direction === Direction.LEFT) {
          if (this.walkFrameIndex === 1 && this.images.walkLeft2) return this.images.walkLeft2;
          return this.images.walkLeft1 || this.images.walkLeft;
        }
        if (this.direction === Direction.RIGHT) {
          if (this.walkFrameIndex === 1 && this.images.walkRight2) return this.images.walkRight2;
          return this.images.walkRight1 || this.images.walkRight;
        }
        if (this.direction === Direction.BACK) {
          if (this.walkFrameIndex === 1 && this.images.walkBack2) return this.images.walkBack2;
          return this.images.walkBack1 || this.images.walkBack;
        }
        // FRONT
        return this.walkFrameIndex === 0 ? this.images.walkFront1 : this.images.walkFront2;
      case PetState.SLEEP:
        // 2 帧呼吸循环，无 sleep2 则 fallback 到单帧
        if (this.sleepFrameIndex === 1 && this.images.sleep2) return this.images.sleep2;
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
    // 捕获外层全局透明度（用于淡入淡出），本方法内所有子段都基于它叠加
    const baseAlpha = ctx.globalAlpha;
    const cloud = this.images.cloud;
    const scaleW = this.skin.cloudScaleW != null ? this.skin.cloudScaleW : PET_CONFIG.cloudScaleW;
    const scaleH = this.skin.cloudScaleH != null ? this.skin.cloudScaleH : PET_CONFIG.cloudScaleH;
    const offsetY = this.skin.cloudOffsetY != null ? this.skin.cloudOffsetY : PET_CONFIG.cloudOffsetY;
    const cloudW = this.size * (scaleW + Math.min(0.28, Math.abs(this.vx) * 0.04));
    const cloudH = this.size * scaleH;
    const cloudX = this.x - cloudW * 0.5;
    const cloudY = this.y + this.size * offsetY;
    if (cloud) {
      ctx.save();
      ctx.globalAlpha = (this.isDragging ? 0.92 : 0.82) * baseAlpha;
      ctx.drawImage(cloud, cloudX, cloudY, cloudW, cloudH);
      ctx.restore();
    } else {
      const shadowW = this.size * 0.70;
      const shadowH = this.size * 0.14;
      ctx.save();
      ctx.globalAlpha = 0.14 * baseAlpha;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + this.size * 0.42, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 哲理金句气泡（绘于宠物上方）
    if (this.talkText) {
      this.drawTalkBubble(ctx, baseAlpha);
    }

    if (this.state === PetState.SLEEP) {
      for (const b of this.sleepBubbles) {
        ctx.save();
        ctx.globalAlpha = b.alpha * 0.7 * baseAlpha;
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

  drawTalkBubble(ctx, baseAlpha) {
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

    ctx.globalAlpha = this.talkAlpha * baseAlpha;

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
    this.bridgeDragPet = null;
    // 可见性：父页面控制（未进入活动区域时隐藏，避免挤在 hero 上方夹缝）
    this.targetAlpha = 1;     // 目标透明度（父页面下发）
    this.currentAlpha = 0;    // 当前透明度（逐帧逼近目标，做淡入淡出）
    this.visible = false;     // currentAlpha > 0.01 才算可见

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
    console.log('[DouknowPet] 宠物系统已启动（当前登场：' + this.pets.map(p => p.skin.name).join('、') + ')');
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
    this.skinImages = {};
    await Promise.all(PET_CONFIG.skins.map(async (skin) => {
      const images = {};
      const entries = Object.entries(skin.frames);
      await Promise.all(entries.map(async ([key, src]) => {
        images[key] = await loadImage(src);
      }));
      this.skinImages[skin.id] = images;
    }));
    this.imagesLoaded = true;
  }

  createPets() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // enabled 未显式设置的视为启用（兼容旧 skin 定义）
    const activeSkins = PET_CONFIG.skins.filter(s => s.enabled !== false);
    activeSkins.forEach((skin, i) => {
      const pet = new DouknowPet(this.ctx, skin, this.skinImages[skin.id], {
        x: w * (skin.startXRatio != null ? skin.startXRatio : 0.3 + i * 0.4),
        y: h * 0.72,
        // sizeScale 不传，让 constructor 走 skin.sizeScale fallback（小豆 1.15，其他 1）
        speedScale: randomRange(0.85, 1.15)
      }, w, h);
      this.pets.push(pet);
    });
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
      } else if (data.type === 'douknow-pet-exclusions') {
        this.setExclusions(data.rects);
      } else if (data.type === 'douknow-pet-visibility') {
        // 父页面控制显隐：未进入活动区时 visible=false，小豆淡出隐藏
        this.targetAlpha = data.visible ? 1 : 0;
      } else if (data.type === 'douknow-pet-pointer') {
        this.mouseX = Number(data.x);
        this.mouseY = Number(data.y);
      } else if (data.type === 'douknow-pet-drag-start') {
        // 后画的在上层，倒序命中
        const px = Number(data.x);
        const py = Number(data.y);
        this.bridgeDragPet = null;
        for (let i = this.pets.length - 1; i >= 0; i--) {
          if (this.pets[i].containsPoint(px, py)) {
            this.bridgeDragPet = this.pets[i];
            break;
          }
        }
        if (this.bridgeDragPet) this.bridgeDragPet.startDrag(px, py, performance.now());
      } else if (data.type === 'douknow-pet-drag-move') {
        if (this.bridgeDragPet) this.bridgeDragPet.dragTo(Number(data.x), Number(data.y), performance.now());
      } else if (data.type === 'douknow-pet-drag-end') {
        if (this.bridgeDragPet) {
          this.bridgeDragPet.endDrag();
          this.bridgeDragPet = null;
        }
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

  setExclusions(rects) {
    const list = Array.isArray(rects) ? rects : [];
    for (const pet of this.pets) pet.setExclusions(list);
  }

  loop(timestamp) {
    if (!this.isRunning) return;
    const dt = Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;

    // 透明度逐帧逼近目标，做淡入/淡出（300ms 软过渡，避免硬切）
    const fadeSpeed = 1 / 300;
    if (this.currentAlpha < this.targetAlpha) {
      this.currentAlpha = Math.min(this.targetAlpha, this.currentAlpha + dt * fadeSpeed);
    } else if (this.currentAlpha > this.targetAlpha) {
      this.currentAlpha = Math.max(this.targetAlpha, this.currentAlpha - dt * fadeSpeed);
    }
    this.visible = this.currentAlpha > 0.01;

    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    this.ctx.clearRect(0, 0, width, height);

    // 完全隐藏时跳过更新与绘制（省 CPU，也避免隐藏期间还在跑物理）
    if (!this.visible) {
      this.rafId = requestAnimationFrame((t) => this.loop(t));
      return;
    }

    for (const pet of this.pets) {
      pet.update(dt, timestamp, this.mouseX, this.mouseY);
    }

    // 宠物间分离：防止两只宠物重叠/穿插
    this.applyPetSeparation(dt);

    // 全局透明度（淡入淡出）。用 save/restore 包住：draw 内部会自己改 globalAlpha，
    // 但都在自己的 save/restore 里，restore 后回到这里设的 currentAlpha（乘法叠加）。
    this.ctx.save();
    this.ctx.globalAlpha = this.currentAlpha;
    for (const pet of this.pets) {
      pet.draw(this.ctx);
    }
    this.ctx.restore();

    this.boundsPostTimer += dt;
    if (this.boundsPostTimer > 80) {
      this.boundsPostTimer = 0;
      this.postBounds();
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  applyPetSeparation(dt) {
    const pets = this.pets;
    const sepDist = PET_CONFIG.petSeparationDist;
    const force = PET_CONFIG.petSeparationForce;
    const dtFactor = dt / 16;

    for (let i = 0; i < pets.length; i++) {
      for (let j = i + 1; j < pets.length; j++) {
        const a = pets[i];
        const b = pets[j];
        if (a.isDragging || b.isDragging) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= sepDist || dist < 0.01) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const strength = (1 - dist / sepDist) * force;

        // 速度层面：软推开
        a.vx -= nx * strength * dtFactor;
        a.vy -= ny * strength * dtFactor;
        b.vx += nx * strength * dtFactor;
        b.vy += ny * strength * dtFactor;

        // 位置层面：硬分离（防止完全重叠）
        const minDist = (a.size + b.size) * 0.45;
        if (dist < minDist) {
          const overlap = (minDist - dist) * 0.5;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
        }
      }
    }
  }

  postBounds() {
    if (!window.parent || window.parent === window || this.pets.length === 0) return;
    window.parent.postMessage({
      source: 'douknow-pet',
      type: 'douknow-pet-bounds',
      bounds: this.pets.map((pet) => pet.getHitBounds())
    }, '*');
  }

  destroy() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}

const bootParty = () => { window.__party = new PetParty(); };
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootParty);
} else {
  bootParty();
}
