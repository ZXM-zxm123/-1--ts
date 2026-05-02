export type Color = 0 | 1 | 2 | 3 | 4;

export type BlockType = 'normal' | 'bomb' | 'sticky' | 'speedUp' | 'colorChange' | 'columnBomb';

export interface Block {
  color: Color;
  type: BlockType;
  x: number;
  y: number;
  id: number;
}

export interface Column {
  blocks: Block[];
  locked: boolean;
  lockTimer: number;
}

export interface ThemeColors {
  [key: number]: string;
  background: string;
  border: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export interface LevelConfig {
  targetScore: number;
  fallSpeed: number;
  maxSteps: number;
}

export interface GameState {
  score: number;
  level: number;
  steps: number;
  highScore: number;
  maxUnlockedLevel: number;
  currentBlock: Block | null;
  columns: Column[];
  speedMultiplier: number;
  gameOver: boolean;
  levelComplete: boolean;
  paused: boolean;
  theme: 'candy' | 'metal' | 'jungle';
  bombMode: boolean;
}

export const COLS = 8;
export const COLOR_COUNT = 5;
export const BLOCK_SIZE = 50;
export const CANVAS_WIDTH = COLS * BLOCK_SIZE;
export const CANVAS_HEIGHT = 600;
export const STACK_HEIGHT = CANVAS_HEIGHT - 100;
