/**
 * wump - Hunt the Wumpus
 *
 * Original: Unix V4, /usr/games/wump, 5386 bytes
 * Port: JavaScript, 2025
 *
 * Created by Gregory Yob in 1973. This game invented the
 * survival-horror genre before that was a phrase.
 *
 * The cave is a dodecahedron (20 rooms, 3 tunnels each).
 * Navigate by sensory clues, hunt the Wumpus with arrows.
 *
 * Historical note: Wump directly influenced Adventure (1976)
 * and the entire text adventure genre.
 */

// Default dodecahedral cave layout
// Each room connects to exactly 3 others
const CAVE_MAP = [
  [2, 5, 8],     // Room 1
  [1, 3, 10],    // Room 2
  [2, 4, 12],    // Room 3
  [3, 5, 14],    // Room 4
  [1, 4, 6],     // Room 5
  [5, 7, 15],    // Room 6
  [6, 8, 17],    // Room 7
  [1, 7, 9],     // Room 8
  [8, 10, 18],   // Room 9
  [2, 9, 11],    // Room 10
  [10, 12, 19],  // Room 11
  [3, 11, 13],   // Room 12
  [12, 14, 20],  // Room 13
  [4, 13, 15],   // Room 14
  [6, 14, 16],   // Room 15
  [15, 17, 20],  // Room 16
  [7, 16, 18],   // Room 17
  [9, 17, 19],   // Room 18
  [11, 18, 20],  // Room 19
  [13, 16, 19],  // Room 20
];

export class WumpGame {
  constructor(io) {
    this.io = io;
    this.numRooms = 20;
    this.numTunnels = 3;
    this.cave = CAVE_MAP;
    this.player = 0;
    this.wumpus = 0;
    this.pits = [];
    this.bats = [];
    this.arrows = 5;
  }

  /**
   * Pick a random room (1-based)
   */
  randomRoom() {
    return Math.floor(Math.random() * this.numRooms) + 1;
  }

  /**
   * Get adjacent rooms (1-based indexing)
   */
  adjacent(room) {
    return this.cave[room - 1];
  }

  /**
   * Check if two rooms are adjacent
   */
  isAdjacent(room1, room2) {
    return this.adjacent(room1).includes(room2);
  }

  /**
   * Initialize a new game
   */
  setup() {
    // Place player
    this.player = this.randomRoom();

    // Place wumpus (not in player's room)
    do {
      this.wumpus = this.randomRoom();
    } while (this.wumpus === this.player);

    // Place 2 pits
    this.pits = [];
    while (this.pits.length < 2) {
      const pit = this.randomRoom();
      if (pit !== this.player && pit !== this.wumpus && !this.pits.includes(pit)) {
        this.pits.push(pit);
      }
    }

    // Place 2 bat colonies
    this.bats = [];
    while (this.bats.length < 2) {
      const bat = this.randomRoom();
      if (bat !== this.player && bat !== this.wumpus &&
          !this.pits.includes(bat) && !this.bats.includes(bat)) {
        this.bats.push(bat);
      }
    }

    this.arrows = 5;
  }

  /**
   * Move the wumpus (when awakened)
   */
  moveWumpus() {
    if (Math.random() < 0.75) {
      const adj = this.adjacent(this.wumpus);
      this.wumpus = adj[Math.floor(Math.random() * adj.length)];
    }
  }

  /**
   * Check for hazards and print warnings
   */
  printWarnings() {
    const adj = this.adjacent(this.player);

    // Check for wumpus nearby (within 2 rooms)
    if (adj.includes(this.wumpus)) {
      this.io.write('I smell a wumpus\n');
    } else {
      for (const room of adj) {
        if (this.adjacent(room).includes(this.wumpus)) {
          this.io.write('I smell a wumpus\n');
          break;
        }
      }
    }

    // Check for bats
    for (const bat of this.bats) {
      if (adj.includes(bat)) {
        this.io.write('Bats nearby\n');
        break;
      }
    }

    // Check for pits
    for (const pit of this.pits) {
      if (adj.includes(pit)) {
        this.io.write('I feel a draft\n');
        break;
      }
    }
  }

  /**
   * Print current location
   */
  printLocation() {
    this.io.write(`\nYou are in room ${this.player}\n`);
    this.printWarnings();
    const tunnels = this.adjacent(this.player).join(' ');
    this.io.write(`There are tunnels to ${tunnels}\n`);
  }

  /**
   * Handle player entering a room
   * Returns: 'continue', 'win', 'lose'
   */
  enterRoom() {
    // Check for pit
    if (this.pits.includes(this.player)) {
      this.io.write('You fell into a pit\n');
      return 'lose';
    }

    // Check for wumpus
    if (this.player === this.wumpus) {
      this.io.write('You were eaten by the wumpus\n');
      return 'lose';
    }

    // Check for bats
    if (this.bats.includes(this.player)) {
      this.io.write("There's a bat in your room\n");
      // Bat carries you to random room
      this.player = this.randomRoom();
      return this.enterRoom(); // Check new room
    }

    return 'continue';
  }

  /**
   * Move to a room
   */
  move(room) {
    if (!this.isAdjacent(this.player, room)) {
      this.io.write('You hit the wall\n');
      return 'continue';
    }

    this.player = room;
    return this.enterRoom();
  }

  /**
   * Shoot an arrow through a path of rooms
   */
  shoot(path) {
    this.arrows--;

    let current = this.player;

    for (const target of path) {
      // If path is valid, arrow goes there
      if (this.isAdjacent(current, target)) {
        current = target;
      } else {
        // Arrow goes random direction
        const adj = this.adjacent(current);
        current = adj[Math.floor(Math.random() * adj.length)];
      }

      // Check if arrow hit wumpus
      if (current === this.wumpus) {
        this.io.write('You slew the wumpus\n');
        return 'win';
      }

      // Check if arrow hit player
      if (current === this.player) {
        this.io.write('You shot yourself\n');
        return 'lose';
      }
    }

    // Arrow missed - wumpus wakes up
    this.moveWumpus();

    // Check if wumpus moved into player's room
    if (this.wumpus === this.player) {
      this.io.write('The wumpus got you\n');
      return 'lose';
    }

    if (this.arrows === 0) {
      this.io.write('That was your last shot\n');
      return 'lose';
    }

    return 'continue';
  }

  /**
   * Print instructions
   */
  printInstructions() {
    this.io.write(`Welcome to 'Hunt the Wumpus.'
The Wumpus lives in a cave of ${this.numRooms} rooms.
Each room has ${this.numTunnels} tunnels leading to other rooms.

Hazards:
Bottomless Pits - Some rooms have Bottomless Pits in them.
    If you go there, you fall into the pit and lose!
Super Bats - Some other rooms have super bats.
    If you go there, a bat will grab you and take you to
    somewhere else in the cave where you could
    fall into a pit or run into the...

Wumpus:
The Wumpus is not bothered by the hazards since
he has sucker feet and is too big for a bat to lift.
Usually he is asleep.
Two things wake him up:
    your entering his room
    your shooting an arrow anywhere in the cave.
If the wumpus wakes, he either decides to move one room or
stay where he was. But if he ends up where you are,
he eats you up and you lose!

You:
Each turn you may either move or shoot a crooked arrow.
Moving - You can move to one of the adjoining rooms.
Shooting - You have 5 arrows. You lose when you run out.
    Each arrow can go from 1 to 5 rooms.
    You aim by telling the computer the arrow's path.
    The list is terminated with a 0.

Warnings:
When you are one or two rooms away from the wumpus:
        'I smell a Wumpus'
When you are one room away from some other hazard:
        Bat - 'Bats nearby'
        Pit - 'I feel a draft'

`);
  }

  /**
   * Run the game
   */
  async run() {
    this.io.write("Welcome to 'Hunt the Wumpus.'\n");
    this.io.write(`The Wumpus lives in a cave of ${this.numRooms} rooms.\n`);
    this.io.write(`Each room has ${this.numTunnels} tunnels leading to other rooms.\n`);

    this.io.write('Instructions? (y-n) ');
    const wantInstr = await this.io.read();
    if (wantInstr && wantInstr.trim().toLowerCase().startsWith('y')) {
      this.printInstructions();
    }

    let playAgain = true;

    while (playAgain) {
      this.setup();
      let result = 'continue';

      while (result === 'continue') {
        this.printLocation();

        this.io.write('\nMove or shoot (m-s) ');
        const action = await this.io.read();

        if (!action) return;  // EOF

        const cmd = action.trim().toLowerCase();

        if (cmd.startsWith('m')) {
          this.io.write('which room? ');
          const roomStr = await this.io.read();
          if (!roomStr) return;

          const room = parseInt(roomStr.trim());
          if (isNaN(room) || room < 1 || room > this.numRooms) {
            this.io.write('Invalid room\n');
            continue;
          }

          result = this.move(room);

        } else if (cmd.startsWith('s')) {
          this.io.write('Give list of rooms terminated by 0\n');

          const path = [];
          while (path.length < 5) {
            const roomStr = await this.io.read();
            if (!roomStr) return;

            const room = parseInt(roomStr.trim());
            if (room === 0) break;
            if (room < 1 || room > this.numRooms) continue;
            path.push(room);
          }

          if (path.length === 0) {
            this.io.write('You need to aim somewhere!\n');
            continue;
          }

          result = this.shoot(path);
        }
      }

      this.io.write('Another game? (y-n) ');
      const again = await this.io.read();
      playAgain = again && again.trim().toLowerCase().startsWith('y');

      if (playAgain) {
        this.io.write('Same room setup? (y-n) ');
        const same = await this.io.read();
        if (!same || !same.trim().toLowerCase().startsWith('y')) {
          // Keep same setup by not calling setup() again
        }
      }
    }
  }
}

// CLI interface
export async function main(io) {
  const game = new WumpGame(io);
  await game.run();
}
