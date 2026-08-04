import os
import sys

import pytest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "starter"))
sys.path.insert(0, ROOT)

import app as app_module
import game_service
import sudoku_logic


@pytest.fixture
def client():
    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as test_client:
        yield test_client


def test_flask_app_loads():
    assert app_module.app is not None
    assert app_module.app.name == "app"


def test_home_page_returns_200(client):
    response = client.get("/")
    assert response.status_code == 200


def test_home_page_includes_timer_display(client):
    response = client.get("/")
    assert response.status_code == 200
    assert 'id="timer"' in response.get_data(as_text=True)


def test_home_page_includes_check_puzzle_button(client):
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'id="check-puzzle"' in html
    assert 'Check Puzzle' in html


def test_home_page_includes_leaderboard_controls(client):
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'id="player-name"' in html
    assert 'id="leaderboard"' in html


def test_generated_board_is_valid_9x9_board(client):
    response = client.get("/new?clues=35")
    assert response.status_code == 200

    payload = response.get_json()
    board = payload["puzzle"]

    assert isinstance(board, list)
    assert len(board) == sudoku_logic.SIZE
    for row in board:
        assert isinstance(row, list)
        assert len(row) == sudoku_logic.SIZE
        for value in row:
            assert isinstance(value, int)
            assert 0 <= value <= sudoku_logic.SIZE

    assert is_valid_sudoku_board(board)


def test_difficulty_selector_generates_expected_clue_counts(client):
    expected_ranges = {
        "easy": (45, 50),
        "medium": (35, 40),
        "hard": (25, 30),
    }

    for difficulty, (lower, upper) in expected_ranges.items():
        response = client.get(f"/new?difficulty={difficulty}")
        assert response.status_code == 200

        payload = response.get_json()
        board = payload["puzzle"]
        clue_count = sum(1 for row in board for value in row if value != sudoku_logic.EMPTY)

        assert lower <= clue_count <= upper, (
            f"{difficulty} should have between {lower} and {upper} clues, got {clue_count}"
        )


def test_check_endpoint_reports_solved_when_board_matches_solution(client):
    client.get("/new?clues=35")
    solution = game_service.get_current_solution()

    response = client.post("/check", json={"board": solution})
    assert response.status_code == 200

    payload = response.get_json()
    assert payload["solved"] is True
    assert payload["incorrect"] == []


def test_check_endpoint_does_not_report_solved_for_incorrect_board(client):
    client.get("/new?clues=35")
    solution = game_service.get_current_solution()
    incorrect_board = [row[:] for row in solution]
    incorrect_board[0][0] = 0

    response = client.post("/check", json={"board": incorrect_board})
    assert response.status_code == 200

    payload = response.get_json()
    assert payload["solved"] is False
    assert payload["incorrect"] != []


def test_hint_endpoint_fills_one_empty_cell_with_the_correct_value(client):
    client.get("/new?clues=35")
    initial_board = game_service.GAME_STORE.puzzle
    initial_empty_count = sum(1 for row in initial_board for value in row if value == sudoku_logic.EMPTY)
    solution = game_service.get_current_solution()

    response = client.get("/hint")
    assert response.status_code == 200

    payload = response.get_json()
    hinted_board = payload["puzzle"]
    new_empty_count = sum(1 for row in hinted_board for value in row if value == sudoku_logic.EMPTY)
    assert new_empty_count == initial_empty_count - 1

    filled_cells = [
        (row, col, hinted_board[row][col])
        for row in range(sudoku_logic.SIZE)
        for col in range(sudoku_logic.SIZE)
        if initial_board[row][col] == sudoku_logic.EMPTY and hinted_board[row][col] != sudoku_logic.EMPTY
    ]
    assert len(filled_cells) == 1
    row, col, value = filled_cells[0]
    assert value == solution[row][col]


def test_sudoku_logic_functions_behave_correctly():
    empty_board = sudoku_logic.create_empty_board()
    assert len(empty_board) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in empty_board)
    assert empty_board[0][0] == sudoku_logic.EMPTY

    copied_board = sudoku_logic.deep_copy(empty_board)
    copied_board[0][0] = 5
    assert empty_board[0][0] == sudoku_logic.EMPTY

    assert sudoku_logic.is_safe(empty_board, 0, 0, 1)

    empty_board[0][0] = 1
    assert not sudoku_logic.is_safe(empty_board, 0, 0, 1)

    filled_board = sudoku_logic.create_empty_board()
    assert sudoku_logic.fill_board(filled_board)
    assert is_valid_sudoku_board(filled_board)

    puzzle, solution = sudoku_logic.generate_puzzle(35)
    assert is_valid_sudoku_board(puzzle)
    assert is_valid_sudoku_board(solution)
    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE


def test_generated_puzzle_has_unique_solution():
    puzzle, _ = sudoku_logic.generate_puzzle(35)
    assert sudoku_logic.has_unique_solution(puzzle)


def is_valid_sudoku_board(board):
    for row in board:
        values = [value for value in row if value != sudoku_logic.EMPTY]
        assert len(values) == len(set(values))

    for col in range(sudoku_logic.SIZE):
        values = [board[row][col] for row in range(sudoku_logic.SIZE) if board[row][col] != sudoku_logic.EMPTY]
        assert len(values) == len(set(values))

    for box_row in range(0, sudoku_logic.SIZE, 3):
        for box_col in range(0, sudoku_logic.SIZE, 3):
            values = []
            for row in range(box_row, box_row + 3):
                for col in range(box_col, box_col + 3):
                    value = board[row][col]
                    if value != sudoku_logic.EMPTY:
                        values.append(value)
            assert len(values) == len(set(values))

    return True
