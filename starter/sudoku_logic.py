import copy
import random

SIZE = 9
EMPTY = 0


def deep_copy(board):
    return copy.deepcopy(board)


def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True


def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True


def remove_cells(board, clues):
    target_empty_cells = SIZE * SIZE - clues
    cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(cells)

    removed = 0
    for row, col in cells:
        if removed >= target_empty_cells:
            break
        if board[row][col] == EMPTY:
            continue

        original_value = board[row][col]
        board[row][col] = EMPTY
        if not has_unique_solution(board):
            board[row][col] = original_value
            continue

        removed += 1


def is_valid_puzzle(board):
    for row in range(SIZE):
        for col in range(SIZE):
            value = board[row][col]
            if value == EMPTY:
                continue
            if not 1 <= value <= SIZE:
                return False
            for check_col in range(SIZE):
                if check_col != col and board[row][check_col] == value:
                    return False
            for check_row in range(SIZE):
                if check_row != row and board[check_row][col] == value:
                    return False
            start_row = row - row % 3
            start_col = col - col % 3
            for offset_row in range(3):
                for offset_col in range(3):
                    check_row = start_row + offset_row
                    check_col = start_col + offset_col
                    if (check_row != row or check_col != col) and board[check_row][check_col] == value:
                        return False
    return True


def _find_empty_cell(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None


def count_solutions(board, limit=2):
    if not is_valid_puzzle(board):
        return 0

    empty_cell = _find_empty_cell(board)
    if empty_cell is None:
        return 1

    row, col = empty_cell
    possible = list(range(1, SIZE + 1))
    random.shuffle(possible)
    solutions = 0

    for candidate in possible:
        if is_safe(board, row, col, candidate):
            board[row][col] = candidate
            solutions += count_solutions(board, limit - solutions)
            board[row][col] = EMPTY
            if solutions >= limit:
                break

    return solutions


def has_unique_solution(board):
    return count_solutions(deep_copy(board), 2) == 1


def generate_puzzle(clues=35):
    while True:
        board = create_empty_board()
        fill_board(board)
        solution = deep_copy(board)
        remove_cells(board, clues)
        puzzle = deep_copy(board)
        if has_unique_solution(puzzle):
            return puzzle, solution
