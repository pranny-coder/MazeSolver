export class Maze {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.start = null;
    this.goal = null;
    this.initGrid();
  }

  initGrid() {
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push({
          x,
          y,
          terrain: 'road',
          weight: 1,
          // Search state properties
          visited: false,
          frontier: false,
          parent: null,
          g: Infinity,
          h: Infinity,
          f: Infinity
        });
      }
      this.grid.push(row);
    }

    // Default start and goal
    this.start = this.grid[1][1];
    this.goal = this.grid[this.height - 2][this.width - 2];
    
    // Ensure start/goal are roads
    this.start.terrain = 'road';
    this.start.weight = 1;
    this.goal.terrain = 'road';
    this.goal.weight = 1;
  }

  getCell(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.grid[y][x];
    }
    return null;
  }

  setTerrain(x, y, terrain) {
    const cell = this.getCell(x, y);
    if (!cell) return;

    // Start and Goal cannot be changed to walls/other terrains
    if (cell === this.start || cell === this.goal) return;

    cell.terrain = terrain;
    switch (terrain) {
      case 'road':
        cell.weight = 1;
        break;
      case 'grass':
        cell.weight = 2;
        break;
      case 'mud':
        cell.weight = 5;
        break;
      case 'water':
      default:
        cell.weight = Infinity; // Blocked
        break;
    }
  }

  getNeighbors(cell, includeBlocked = false) {
    const neighbors = [];
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 },  // Right
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }  // Left
    ];

    for (const dir of directions) {
      const nx = cell.x + dir.dx;
      const ny = cell.y + dir.dy;
      const neighbor = this.getCell(nx, ny);
      
      if (neighbor) {
        if (includeBlocked || neighbor.weight < Infinity) {
          neighbors.push(neighbor);
        }
      }
    }
    return neighbors;
  }

  resetSearch() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        cell.visited = false;
        cell.frontier = false;
        cell.parent = null;
        cell.g = Infinity;
        cell.h = Infinity;
        cell.f = Infinity;
      }
    }
  }

  clearGrid() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        cell.terrain = 'road';
        cell.weight = 1;
        cell.visited = false;
        cell.frontier = false;
        cell.parent = null;
        cell.g = Infinity;
        cell.h = Infinity;
        cell.f = Infinity;
      }
    }
  }
}
