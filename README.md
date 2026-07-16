# PathFinder AI Playground & Maze Solver

An interactive, visual playground for comparing classic graph traversal and heuristic search algorithms on variable-weighted grid terrains. The application features a modern web interface connected to a high-performance C++ backend solver.

## 🚀 Live Demo & Project Repository
Access the project repository at: [https://github.com/pranny-coder/MazeSolver](https://github.com/pranny-coder/MazeSolver)

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5 Canvas, Modern CSS (sleek dark mode styling), and modular ES6 JavaScript.
- **Backend**: C++17 pathfinding server using `yhirose/cpp-httplib` for high-performance HTTP request handling and `nlohmann/json` for grid serialization.
- **Inter-process Comm**: JSON payloads sent via POST requests to communicate grid structures, algorithm selections, and search results.

---

## 🧠 Supported Search Algorithms

The playground supports both blind (uninformed) and heuristic (informed) search algorithms:

1. **Breadth-First Search (BFS)**: Unweighted search that explores level-by-level, guaranteeing the path with the fewest hops/edges.
2. **Depth-First Search (DFS)**: Unweighted search that explores as deep as possible before backtracking (suboptimal pathing).
3. **Dijkstra's Algorithm**: Weighted search that expands nodes in order of cumulative cost, guaranteeing the mathematically cheapest path.
4. **Greedy Best-First Search**: Heuristic search that expands nodes closest to the goal based on Manhattan distance (extremely fast, but suboptimal).
5. **A\* Search Algorithm**: Optimal weighted heuristic search evaluating nodes using $f(n) = g(n) + h(n)$ to guarantee the cheapest path with minimized exploration.

---

## ✨ Features

- **Interactive Canvas Paintbrush**: Select and paint different terrain types directly on the grid:
  - **Road (Flat)**: Cost = `1`
  - **Grass (Soft)**: Cost = `2`
  - **Mud (Slippery)**: Cost = `5`
  - **Water (Obstacle/Wall)**: Cost = `∞` (Passage blocked)
  - Drag and drop **Start (S)** and **Goal (G)** nodes dynamically.
- **Procedural Maze Generators**:
  - **Classic Maze**: Generates a standard recursive division wall maze.
  - **Weighted Terrain**: Generates randomized patches of grass, mud, and roads.
  - **Random Walls**: Scatters water obstacles randomly across the arena.
- **Animation Controls**: Adjust visualization speed dynamically, pause/resume, or reset grid markers.
- **Compare All Suite**: Run all five algorithms simultaneously to compare **Nodes Expanded**, **Execution Time (ms)**, **Path Length**, and **Total Path Cost** side-by-side in a comparative modal. You can overlay any algorithm's path directly on the canvas with a single click.

---

## 💻 Getting Started & Running Locally

### 1. Start the C++ Backend Server
Navigate to the `server/` directory, compile the binary using the provided `Makefile`, and launch the executable:

```bash
cd server
make clean && make
./solver_server
```
*The backend server will launch and listen on `http://localhost:8080`.*

### 2. Start the Frontend Dev Server
Run a local static web server in the root of the project. For example, using Python's built-in HTTP module:

```bash
# In the project root directory
python3 -m http.server 3000
```
Open your browser and navigate to `http://localhost:3000`. The frontend will automatically detect the C++ backend on port `8080` (with a local JavaScript fallback if the backend goes offline).
