const STORAGE_KEY_HIGH_SCORE = 'stack_crush_high_score';
const STORAGE_KEY_MAX_LEVEL = 'stack_crush_max_level';
const STORAGE_KEY_THEME = 'stack_crush_theme';

export class StorageManager {
  static getHighScore(): number {
    const score = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
    return score ? parseInt(score, 10) : 0;
  }

  static setHighScore(score: number): void {
    localStorage.setItem(STORAGE_KEY_HIGH_SCORE, score.toString());
  }

  static getMaxUnlockedLevel(): number {
    const level = localStorage.getItem(STORAGE_KEY_MAX_LEVEL);
    return level ? parseInt(level, 10) : 1;
  }

  static setMaxUnlockedLevel(level: number): void {
    localStorage.setItem(STORAGE_KEY_MAX_LEVEL, level.toString());
  }

  static getTheme(): 'candy' | 'metal' | 'jungle' {
    const theme = localStorage.getItem(STORAGE_KEY_THEME);
    return (theme as any) || 'candy';
  }

  static setTheme(theme: 'candy' | 'metal' | 'jungle'): void {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }
}
