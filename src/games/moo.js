/**
 * moo - Bulls and Cows (Mastermind predecessor)
 *
 * Original: Unix V4, /usr/games/moo, 624 bytes
 * Port: JavaScript, 2025
 *
 * The computer picks a 4-digit number (all digits different).
 * You guess until you crack it.
 *
 * Bulls = right digit, right place
 * Cows = right digit, wrong place
 *
 * Historical note: This game predates the Mastermind board game (1970).
 * Bell Labs programmers played it on paper in the 1960s.
 */

export class MooGame {
  constructor(io) {
    this.io = io;  // { write, read } interface
    this.secret = '';
    this.guesses = 0;
  }

  /**
   * Generate a 4-digit number with all different digits
   */
  generateSecret() {
    const digits = '0123456789'.split('');
    // Fisher-Yates shuffle
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    return digits.slice(0, 4).join('');
  }

  /**
   * Score a guess against the secret
   * Returns { bulls, cows }
   */
  score(guess) {
    let bulls = 0;
    let cows = 0;

    for (let i = 0; i < 4; i++) {
      if (guess[i] === this.secret[i]) {
        bulls++;
      } else if (this.secret.includes(guess[i])) {
        cows++;
      }
    }

    return { bulls, cows };
  }

  /**
   * Validate a guess
   */
  isValidGuess(guess) {
    if (!/^\d{4}$/.test(guess)) return false;

    // All digits must be different
    const digits = new Set(guess);
    return digits.size === 4;
  }

  /**
   * Run the game
   */
  async run() {
    this.io.write('MOO\n');

    while (true) {
      this.secret = this.generateSecret();
      this.guesses = 0;
      this.io.write('new game\n');

      while (true) {
        this.io.write('? ');
        const input = await this.io.read();

        if (input === null || input === undefined) {
          return; // EOF
        }

        const guess = input.trim();

        if (!this.isValidGuess(guess)) {
          this.io.write('bad guess\n');
          continue;
        }

        this.guesses++;
        const { bulls, cows } = this.score(guess);

        if (bulls === 4) {
          this.io.write(`4 bulls\n ${this.guesses} guesses\n`);
          break; // New game
        }

        this.io.write(`${bulls} bulls; ${cows} cows\n`);
      }
    }
  }
}

// CLI interface for Node.js
export async function main(io) {
  const game = new MooGame(io);
  await game.run();
}
