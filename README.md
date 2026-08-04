# Sudoku Game with GitHub Copilot

## Project Overview

This project refactors a legacy Flask-based Sudoku game into a modern, responsive web application using **GitHub Copilot** as an AI-assisted development tool.

The application includes multiple gameplay enhancements such as difficulty selection, timer, live validation, hint functionality, leaderboard persistence, dark mode, and responsive design while maintaining clean, modular code.

---

# Features

## Core Sudoku Features

- Sudoku puzzle generation with exactly one unique solution
- Difficulty levels:
  - Easy
  - Medium
  - Hard
- Locked pre-filled cells
- Real-time invalid move validation
- Puzzle completion detection
- Congratulations message when puzzle is solved

---

## Interactive Features

- Timer
- Hint button
- Check Puzzle button
- Check Solution button
- Player name input
- Top 10 Leaderboard
- Local Storage persistence
- Dark Mode
- Responsive layout

---

# Technologies Used

- Python
- Flask
- HTML5
- CSS3
- JavaScript
- Pytest
- Git
- GitHub
- GitHub Copilot

---

# Project Structure

```
starter/
│
├── static/
│   ├── styles.css
│   ├── main.js
│
├── templates/
│   └── index.html
│
├── app.py
├── sudoku_logic.py
├── routes.py
├── game_service.py
├── requirements.txt
├── instruction.md
│
├── tests/
│   ├── __init__.py
│   └── test_app.py
│
└── Screenshots/
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/github-copilot-python.git
```

Navigate to the project

```bash
cd github-copilot-python/starter
```

Create a virtual environment

Windows

```bash
python -m venv .venv
```

Activate

```bash
.venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

# Running the Application

```bash
python app.py
```

Open

```
http://127.0.0.1:5000
```

---

# Running Tests

Run the test suite

```bash
python -m pytest -q
```

Example output

```
6 passed in 0.xx seconds
```

---

# GitHub Copilot Usage

GitHub Copilot was used throughout the project as an AI development assistant.

Rather than accepting every generated response, each suggestion was reviewed, tested, and modified whenever necessary to ensure correctness and maintainability.

Copilot assisted with:

- Setting up the pytest testing framework
- Refactoring the legacy Flask application
- Difficulty selector implementation
- Sudoku unique solution validation
- Real-time input validation
- Completion detection
- Timer implementation
- Hint functionality
- Check Puzzle functionality
- Leaderboard implementation using Local Storage
- Dark Mode
- Responsive interface improvements

---

# Responsible and Effective Copilot Usage

GitHub Copilot was used responsibly throughout the project.

The development workflow included:

- Reviewing every generated suggestion before accepting it.
- Rejecting or modifying suggestions that did not satisfy project requirements.
- Running the pytest suite after each major feature implementation.
- Using Copilot explanations to understand unfamiliar code before integrating it.
- Preserving existing functionality while introducing new features.

An example of evaluating or modifying a Copilot suggestion is included in:

```
Screenshots/copilot_rejected_suggestion.png
```

---

# Copilot Milestones

The following screenshots demonstrate the use of GitHub Copilot during development.

| Milestone | Screenshot |
|-----------|------------|
| Testing Framework | copilot_testing_framework.png |
| Refactoring Legacy Code | copilot_refactor.png |
| Difficulty Selector | copilot_difficulty.png |
| Unique Solution Validation | copilot_unique_solution.png |
| Real-Time Validation | copilot_realtime_validation.png |
| Completion Detection | copilot_completion.png |
| Top 10 Leaderboard | copilot_top10.png |
| Grid Styling | copilot_grid_style.png |

---

# Screenshot Naming Convention

All screenshots are stored inside the **Screenshots** folder.

Example filenames:

```
initial_tests.png
copilot_testing_framework.png
copilot_refactor.png
copilot_difficulty.png
copilot_unique_solution.png
copilot_realtime_validation.png
copilot_completion.png
copilot_top10.png
copilot_grid_style.png
copilot_rejected_suggestion.png
```

---

# Testing

The application was verified using **Pytest**.

Tests include:

- Flask application loading
- HTTP 200 response
- Sudoku board generation
- Sudoku helper functions
- Difficulty generation
- Completion detection
- Regression testing

---

# References

The following GitHub documentation was used to follow recommended GitHub Copilot practices.

### GitHub Copilot Responsible Use

https://docs.github.com/en/copilot/responsible-use-of-github-copilot

### GitHub Copilot Best Practices

https://docs.github.com/en/copilot/using-github-copilot/best-practices-for-using-github-copilot

### GitHub Copilot Documentation

https://docs.github.com/en/copilot/using-github-copilot-in-your-ide

---

# Future Improvements

- Sudoku Notes Mode
- WCAG 2.1 Accessibility Improvements
- Sudoku Solver Animation
- Number Usage Tracker

---

# Author

Sonu Kumar

---

# License

This project was completed for educational purposes as part of the Udacity GitHub Copilot Python project.