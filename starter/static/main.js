// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let timerInterval = null;
let timerStart = null;
let solved = false;

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
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        updateValidation();
        if (!e.target.disabled) {
          void maybeAutoCheck();
        }
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

function startTimer() {
  stopTimer();
  timerStart = Date.now();
  solved = false;
  updateTimerDisplay();
  timerInterval = window.setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
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
  solved = true;
  stopTimer();
  showMessage('🎉 Congratulations! Puzzle Solved!', '#388e3c');
}

async function maybeAutoCheck() {
  const board = readBoardFromDom();
  const hasEmptyCell = board.some((row) => row.some((value) => value === 0));
  if (hasEmptyCell || solved) {
    return;
  }

  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  if (data.error) {
    return;
  }

  if (data.solved) {
    handleSolvedState();
    return;
  }

  showMessage('Some cells are incorrect.', '#d32f2f');
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
      inp.className = 'sudoku-cell';
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
  startTimer();
}

async function newGame() {
  const difficulty = document.getElementById('difficulty').value;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
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

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  // initialize
  newGame();
});