import { Theme, LevelConfig } from './types';

export const THEMES: Record<string, Theme> = {
  candy: {
    name: '糖果',
    colors: {
      0: '#FF69B4',
      1: '#FFD700',
      2: '#00CED1',
      3: '#FF6347',
      4: '#9370DB',
      background: '#FFF0F5',
      border: '#FFB6C1'
    }
  },
  metal: {
    name: '金属',
    colors: {
      0: '#4682B4',
      1: '#B8860B',
      2: '#2F4F4F',
      3: '#8B4513',
      4: '#696969',
      background: '#F5F5F5',
      border: '#708090'
    }
  },
  jungle: {
    name: '丛林',
    colors: {
      0: '#228B22',
      1: '#8B4513',
      2: '#FFD700',
      3: '#32CD32',
      4: '#8B0000',
      background: '#F0FFF0',
      border: '#2E8B57'
    }
  }
};

export const LEVELS: LevelConfig[] = [
  { targetScore: 500, fallSpeed: 3, maxSteps: 50 },
  { targetScore: 1000, fallSpeed: 4, maxSteps: 45 },
  { targetScore: 2000, fallSpeed: 5, maxSteps: 40 },
  { targetScore: 3500, fallSpeed: 6, maxSteps: 35 },
  { targetScore: 5000, fallSpeed: 8, maxSteps: 30 }
];

export const BOMB_BLOCK_CHANCE = 0.05;
export const STICKY_BLOCK_CHANCE = 0.05;
export const SPEED_UP_CHANCE = 0.03;
export const COLOR_CHANGE_CHANCE = 0.03;
export const COLUMN_BOMB_CHANCE = 0.03;
