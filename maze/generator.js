export function generateClassicMaze(maze) {
  // 1. Fill entire maze with water (walls)
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      maze.setTerrain(x, y, 'water');
    }
  }

  // 2. Setup DFS backtracker variables
  const stack = [];
  const startX = 1;
  const startY = 1;
  const startCell = maze.getCell(startX, startY);
  startCell.terrain = 'road';
  startCell.weight = 1;
  stack.push(startCell);

  const visited = new Set();
  visited.add(`${startX},${startY}`);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = [];

    // Check cells 2 steps away
    const dirs = [
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 }
    ];

    for (const dir of dirs) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      // Keep inside bounds (with a outer wall border of size 1)
      if (nx > 0 && nx < maze.width - 1 && ny > 0 && ny < maze.height - 1) {
        if (!visited.has(`${nx},${ny}`)) {
          neighbors.push({
            x: nx,
            y: ny,
            betweenX: current.x + dir.dx / 2,
            betweenY: current.y + dir.dy / 2
          });
        }
      }
    }

    if (neighbors.length > 0) {
      // Pick random unvisited neighbor
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      // Carve paths
      const betweenCell = maze.getCell(next.betweenX, next.betweenY);
      betweenCell.terrain = 'road';
      betweenCell.weight = 1;

      const nextCell = maze.getCell(next.x, next.y);
      nextCell.terrain = 'road';
      nextCell.weight = 1;

      visited.add(`${next.x},${next.y}`);
      stack.push(nextCell);
    } else {
      stack.pop();
    }
  }

  // 3. Guarantee start and goal are open roads and connected
  maze.start.terrain = 'road';
  maze.start.weight = 1;
  maze.goal.terrain = 'road';
  maze.goal.weight = 1;

  // Connect start to at least one valid neighbor
  const startNeighbors = maze.getNeighbors(maze.start, true);
  if (startNeighbors.length > 0) {
    startNeighbors[0].terrain = 'road';
    startNeighbors[0].weight = 1;
  }

  // Connect goal to at least one neighbor
  const goalNeighbors = maze.getNeighbors(maze.goal, true);
  if (goalNeighbors.length > 0) {
    goalNeighbors[0].terrain = 'road';
    goalNeighbors[0].weight = 1;
  }
}

export function generateWeightedTerrain(maze) {
  // Clear the grid to all roads
  maze.clearGrid();

  const numGrassClusters = Math.floor((maze.width * maze.height) / 80);
  const numMudClusters = Math.floor((maze.width * maze.height) / 120);
  const numWaterClusters = Math.floor((maze.width * maze.height) / 150);

  // Generate cluster patches
  const createClusters = (count, terrain, maxRadius) => {
    for (let i = 0; i < count; i++) {
      const cx = Math.floor(Math.random() * (maze.width - 2)) + 1;
      const cy = Math.floor(Math.random() * (maze.height - 2)) + 1;
      const radius = Math.floor(Math.random() * maxRadius) + 1;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          // Euclidean distance check for roundish clusters
          if (dx * dx + dy * dy <= radius * radius) {
            maze.setTerrain(nx, ny, terrain);
          }
        }
      }
    }
  };

  // Order of drawing layers: Grass first, Mud next (overwriting grass), Water last
  createClusters(numGrassClusters, 'grass', 4);
  createClusters(numMudClusters, 'mud', 3);
  createClusters(numWaterClusters, 'water', 2);

  // Scattered random obstacles/roads to break uniformity
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (maze.getCell(x, y) === maze.start || maze.getCell(x, y) === maze.goal) continue;
      
      const rand = Math.random();
      if (rand < 0.05) {
        // Place individual water obstacle
        maze.setTerrain(x, y, 'water');
      } else if (rand < 0.10) {
        // Place mud spot
        maze.setTerrain(x, y, 'mud');
      }
    }
  }

  // Double-check start/goal are clear roads
  maze.start.terrain = 'road';
  maze.start.weight = 1;
  maze.goal.terrain = 'road';
  maze.goal.weight = 1;
}

export function generateRandomWalls(maze) {
  maze.clearGrid();
  
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (maze.getCell(x, y) === maze.start || maze.getCell(x, y) === maze.goal) continue;

      if (Math.random() < 0.3) {
        maze.setTerrain(x, y, 'water');
      }
    }
  }

  // Ensure start and goal are open
  maze.start.terrain = 'road';
  maze.start.weight = 1;
  maze.goal.terrain = 'road';
  maze.goal.weight = 1;
}
