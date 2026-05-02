import { Game } from './game';
import { LEVELS } from './config';
import { StorageManager } from './storage';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

const scoreEl = document.getElementById('score') as HTMLSpanElement;
const levelEl = document.getElementById('level') as HTMLSpanElement;
const stepsEl = document.getElementById('steps') as HTMLSpanElement;
const highScoreEl = document.getElementById('highScore') as HTMLSpanElement;
const targetScoreEl = document.getElementById('targetScore') as HTMLSpanElement;
const gameMessageEl = document.getElementById('gameMessage') as HTMLDivElement;
const levelSelect = document.getElementById('levelSelect') as HTMLSelectElement;
const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
const restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;

function updateUI() {
  scoreEl.textContent = game.state.score.toString();
  levelEl.textContent = game.state.level.toString();
  stepsEl.textContent = game.state.steps.toString();
  highScoreEl.textContent = game.state.highScore.toString();
  targetScoreEl.textContent = LEVELS[game.state.level - 1].targetScore.toString();

  if (game.state.levelComplete) {
    if (game.state.level < 5) {
      gameMessageEl.innerHTML = `
        <div>🎉 恭喜过关！</div>
        <div>分数: ${game.state.score}</div>
        <button onclick="game.restart()">下一关</button>
      `;
    } else {
      gameMessageEl.innerHTML = `
        <div>🏆 恭喜通关！</div>
        <div>最终分数: ${game.state.score}</div>
        <button onclick="game.restart()">重新开始</button>
      `;
    }
    gameMessageEl.classList.remove('hidden');
  } else if (game.state.gameOver) {
    gameMessageEl.innerHTML = `
      <div>💔 游戏结束</div>
      <div>分数: ${game.state.score}</div>
      <button onclick="game.restart()">重新开始</button>
    `;
    gameMessageEl.classList.remove('hidden');
  } else if (game.state.paused) {
    gameMessageEl.innerHTML = `
      <div>⏸️ 游戏暂停</div>
      <div>按 P 键继续</div>
    `;
    gameMessageEl.classList.remove('hidden');
  } else {
    gameMessageEl.classList.add('hidden');
  }

  requestAnimationFrame(updateUI);
}

levelSelect.value = game.state.level.toString();
themeSelect.value = game.state.theme;

levelSelect.addEventListener('change', (e) => {
  const level = parseInt((e.target as HTMLSelectElement).value);
  game.setLevel(level);
  initLevelOptions();
});

themeSelect.addEventListener('change', (e) => {
  const theme = (e.target as HTMLSelectElement).value as 'candy' | 'metal' | 'jungle';
  game.setTheme(theme);
});

restartBtn.addEventListener('click', () => {
  game.restart();
});

function initLevelOptions() {
  const maxUnlocked = StorageManager.getMaxUnlockedLevel();
  for (let i = 1; i <= 5; i++) {
    const option = levelSelect.querySelector(`option[value="${i}"]`);
    if (option) {
      if (i > maxUnlocked) {
        option.disabled = true;
        option.textContent = `关卡 ${i} (未解锁`;
      } else {
        option.disabled = false;
        option.textContent = `关卡 ${i}`;
      }
    }
  }
}

initLevelOptions();
game.start();
updateUI();
