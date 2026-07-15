export function dfs(maze, start, goal) {
  const startTime = performance.now();
  maze.resetSearch();

  const visitedOrder = [];
  const stack = [start];
  const visited = new Set();
  const parentMap = new Map();

  visited.add(start);
  let found = false;

  while (stack.length > 0) {
    const current = stack.pop();
    visitedOrder.push(current);

    if (current === goal) {
      found = true;
      break;
    }

    // Neighbors are retrieved in Up, Right, Down, Left order.
    // We reverse them to push onto stack, so they get popped in the original order.
    const neighbors = maze.getNeighbors(current);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, current);
        stack.push(neighbor);
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
