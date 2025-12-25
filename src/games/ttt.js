/**
 * ttt - Tic-Tac-Toe with Machine Learning
 *
 * Original: Unix V4, /usr/games/ttt, 2192 bytes + ttt.k knowledge file
 * Port: JavaScript, 2025
 *
 * This is a faithful port of the Unix V4 learning tic-tac-toe.
 * The AI learns from experience using a MENACE-style algorithm.
 *
 * Historical note: Donald Michie built MENACE (Matchbox Educable Noughts
 * And Crosses Engine) in 1961 using matchboxes and colored beads.
 * This Unix implementation brought the concept to software in 1973.
 *
 * Knowledge file format (ttt.k):
 *   - 3 bytes per entry: 2-byte board state + 1-byte signed weight
 *   - Board encoded as base-3 (empty=0, X=1, O=2)
 *   - Weights adjusted: +3 win, +1 draw, -2 loss
 */

const EMPTY = 0;
const HUMAN = 1;  // X
const COMPUTER = 2;  // O

const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],  // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8],  // columns
  [0, 4, 8], [2, 4, 6]              // diagonals
];

export class TicTacToe {
  constructor(io, storage = null) {
    this.io = io;
    this.storage = storage;  // For persisting knowledge
    this.board = Array(9).fill(EMPTY);
    this.knowledge = new Map();  // board_hash -> weight
    this.moveHistory = [];
    this.knowledgeDirty = false;
  }

  /**
   * Encode board state as a number (base-3)
   * This matches the original Unix V4 encoding
   */
  encodeBoard() {
    let result = 0;
    for (let i = 0; i < 9; i++) {
      result = result * 3 + this.board[i];
    }
    return result;
  }

  /**
   * Check for winner
   * Returns: HUMAN, COMPUTER, or EMPTY
   */
  checkWinner() {
    for (const [a, b, c] of WINS) {
      if (this.board[a] !== EMPTY &&
          this.board[a] === this.board[b] &&
          this.board[b] === this.board[c]) {
        return this.board[a];
      }
    }
    return EMPTY;
  }

  /**
   * Check if board is full
   */
  isFull() {
    return this.board.every(c => c !== EMPTY);
  }

  /**
   * Look up weight for current board position
   */
  lookupWeight() {
    const code = this.encodeBoard();
    return this.knowledge.get(code) || 0;
  }

  /**
   * Find or create knowledge entry
   */
  updateWeight(code, delta) {
    const current = this.knowledge.get(code) || 0;
    const newWeight = Math.max(-128, Math.min(127, current + delta));
    this.knowledge.set(code, newWeight);
    this.knowledgeDirty = true;
  }

  /**
   * Computer's move - MENACE-style learning
   *
   * For each possible move, look up the resulting position's weight.
   * Choose the move with highest weight.
   */
  computeMove() {
    let bestMove = -1;
    let bestWeight = -1000;

    for (let i = 0; i < 9; i++) {
      if (this.board[i] === EMPTY) {
        // Try this move
        this.board[i] = COMPUTER;
        const weight = this.lookupWeight();
        this.board[i] = EMPTY;

        if (weight > bestWeight) {
          bestWeight = weight;
          bestMove = i;
        }
      }
    }

    // If no knowledge, use priority: center, corners, edges
    if (bestMove < 0 || bestWeight === 0) {
      const priority = [4, 0, 2, 6, 8, 1, 3, 5, 7];
      for (const pos of priority) {
        if (this.board[pos] === EMPTY) {
          return pos;
        }
      }
    }

    return bestMove;
  }

  /**
   * Update knowledge after game ends
   *
   * This is the learning step - adjust weights based on outcome.
   * Matches the original Unix V4 behavior.
   */
  updateKnowledge(outcome) {
    let delta;
    if (outcome === COMPUTER) {
      delta = 3;   // Win: reinforce
    } else if (outcome === EMPTY) {
      delta = 1;   // Draw: slight reinforcement
    } else {
      delta = -2;  // Loss: weaken
    }

    // Replay and update each position the computer was in
    const tempBoard = Array(9).fill(EMPTY);

    for (let i = 0; i < this.moveHistory.length; i++) {
      const move = this.moveHistory[i];
      tempBoard[move] = (i % 2 === 0) ? HUMAN : COMPUTER;

      // Update weight for computer's positions
      if (i % 2 === 1) {
        let code = 0;
        for (let j = 0; j < 9; j++) {
          code = code * 3 + tempBoard[j];
        }
        this.updateWeight(code, delta);
      }
    }
  }

  /**
   * Display the board
   */
  displayBoard() {
    const symbols = [' ', 'X', 'O'];
    const lines = [];

    for (let row = 0; row < 3; row++) {
      const cells = [];
      for (let col = 0; col < 3; col++) {
        cells.push(symbols[this.board[row * 3 + col]]);
      }
      lines.push(` ${cells.join(' | ')}`);
      if (row < 2) lines.push('-----------');
    }

    this.io.write(lines.join('\n') + '\n');
  }

  /**
   * Load knowledge from storage
   * Format: Each entry is "code:weight\n"
   */
  async loadKnowledge() {
    if (!this.storage) return 0;

    try {
      const data = await this.storage.read();
      if (!data) return 0;

      this.knowledge.clear();
      const lines = data.split('\n').filter(l => l.trim());

      for (const line of lines) {
        const [code, weight] = line.split(':').map(Number);
        if (!isNaN(code) && !isNaN(weight)) {
          this.knowledge.set(code, weight);
        }
      }

      return this.knowledge.size * 3;  // "bits" like original
    } catch {
      return 0;
    }
  }

  /**
   * Save knowledge to storage
   */
  async saveKnowledge() {
    if (!this.storage || !this.knowledgeDirty) return 0;

    const lines = [];
    for (const [code, weight] of this.knowledge) {
      lines.push(`${code}:${weight}`);
    }

    await this.storage.write(lines.join('\n'));
    this.knowledgeDirty = false;

    return this.knowledge.size * 3;  // "bits" like original
  }

  /**
   * Run the game
   */
  async run() {
    this.io.write('Tic-Tac-Toe\n');

    // Ask about accumulated knowledge
    this.io.write('Accumulated knowledge? ');
    const response = await this.io.read();

    if (response && response.trim().toLowerCase().startsWith('y')) {
      const bits = await this.loadKnowledge();
      this.io.write(`${bits} 'bits' of knowledge\n`);
    }

    // Main game loop
    while (true) {
      this.board = Array(9).fill(EMPTY);
      this.moveHistory = [];

      this.io.write('new game\n');

      // Position reference
      this.io.write('123\n456\n789\n\n');

      let gameOver = false;

      while (!gameOver) {
        this.displayBoard();

        // Human's turn (X)
        this.io.write('? ');
        const input = await this.io.read();

        if (input === null) return;  // EOF

        const move = parseInt(input.trim()) - 1;

        if (isNaN(move) || move < 0 || move > 8 || this.board[move] !== EMPTY) {
          this.io.write('Illegal move\n');
          continue;
        }

        this.board[move] = HUMAN;
        this.moveHistory.push(move);

        let winner = this.checkWinner();
        if (winner === HUMAN) {
          this.displayBoard();
          this.io.write('You win\n');
          this.updateKnowledge(HUMAN);
          gameOver = true;
          continue;
        }

        if (this.isFull()) {
          this.displayBoard();
          this.io.write('Draw\n');
          this.updateKnowledge(EMPTY);
          gameOver = true;
          continue;
        }

        // Computer's turn (O)
        const compMove = this.computeMove();
        if (compMove < 0) {
          this.io.write('I concede\n');
          this.updateKnowledge(HUMAN);
          gameOver = true;
          continue;
        }

        this.board[compMove] = COMPUTER;
        this.moveHistory.push(compMove);

        winner = this.checkWinner();
        if (winner === COMPUTER) {
          this.displayBoard();
          this.io.write('I win\n');
          this.updateKnowledge(COMPUTER);
          gameOver = true;
          continue;
        }
      }

      // Save knowledge
      const bits = await this.saveKnowledge();
      if (bits > 0) {
        this.io.write(`${bits} 'bits' returned\n`);
      }
    }
  }
}

// CLI interface
export async function main(io, storage = null) {
  const game = new TicTacToe(io, storage);
  await game.run();
}
