export function bfs(maze, start, goal) {
  const startTime = performance.now();
  maze.resetSearch();

  const visitedOrder = [];
  const queue = [start];
  const visited = new Set();
  const parentMap = new Map();

  visited.add(start);
  let found = false;

  while (queue.length > 0) {
    const current = queue.shift();
    visitedOrder.push(current);

    if (current === goal) {
      found = true;
      break;
    }

    const neighbors = maze.getNeighbors(current);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  let path = null;
  let pathCost = 0;
  if (found) {
    path = [];
    let curr = goal;
    while (curr) {
      path.push(curr);
      curr = parentMap.get(curr);
    }
    path.reverse();
    pathCost = path.slice(1).reduce((sum, cell) => sum + cell.weight, 0);
  }

  return {
    visitedOrder,
    path,
    executionTime,
    nodesExpanded: visitedOrder.length,
    pathCost
  };
}
