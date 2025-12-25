# unix-v4-web

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Platform](https://img.shields.io/badge/Platform-Browser%20%7C%20Node.js-blue.svg)](https://github.com/aygp-dr/unix-v4-web)

A faithful simulation of Unix V4 (1973) for the browser and Node.js. Experience computing history from Bell Labs as it was meant to be.

## Features

- **Authentic Shell** - Experience the original Unix shell interface
- **Filesystem Simulation** - Navigate a simulated Unix V4 filesystem
- **Classic Games** - Play original Unix games:
  - `wump` - Hunt the Wumpus
  - `ttt` - Tic-Tac-Toe
  - `moo` - Bulls and Cows (Mastermind precursor)
- **Cross-Platform** - Runs in modern browsers and Node.js

## Installation

```bash
npm install unix-v4-web
```

## Usage

### Command Line

```bash
npx unix-v4
```

Or if installed globally:

```bash
unix-v4
```

### Browser

```html
<script type="module">
  import { UnixV4 } from 'unix-v4-web';

  const unix = new UnixV4();
  unix.boot();
</script>
```

### Node.js

```javascript
import { UnixV4 } from 'unix-v4-web';

const unix = new UnixV4();
unix.boot();
```

## Development

```bash
# Clone the repository
git clone https://github.com/aygp-dr/unix-v4-web.git
cd unix-v4-web

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for browser
npm run build

# Run tests
npm test
```

## Historical Context

Unix V4 was released in November 1973 at Bell Labs. It was the first version written in C (rewritten from the original PDP-7 assembly), making Unix portable across different hardware platforms. This milestone laid the foundation for modern operating systems.

Key figures:
- **Ken Thompson** - Co-creator of Unix
- **Dennis Ritchie** - Co-creator of Unix and C programming language

## Project Structure

```
unix-v4-web/
├── src/
│   ├── kernel/      # Kernel simulation
│   ├── shell/       # Shell interpreter
│   ├── fs/          # Filesystem implementation
│   └── games/       # Classic Unix games
├── public/          # Static assets
├── docs/            # Documentation
└── dist/            # Browser bundle
```

## License

MIT License - See [LICENSE](LICENSE) for details.

## References

- [Unix Heritage Society](https://www.tuhs.org/)
- [The Unix Tree - Unix V4](https://minnie.tuhs.org/cgi-bin/utree.pl?file=V4)
- [Dennis Ritchie's Home Page](https://www.bell-labs.com/usr/dmr/www/)
