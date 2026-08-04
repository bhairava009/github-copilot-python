"""Helpers for managing the current Sudoku game without Flask dependencies."""

from typing import List, Optional, Sequence, Tuple

from sudoku_logic import EMPTY, SIZE, deep_copy, generate_puzzle

Board = List[List[int]]


class GameStore:
    """Hold the current puzzle and its solved state in memory."""

    def __init__(self) -> None:
        self.puzzle: Optional[Board] = None
        self.solution: Optional[Board] = None

    def set_game(self, puzzle: Board, solution: Board) -> None:
        """Store a newly generated puzzle and its solution."""
        self.puzzle = puzzle
        self.solution = solution

    def clear(self) -> None:
        """Clear the current game state."""
        self.puzzle = None
        self.solution = None


GAME_STORE = GameStore()


def start_new_game(clues: int = 35) -> Tuple[Board, Board]:
    """Generate a new puzzle and solution, then store them."""
    puzzle, solution = generate_puzzle(clues)
    GAME_STORE.set_game(puzzle, solution)
    return puzzle, solution


def get_current_solution() -> Optional[Board]:
    """Return the active solution if a game is in progress."""
    return GAME_STORE.solution


def apply_hint() -> Board:
    """Fill one empty cell with the correct value and store the updated puzzle."""
    puzzle = GAME_STORE.puzzle
    solution = GAME_STORE.solution
    if puzzle is None or solution is None:
        raise ValueError("No game in progress")

    updated_puzzle = deep_copy(puzzle)
    for row in range(SIZE):
        for col in range(SIZE):
            if updated_puzzle[row][col] == EMPTY:
                updated_puzzle[row][col] = solution[row][col]
                GAME_STORE.puzzle = updated_puzzle
                return updated_puzzle

    GAME_STORE.puzzle = updated_puzzle
    return updated_puzzle


def is_board_solved(board: Sequence[Sequence[int]]) -> bool:
    """Return True when the board fully matches the active solution."""
    solution = GAME_STORE.solution
    if solution is None:
        raise ValueError("No game in progress")

    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] != solution[row][col]:
                return False
    return True


def check_board(board: Sequence[Sequence[int]]) -> List[List[int]]:
    """Return the coordinates of cells that do not match the solution."""
    solution = GAME_STORE.solution
    if solution is None:
        raise ValueError("No game in progress")

    incorrect: List[List[int]] = []
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] != solution[row][col]:
                incorrect.append([row, col])
    return incorrect
