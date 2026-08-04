// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const THEME_KEY = 'sudokuTheme';
const DEFAULT_THEME = 'light';
let puzzle = [];
let timerInterval = null;
let timerStart = null;
let solved = false;
let hintsUsed = 0;
let currentDifficulty = 'medium';
let gameCompleted = false;
const LEADERBOARD_KEY = 'sudoku-leaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

function applyTheme(theme) {
  const body = document.body;
  const isDark = theme === 'dark';
  body.classList.toggle('dark-theme', isDark);
  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.innerText = isDark ? 'Light Mode' : 'Dark Mode';
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    // ignore storage errors
  }
}

function loadTheme() {
  let theme = DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') {
      theme = stored;
    }
  } catch (err) {
    // ignore storage errors
  }
  applyTheme(theme);
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  saveTheme(nextTheme);
}

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function updateTimerDisplay() {
  if (!timerStart || solved) {
    return;
  }

  const elapsed = Math.floor((Date.now() - timerStart) / 1000);
  const timer = document.getElementById('timer');
  if (timer) {
    timer.innerText = `Time: ${formatTime(elapsed)}`;
  }
}

function resetTimerDisplay() {
  const timer = document.getElementById('timer');
  if (timer) {
    timer.innerText = 'Time: 00:00';
  }
}

function readLeaderboard() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    return [];
  }
}

function saveLeaderboard(entries) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch (err) {
    // ignore storage errors
  }
}

function renderLeaderboard() {
  const leaderboard = document.getElementById('leaderboard');
  if (!leaderboard) {
    return;
  }

  const entries = readLeaderboard()
    .slice()
    .sort((a, b) => a.timeSeconds - b.timeSeconds || a.hintsUsed - b.hintsUsed || a.completedAt.localeCompare(b.completedAt));

  if (!entries.length) {
    leaderboard.innerHTML = '<li>No scores yet.</li>';
    return;
  }

  leaderboard.innerHTML = '';
  entries.forEach((entry, index) => {
    const item = document.createElement('li');
    item.innerHTML = `<span>#${index + 1} ${entry.playerName || 'Anonymous'} — ${entry.difficulty}</span><span>${formatTime(entry.timeSeconds)} • hints: ${entry.hintsUsed}</span>`;
    leaderboard.appendChild(item);
  });
}

function recordScore() {
  const playerNameInput = document.getElementById('player-name');
  const playerName = playerNameInput && playerNameInput.value.trim() ? playerNameInput.value.trim() : 'Anonymous';
  const timeSeconds = timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0;
  const entry = {
    playerName,
    timeSeconds,
    difficulty: currentDifficulty,
    hintsUsed,
    completedAt: new Date().toISOString()
  };

  const entries = [...readLeaderboard(), entry]
    .sort((a, b) => a.timeSeconds - b.timeSeconds || a.hintsUsed - b.hintsUsed || a.completedAt.localeCompare(b.completedAt))
    .slice(0, MAX_LEADERBOARD_ENTRIES);
  saveLeaderboard(entries);
  renderLeaderboard();
}

function startTimer() {
  stopTimer();
  timerStart = Date.now();
  solved = false;
  resetTimerDisplay();
  updateTimerDisplay();
  timerInterval = window.setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function getCellClassName(row, col) {
  const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  return `sudoku-cell box-${boxIndex % 2 === 0 ? 'even' : 'odd'}`;
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = getCellClassName(i, j);
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        updateValidation();
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function readBoardFromDom() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  return board;
}

function getInvalidCellIndices(board) {
  const invalidCells = new Set();

  const markConflict = (row, col, otherRow, otherCol) => {
    invalidCells.add(row * SIZE + col);
    invalidCells.add(otherRow * SIZE + otherCol);
  };

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const value = board[row][col];
      if (!value) {
        continue;
      }

      for (let checkCol = 0; checkCol < SIZE; checkCol++) {
        if (checkCol !== col && board[row][checkCol] === value) {
          markConflict(row, col, row, checkCol);
        }
      }

      for (let checkRow = 0; checkRow < SIZE; checkRow++) {
        if (checkRow !== row && board[checkRow][col] === value) {
          markConflict(row, col, checkRow, col);
        }
      }

      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let offsetRow = 0; offsetRow < 3; offsetRow++) {
        for (let offsetCol = 0; offsetCol < 3; offsetCol++) {
          const checkRow = boxRow + offsetRow;
          const checkCol = boxCol + offsetCol;
          if ((checkRow !== row || checkCol !== col) && board[checkRow][checkCol] === value) {
            markConflict(row, col, checkRow, checkCol);
          }
        }
      }
    }
  }

  return invalidCells;
}

function updateValidation() {
  const boardDiv = document.getElementById('sudoku-board');
  if (!boardDiv) {
    return;
  }

  const inputs = boardDiv.getElementsByTagName('input');
  const board = readBoardFromDom();
  const invalidCells = getInvalidCellIndices(board);

  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    inp.classList.remove('invalid');

    if (inp.disabled) {
      continue;
    }

    if (invalidCells.has(idx)) {
      inp.classList.add('invalid');
    }
  }
}

function showMessage(text, color) {
  const msg = document.getElementById('message');
  if (!msg) {
    return;
  }
  msg.style.color = color;
  msg.innerText = text;
}

function handleSolvedState() {
  if (gameCompleted) {
    return;
  }

  solved = true;
  gameCompleted = true;
  stopTimer();
  updateTimerDisplay();
  recordScore();
  showMessage('🎉 Congratulations! Puzzle Solved! Score saved to the leaderboard.', '#388e3c');
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      inp.className = getCellClassName(i, j);
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.classList.add('prefilled');
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
  updateValidation();
}

async function newGame() {
  currentDifficulty = document.getElementById('difficulty').value;
  hintsUsed = 0;
  gameCompleted = false;
  solved = false;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(currentDifficulty)}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  startTimer();
  showMessage('', '#d32f2f');
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = readBoardFromDom();
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  if (data.error) {
    showMessage(data.error, '#d32f2f');
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0] * SIZE + x[1]));
  const invalidCells = getInvalidCellIndices(board);
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    inp.classList.remove('incorrect', 'invalid');
    if (inp.disabled) {
      continue;
    }
    if (incorrect.has(idx)) {
      inp.classList.add('incorrect');
    }
    if (invalidCells.has(idx)) {
      inp.classList.add('invalid');
    }
  }
  if (data.solved) {
    handleSolvedState();
  } else {
    showMessage('Some cells are incorrect.', '#d32f2f');
  }
}

async function getHint() {
  if (gameCompleted || solved) {
    return;
  }

  const res = await fetch('/hint');
  const data = await res.json();
  if (data.error) {
    showMessage(data.error, '#d32f2f');
    return;
  }
  hintsUsed += 1;
  renderPuzzle(data.puzzle);
  showMessage('Hint applied.', '#1976d2');
}

// Wire buttons
window.addEventListener('load', () => {
  const newGameButton = document.getElementById('new-game');
  const checkPuzzleButton = document.getElementById('check-puzzle');
  const checkButton = document.getElementById('check-solution');
  const hintButton = document.getElementById('hint');
  const themeToggle = document.getElementById('theme-toggle');

  if (newGameButton) {
    newGameButton.addEventListener('click', newGame);
  }
  if (checkPuzzleButton) {
    checkPuzzleButton.addEventListener('click', checkSolution);
  }
  if (checkButton) {
    checkButton.addEventListener('click', checkSolution);
  }
  if (hintButton) {
    hintButton.addEventListener('click', getHint);
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  loadTheme();
  renderLeaderboard();
  resetTimerDisplay();
  // initialize
  newGame();
});