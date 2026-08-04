"""Flask routes for the Sudoku application."""

from flask import Blueprint, jsonify, render_template, request

from game_service import apply_hint, check_board, is_board_solved, start_new_game

bp = Blueprint("main", __name__)


def get_clues_for_difficulty(difficulty: str | None) -> int:
    """Map a difficulty label to a clue count for puzzle generation."""
    if difficulty is None:
        return 35

    normalized = difficulty.strip().lower()
    difficulty_map = {
        "easy": 45,
        "medium": 35,
        "hard": 25,
    }
    return difficulty_map.get(normalized, 35)


@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/new")
def new_game():
    clues_param = request.args.get("clues")
    difficulty = request.args.get("difficulty")

    if clues_param is not None:
        try:
            clues = int(clues_param)
        except ValueError:
            clues = get_clues_for_difficulty(difficulty)
    else:
        clues = get_clues_for_difficulty(difficulty)

    puzzle, _ = start_new_game(clues)
    return jsonify({"puzzle": puzzle})


@bp.route("/hint")
def give_hint():
    try:
        puzzle = apply_hint()
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"puzzle": puzzle})


@bp.route("/check", methods=["POST"])
def check_solution():
    data = request.get_json(silent=True) or {}
    board = data.get("board")
    if board is None:
        return jsonify({"error": "No board provided"}), 400

    try:
        incorrect = check_board(board)
        solved = is_board_solved(board)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"incorrect": incorrect, "solved": solved})
