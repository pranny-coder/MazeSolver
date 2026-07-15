export function dijkstra(maze, start, goal) {
  const startTime = performance.now();
  maze.resetSearch();

  const visitedOrder = [];
  const queue = [start];
  
  start.g = 0;
  const visited = new Set();
  const parentMap = new Map();

  let found = false;

  while (queue.length > 0) {
    // Find node with minimum g score
    let minIdx = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].g < queue[minIdx].g) {
        minIdx = i;
      }
    }
    const current = queue.splice(minIdx, 1)[0];

    // Skip if already visited
    if (visited.has(current)) continue;
    visited.add(current);
    visitedOrder.push(current);

    if (current === goal) {
      found = true;
      break;
    }

    const neighbors = maze.getNeighbors(current);
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;

      const tentativeG = current.g + neighbor.weight;
      if (tentativeG < neighbor.g) {
        neighbor.g = tentativeG;
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
    pathCost = goal.g;
  }

  return {
    visitedOrder,
    path,
    executionTime,
    nodesExpanded: visitedOrder.length,
    pathCost
  };
}
