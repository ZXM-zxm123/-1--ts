import { Block, Color, Column, GameState, BlockType, COLS, COLOR_COUNT, BLOCK_SIZE, CANVAS_HEIGHT, STACK_HEIGHT } from './types';
import { THEMES, LEVELS, BOMB_BLOCK_CHANCE, STICKY_BLOCK_CHANCE, SPEED_UP_CHANCE, COLOR_CHANGE_CHANCE, COLUMN_BOMB_CHANCE } from './config';
import { StorageManager } from './storage';

let blockIdCounter = 0;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public state: GameState;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = this.createInitialState();
    this.setupEventListeners();
  }

  private createInitialState(): GameState {
    const columns: Column[] = [];
    for (let i = 0; i < COLS; i++) {
      columns.push({ blocks: [], locked: false, lockTimer: 0 });
    }

    return {
      score: 0,
      level: 1,
      steps: 0,
      highScore: StorageManager.getHighScore(),
      maxUnlockedLevel: StorageManager.getMaxUnlockedLevel(),
      currentBlock: this.spawnBlock(),
      columns,
      speedMultiplier: 1,
      gameOver: false,
      levelComplete: false,
      paused: false,
      theme: StorageManager.getTheme(),
      bombMode: false
    };
  }

  private spawnBlock(): Block {
    const color = Math.floor(Math.random() * COLOR_COUNT) as Color;
    let type: BlockType = 'normal';
    const rand = Math.random();
    
    if (rand < BOMB_BLOCK_CHANCE) type = 'bomb';
    else if (rand < BOMB_BLOCK_CHANCE + STICKY_BLOCK_CHANCE) type = 'sticky';
    else if (rand < BOMB_BLOCK_CHANCE + STICKY_BLOCK_CHANCE + SPEED_UP_CHANCE) type = 'speedUp';
    else if (rand < BOMB_BLOCK_CHANCE + STICKY_BLOCK_CHANCE + SPEED_UP_CHANCE + COLOR_CHANGE_CHANCE) type = 'colorChange';
    else if (rand < BOMB_BLOCK_CHANCE + STICKY_BLOCK_CHANCE + SPEED_UP_CHANCE + COLOR_CHANGE_CHANCE + COLUMN_BOMB_CHANCE) type = 'columnBomb';

    return {
      color,
      type,
      x: Math.floor(COLS / 2) * BLOCK_SIZE,
      y: 0,
      id: ++blockIdCounter
    };
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.state.gameOver || this.state.levelComplete) {
      if (e.key === 'Enter' || e.key === ' ') {
        this.restart();
      }
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      this.state.paused = !this.state.paused;
      return;
    }

    if (this.state.paused) return;

    if (this.state.bombMode) return;

    switch (e.key) {
      case 'ArrowLeft':
        this.moveBlock(-1);
        break;
      case 'ArrowRight':
        this.moveBlock(1);
        break;
      case ' ':
        e.preventDefault();
        this.state.speedMultiplier = 5;
        break;
    }
  }

  private handleCanvasClick(e: MouseEvent): void {
    if (this.state.bombMode && this.state.currentBlock?.type === 'columnBomb') {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const col = Math.floor(x / BLOCK_SIZE);
      if (col >= 0 && col < COLS) {
        this.useColumnBomb(col);
      }
    }
  }

  private moveBlock(direction: number): void {
    if (!this.state.currentBlock) return;
    const newX = this.state.currentBlock.x + direction * BLOCK_SIZE;
    const minX = 0;
    const maxX = COLS * BLOCK_SIZE - BLOCK_SIZE;
    const clampedX = Math.max(minX, Math.min(newX, maxX));
    const colIndex = Math.floor(clampedX / BLOCK_SIZE);
    if (!this.state.columns[colIndex].locked) {
      this.state.currentBlock.x = clampedX;
    }
  }

  private useColumnBomb(colIndex: number): void {
    const column = this.state.columns[colIndex];
    const removeCount = Math.min(3, column.blocks.length);
    const removed = column.blocks.splice(0, removeCount);
    this.state.score += removed.length * 20;
    this.state.bombMode = false;
    this.checkGameConditions();
    this.spawnNewBlock();
  }

  private checkCollision(block: Block): boolean {
    const colIndex = Math.floor(block.x / BLOCK_SIZE);
    const column = this.state.columns[colIndex];
    const nextY = block.y + LEVELS[this.state.level - 1].fallSpeed * this.state.speedMultiplier;
    const bottomY = STACK_HEIGHT - column.blocks.length * BLOCK_SIZE;
    return nextY >= bottomY;
  }

  private landBlock(): void {
    if (!this.state.currentBlock) return;

    const block = this.state.currentBlock;
    const colIndex = Math.floor(block.x / BLOCK_SIZE);
    const column = this.state.columns[colIndex];

    block.y = STACK_HEIGHT - (column.blocks.length + 1) * BLOCK_SIZE;
    column.blocks.unshift({ ...block });

    this.state.steps++;
    this.state.speedMultiplier = 1;

    this.handleSpecialBlock(block, colIndex);
    this.checkMatches();
    this.checkGameConditions();

    if (!this.state.gameOver && !this.state.levelComplete) {
      this.spawnNewBlock();
    }
  }

  private handleSpecialBlock(block: Block, colIndex: number): void {
    switch (block.type) {
      case 'bomb':
        this.triggerBomb(colIndex);
        break;
      case 'sticky':
        this.state.columns[colIndex].locked = true;
        this.state.columns[colIndex].lockTimer = 3;
        break;
      case 'speedUp':
        this.state.speedMultiplier = 3;
        break;
      case 'colorChange':
        if (this.state.currentBlock) {
          this.state.currentBlock.color = Math.floor(Math.random() * COLOR_COUNT) as Color;
        }
        break;
      case 'columnBomb':
        this.state.bombMode = true;
        break;
    }
  }

  private triggerBomb(colIndex: number): void {
    const affectedCols = [colIndex - 1, colIndex, colIndex + 1].filter(c => c >= 0 && c < COLS);
    for (const c of affectedCols) {
      const column = this.state.columns[c];
      if (column.blocks.length > 0) {
        const removed = column.blocks.shift()!;
        this.state.score += 15;
      }
    }
  }

  private checkMatches(): void {
    for (let colIndex = 0; colIndex < COLS; colIndex++) {
      const column = this.state.columns[colIndex];
      let matchStart = -1;
      let matchLength = 1;

      for (let i = 0; i < column.blocks.length; i++) {
        if (i > 0 && column.blocks[i].color === column.blocks[i - 1].color) {
          matchLength++;
          if (matchStart === -1) matchStart = i - 1;
        } else {
          if (matchLength >= 3) {
            this.removeMatches(colIndex, matchStart, matchLength);
          }
          matchStart = -1;
          matchLength = 1;
        }
      }

      if (matchLength >= 3) {
        this.removeMatches(colIndex, matchStart, matchLength);
      }
    }
  }

  private removeMatches(colIndex: number, start: number, length: number): void {
    const column = this.state.columns[colIndex];
    const bonus = start * 10;
    const baseScore = length * 50;
    this.state.score += baseScore + bonus;
    column.blocks.splice(start, length);
  }

  private checkGameConditions(): void {
    const levelConfig = LEVELS[this.state.level - 1];

    if (this.state.score >= levelConfig.targetScore) {
      this.state.levelComplete = true;
      if (this.state.level < 5 && this.state.level >= this.state.maxUnlockedLevel) {
        this.state.maxUnlockedLevel = this.state.level + 1;
        StorageManager.setMaxUnlockedLevel(this.state.maxUnlockedLevel);
      }
    }

    if (this.state.steps >= levelConfig.maxSteps && !this.state.levelComplete) {
      this.state.gameOver = true;
    }

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      StorageManager.setHighScore(this.state.highScore);
    }
  }

  private spawnNewBlock(): void {
    this.state.currentBlock = this.spawnBlock();
  }

  private update(deltaTime: number): void {
    if (this.state.paused || this.state.gameOver || this.state.levelComplete) {
      return;
    }

    this.accumulator += deltaTime;
    const dt = 1 / 60;

    while (this.accumulator >= dt) {
      this.updateLockTimers(dt);

      if (this.state.currentBlock) {
        if (this.checkCollision(this.state.currentBlock)) {
          this.landBlock();
        } else {
          this.state.currentBlock.y += LEVELS[this.state.level - 1].fallSpeed * this.state.speedMultiplier;
        }
        const minX = 0;
        const maxX = COLS * BLOCK_SIZE - BLOCK_SIZE;
        this.state.currentBlock.x = Math.max(minX, Math.min(this.state.currentBlock.x, maxX));
      }

      this.accumulator -= dt;
    }
  }

  private updateLockTimers(dt: number): void {
    for (const column of this.state.columns) {
      if (column.locked) {
        column.lockTimer -= dt;
        if (column.lockTimer <= 0) {
          column.locked = false;
        }
      }
    }
  }

  private render(): void {
    const theme = THEMES[this.state.theme];

    this.ctx.fillStyle = theme.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = theme.colors.border;
    this.ctx.lineWidth = 2;
    for (let i = 0; i <= COLS; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * BLOCK_SIZE, 0);
      this.ctx.lineTo(i * BLOCK_SIZE, CANVAS_HEIGHT);
      this.ctx.stroke();
    }

    this.ctx.beginPath();
    this.ctx.moveTo(0, STACK_HEIGHT);
    this.ctx.lineTo(CANVAS_WIDTH, STACK_HEIGHT);
    this.ctx.stroke();

    for (let colIndex = 0; colIndex < COLS; colIndex++) {
      const column = this.state.columns[colIndex];
      if (column.locked) {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(colIndex * BLOCK_SIZE, 0, BLOCK_SIZE, STACK_HEIGHT);
      }

      for (let i = 0; i < column.blocks.length; i++) {
        const block = column.blocks[i];
        this.drawBlock(colIndex * BLOCK_SIZE, STACK_HEIGHT - (i + 1) * BLOCK_SIZE, block, theme);
      }
    }

    if (this.state.currentBlock) {
      this.drawBlock(this.state.currentBlock.x, this.state.currentBlock.y, this.state.currentBlock, theme);
    }

    if (this.state.bombMode) {
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('点击列使用炸弹！', CANVAS_WIDTH / 2, 50);
    }
  }

  private drawBlock(x: number, y: number, block: Block, theme: any): void {
    this.ctx.fillStyle = theme.colors[block.color];
    this.ctx.fillRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

    if (block.type !== 'normal') {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const cx = x + BLOCK_SIZE / 2;
      const cy = y + BLOCK_SIZE / 2;

      switch (block.type) {
        case 'bomb':
          this.ctx.fillText('💣', cx, cy);
          break;
        case 'sticky':
          this.ctx.fillText('🟡', cx, cy);
          break;
        case 'speedUp':
          this.ctx.fillText('⚡', cx, cy);
          break;
        case 'colorChange':
          this.ctx.fillText('🎨', cx, cy);
          break;
        case 'columnBomb':
          this.ctx.fillText('🧨', cx, cy);
          break;
      }
    }
  }

  private gameLoop = (timestamp: number): void => {
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  public start(): void {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  public setLevel(level: number): void {
    this.state.level = level;
    this.state.score = 0;
    this.state.steps = 0;
    this.state.gameOver = false;
    this.state.levelComplete = false;
    this.state.bombMode = false;

    for (let i = 0; i < COLS; i++) {
      this.state.columns[i] = { blocks: [], locked: false, lockTimer: 0 };
    }

    this.state.currentBlock = this.spawnBlock();
  }

  public setTheme(theme: 'candy' | 'metal' | 'jungle'): void {
    this.state.theme = theme;
    StorageManager.setTheme(theme);
  }

  public restart(): void {
    if (this.state.levelComplete && this.state.level < 5) {
      this.setLevel(this.state.level + 1);
    } else {
      this.setLevel(this.state.level);
    }
  }
}
