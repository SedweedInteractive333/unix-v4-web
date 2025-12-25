/**
 * Unix V4 Filesystem Simulation
 *
 * Implements the core filesystem concepts from the 1973 Unix Fourth Edition.
 * Based on the original inode structure from usr/sys/ken/iget.c
 *
 * Historical note: Unix V4 used 16-bit inodes with a maximum of 65535 files.
 * The filesystem was 512-byte blocks, with a maximum file size of ~1MB.
 */

// Inode flags from param.h
const IALLOC = 0o100000;  // Inode is allocated
const IFMT   = 0o60000;   // Type mask
const IFDIR  = 0o40000;   // Directory
const IFCHR  = 0o20000;   // Character device
const IFBLK  = 0o60000;   // Block device
const ILARG  = 0o10000;   // Large file flag
const ISUID  = 0o4000;    // Set UID on execution
const ISGID  = 0o2000;    // Set GID on execution
const IREAD  = 0o400;     // Read permission
const IWRITE = 0o200;     // Write permission
const IEXEC  = 0o100;     // Execute permission

/**
 * Inode structure - the heart of Unix filesystem
 *
 * From Unix V4 inode.h:
 *   struct inode {
 *       char i_flag;
 *       char i_count;
 *       int  i_dev;
 *       int  i_number;
 *       int  i_mode;
 *       char i_nlink;
 *       char i_uid;
 *       char i_gid;
 *       char i_size0;
 *       char *i_size1;
 *       int  i_addr[8];
 *       int  i_lastr;
 *   };
 */
export class Inode {
  constructor(inum, mode = 0) {
    this.i_number = inum;      // Inode number
    this.i_mode = mode;        // File type and permissions
    this.i_nlink = 1;          // Number of links
    this.i_uid = 0;            // Owner UID
    this.i_gid = 0;            // Owner GID
    this.i_size = 0;           // File size in bytes
    this.i_atime = Date.now(); // Access time
    this.i_mtime = Date.now(); // Modification time
    this.i_data = null;        // File data (for regular files)
    this.i_entries = null;     // Directory entries (for directories)
  }

  isDirectory() {
    return (this.i_mode & IFMT) === IFDIR;
  }

  isRegular() {
    return (this.i_mode & IFMT) === 0;
  }

  isCharDevice() {
    return (this.i_mode & IFMT) === IFCHR;
  }

  isExecutable() {
    return (this.i_mode & IEXEC) !== 0;
  }

  getPermissionString() {
    const type = this.isDirectory() ? 'd' : this.isCharDevice() ? 'c' : '-';
    const r = (this.i_mode & IREAD) ? 'r' : '-';
    const w = (this.i_mode & IWRITE) ? 'w' : '-';
    const x = (this.i_mode & IEXEC) ? 'x' : '-';
    // Simplified: same permissions for owner/group/other
    return `${type}${r}${w}${x}${r}${w}${x}${r}${w}${x}`;
  }
}

/**
 * Directory entry structure
 *
 * From Unix V4: 16 bytes per entry
 *   - 2 bytes: inode number
 *   - 14 bytes: filename (null-padded)
 */
export class DirectoryEntry {
  constructor(inum, name) {
    this.inum = inum;
    this.name = name.substring(0, 14); // Max 14 characters in Unix V4
  }
}

/**
 * Unix V4 Filesystem
 *
 * Simulates the original filesystem with:
 * - Inode-based file storage
 * - Hierarchical directories
 * - Device files (/dev/tty, /dev/null)
 * - The original /usr/games directory
 */
export class UnixFilesystem {
  constructor() {
    this.inodes = new Map();
    this.nextInum = 1;
    this.rootInum = 1;

    this._initializeFilesystem();
  }

  _initializeFilesystem() {
    // Create root directory (inode 1, like real Unix)
    const root = this._allocInode(IFDIR | 0o755);
    root.i_entries = [
      new DirectoryEntry(root.i_number, '.'),
      new DirectoryEntry(root.i_number, '..'),
    ];

    // Build the Unix V4 directory structure
    this._mkdir(root, 'bin');
    this._mkdir(root, 'dev');
    this._mkdir(root, 'etc');
    this._mkdir(root, 'usr');
    this._mkdir(root, 'tmp');

    // /usr subdirectories
    const usr = this._lookup(root, 'usr');
    this._mkdir(usr, 'games');
    this._mkdir(usr, 'lib');
    this._mkdir(usr, 'bin');
    this._mkdir(usr, 'sys');

    // Create device files
    const dev = this._lookup(root, 'dev');
    this._mkdev(dev, 'tty', IFCHR | 0o666);
    this._mkdev(dev, 'null', IFCHR | 0o666);
    this._mkdev(dev, 'mem', IFCHR | 0o640);

    // Create /etc files
    const etc = this._lookup(root, 'etc');
    this._mkfile(etc, 'passwd',
      'root::0:0::/:\n' +
      'daemon::1:1::/:\n' +
      'bin::2:2::/bin:\n'
    );
    this._mkfile(etc, 'motd',
      'Unix Fourth Edition\n' +
      'Bell Telephone Laboratories\n' +
      '1973\n'
    );

    // /usr/games - the important part!
    const games = this._lookup(usr, 'games');

    // Mark game files as executable
    this._mkfile(games, 'moo', '[binary: 624 bytes]', 0o755);
    this._mkfile(games, 'bj', '[binary: 1562 bytes]', 0o755);
    this._mkfile(games, 'ttt', '[binary: 2192 bytes]', 0o755);
    this._mkfile(games, 'ttt.k', '', 0o644); // Knowledge file
    this._mkfile(games, 'cubic', '[binary: 2468 bytes]', 0o755);
    this._mkfile(games, 'wump', '[binary: 5386 bytes]', 0o755);
    this._mkfile(games, 'chess', '[binary: 14310 bytes]', 0o755);
  }

  _allocInode(mode) {
    const inum = this.nextInum++;
    const inode = new Inode(inum, mode | IALLOC);
    this.inodes.set(inum, inode);
    return inode;
  }

  _mkdir(parent, name) {
    const dir = this._allocInode(IFDIR | 0o755);
    dir.i_entries = [
      new DirectoryEntry(dir.i_number, '.'),
      new DirectoryEntry(parent.i_number, '..'),
    ];
    parent.i_entries.push(new DirectoryEntry(dir.i_number, name));
    return dir;
  }

  _mkdev(parent, name, mode) {
    const dev = this._allocInode(mode);
    parent.i_entries.push(new DirectoryEntry(dev.i_number, name));
    return dev;
  }

  _mkfile(parent, name, content, mode = 0o644) {
    const file = this._allocInode(mode);
    file.i_data = content;
    file.i_size = content.length;
    parent.i_entries.push(new DirectoryEntry(file.i_number, name));
    return file;
  }

  _lookup(dir, name) {
    if (!dir.isDirectory()) return null;
    for (const entry of dir.i_entries) {
      if (entry.name === name) {
        return this.inodes.get(entry.inum);
      }
    }
    return null;
  }

  /**
   * Resolve a path to an inode
   * Implements the namei() function from ken/nami.c
   */
  namei(path) {
    if (!path || path === '') return null;

    // Start from root or current directory
    let current = this.inodes.get(this.rootInum);

    if (path === '/') return current;

    const parts = path.split('/').filter(p => p !== '');

    for (const part of parts) {
      if (!current.isDirectory()) return null;
      current = this._lookup(current, part);
      if (!current) return null;
    }

    return current;
  }

  /**
   * Read directory contents
   * Returns array of {name, inode} objects
   */
  readdir(path) {
    const inode = this.namei(path);
    if (!inode || !inode.isDirectory()) return null;

    return inode.i_entries.map(entry => ({
      name: entry.name,
      inode: this.inodes.get(entry.inum)
    }));
  }

  /**
   * Read file contents
   */
  read(path) {
    const inode = this.namei(path);
    if (!inode || inode.isDirectory()) return null;
    return inode.i_data;
  }

  /**
   * Write file contents
   */
  write(path, content) {
    const inode = this.namei(path);
    if (!inode || inode.isDirectory()) return false;
    inode.i_data = content;
    inode.i_size = content.length;
    inode.i_mtime = Date.now();
    return true;
  }

  /**
   * Stat a file (return inode info)
   */
  stat(path) {
    return this.namei(path);
  }
}
