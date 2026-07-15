export function greedy(maze, start, goal) {
  const startTime = performance.now();
  maze.resetSearch();

  const visitedOrder = [];
  const queue = [start];
  
  const getHeuristic = (cell) => {
    return Math.abs(cell.x - goal.x) + Math.abs(cell.y - goal.y);
  };

  start.h = getHeuristic(start);
  const visited = new Set();
  const inQueue = new Set();
  inQueue.add(start);
  const parentMap = new Map();

  let found = false;

  while (queue.length > 0) {
    // Find node with minimum h score
    let minIdx = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].h < queue[minIdx].h) {
        minIdx = i;
      }
    }
    const current = queue.splice(minIdx, 1)[0];
    inQueue.delete(current);

    if (visited.has(current)) continue;
    visited.add(current);
    visitedOrder.push(current);

    if (current === goal) {
      found = true;
      break;
    }

    const neighbors = maze.getNeighbors(current);
    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || inQueue.has(neighbor)) continue;

      neighbor.h = getHeuristic(neighbor);
      parentMap.set(neighbor, current);
      queue.push(neighbor);
      inQueue.add(neighbor);
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
