import { dfs } from '../algorithms/dfs.js';
import { bfs } from '../algorithms/bfs.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { greedy } from '../algorithms/greedy.js';
import { astar } from '../algorithms/astar.js';
import { generateClassicMaze, generateWeightedTerrain, generateRandomWalls } from '../maze/generator.js';

export class Controls {
  constructor(maze, renderer, animator) {
    this.maze = maze;
    this.renderer = renderer;
    this.animator = animator;

    this.selectedTerrain = 'water'; // Default paint brush
    this.isDrawing = false;
    this.isDraggingStart = false;
    this.isDraggingGoal = false;

    // Backend connection state
    this.backendConnected = false;
    this.backendUrl = 'http://localhost:8080';

    // Cache of comparison runs
    this.comparisonResults = {};

    this.initElements();
    this.bindEvents();

    // Perform initial health check and start polling check
    this.checkBackendConnection();
    setInterval(() => this.checkBackendConnection(), 4000);
  }

  initElements() {
    this.canvas = document.getElementById('maze-canvas');
    this.btnRun = document.getElementById('btn-run');
    this.btnPause = document.getElementById('btn-pause');
    this.btnReset = document.getElementById('btn-reset');
    this.btnCompare = document.getElementById('btn-compare');
    
    this.btnGenClassic = document.getElementById('btn-gen-classic');
    this.btnGenWeighted = document.getElementById('btn-gen-weighted');
    this.btnGenRandom = document.getElementById('btn-gen-random');
    
    this.gridSizeSelect = document.getElementById('grid-size-select');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedDisplay = document.getElementById('speed-display');
    
    this.brushButtons = document.querySelectorAll('.brush-btn');
    
    // Stats UI elements
    this.statExpanded = document.getElementById('stat-expanded');
    this.statTime = document.getElementById('stat-time');
    this.statLength = document.getElementById('stat-length');
    this.statCost = document.getElementById('stat-cost');
    this.algoTitleElement = document.querySelector('.stats-title span') || document.querySelector('.stats-title');

    // Status UI elements
    this.backendStatusDiv = document.getElementById('backend-status');
    this.backendStatusText = document.getElementById('backend-status-text');

    // Modal elements
    this.compareModal = document.getElementById('compare-modal');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.compareTableBody = document.getElementById('compare-table-body');
  }

  bindEvents() {
    // 1. Brush selection
    this.brushButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.brushButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedTerrain = btn.getAttribute('data-terrain');
      });
    });

    // 2. Mouse events on canvas
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());

    // Touch support for tablets/mobiles
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseDown(touch);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseMove(touch);
    });
    this.canvas.addEventListener('touchend', () => this.handleMouseUp());

    // 3. Grid size change
    this.gridSizeSelect.addEventListener('change', () => this.handleGridResize());

    // 4. Generators
    this.btnGenClassic.addEventListener('click', () => {
      this.animator.stop();
      generateClassicMaze(this.maze);
      this.resetStats();
      this.renderer.draw();
    });

    this.btnGenWeighted.addEventListener('click', () => {
      this.animator.stop();
      generateWeightedTerrain(this.maze);
      this.resetStats();
      this.renderer.draw();
    });

    this.btnGenRandom.addEventListener('click', () => {
      this.animator.stop();
      generateRandomWalls(this.maze);
      this.resetStats();
      this.renderer.draw();
    });

    // 5. Controls
    this.btnRun.addEventListener('click', () => this.runPathfinding());
    this.btnPause.addEventListener('click', () => this.togglePause());
    this.btnReset.addEventListener('click', () => this.resetGrid());
    this.btnCompare.addEventListener('click', () => this.compareAlgorithms());

    // 6. Speed Slider
    this.speedSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.speedDisplay.textContent = `${val}%`;
      this.animator.setSpeed(val);
    });

    // 7. Modal close
    this.btnCloseModal.addEventListener('click', () => {
      this.compareModal.classList.remove('open');
    });
    this.compareModal.addEventListener('click', (e) => {
      if (e.target === this.compareModal) {
        this.compareModal.classList.remove('open');
      }
    });
  }

  // Health check to C++ server
  checkBackendConnection() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    fetch(`${this.backendUrl}/health`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        if (data && data.status === 'ok') {
          this.updateBackendStatus(true);
        } else {
          this.updateBackendStatus(false);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        this.updateBackendStatus(false);
      });
  }

  updateBackendStatus(online) {
    this.backendConnected = online;
    if (this.backendStatusDiv) {
      if (online) {
        this.backendStatusDiv.className = 'status-indicator status-online';
        this.backendStatusText.textContent = 'C++ Backend: Connected';
      } else {
        this.backendStatusDiv.className = 'status-indicator status-offline';
        this.backendStatusText.textContent = 'C++ Backend: Offline (JS Fallback)';
      }
    }
  }

  handleMouseDown(e) {
    if (this.animator.isPlaying) return;

    const coords = this.renderer.canvasToGridCoords(e.clientX, e.clientY);
    if (!coords) return;

    const cell = this.maze.getCell(coords.x, coords.y);
    if (cell === this.maze.start) {
      this.isDraggingStart = true;
    } else if (cell === this.maze.goal) {
      this.isDraggingGoal = true;
    } else {
      this.isDrawing = true;
      this.paintCell(coords.x, coords.y);
    }
  }

  handleMouseMove(e) {
    if (this.animator.isPlaying) return;

    const coords = this.renderer.canvasToGridCoords(e.clientX, e.clientY);
    if (!coords) return;

    const cell = this.maze.getCell(coords.x, coords.y);

    if (this.isDraggingStart) {
      if (cell && cell !== this.maze.goal) {
        // Clear old start
        this.maze.start.terrain = 'road';
        this.maze.start.weight = 1;
        // Assign new start
        this.maze.start = cell;
        cell.terrain = 'road';
        cell.weight = 1;
        this.renderer.draw();
      }
    } else if (this.isDraggingGoal) {
      if (cell && cell !== this.maze.start) {
        // Clear old goal
        this.maze.goal.terrain = 'road';
        this.maze.goal.weight = 1;
        // Assign new goal
        this.maze.goal = cell;
        cell.terrain = 'road';
        cell.weight = 1;
        this.renderer.draw();
      }
    } else if (this.isDrawing) {
      this.paintCell(coords.x, coords.y);
    }
  }

  handleMouseUp() {
    this.isDrawing = false;
    this.isDraggingStart = false;
    this.isDraggingGoal = false;
  }

  paintCell(x, y) {
    const cell = this.maze.getCell(x, y);
    if (!cell || cell === this.maze.start || cell === this.maze.goal) return;

    if (this.selectedTerrain === 'start') {
      this.maze.start.terrain = 'road';
      this.maze.start.weight = 1;
      this.maze.start = cell;
      cell.terrain = 'road';
      cell.weight = 1;
    } else if (this.selectedTerrain === 'goal') {
      this.maze.goal.terrain = 'road';
      this.maze.goal.weight = 1;
      this.maze.goal = cell;
      cell.terrain = 'road';
      cell.weight = 1;
    } else {
      this.maze.setTerrain(x, y, this.selectedTerrain);
    }
    
    this.renderer.draw();
  }

  handleGridResize() {
    this.animator.stop();
    const [cols, rows] = this.gridSizeSelect.value.split('x').map(Number);
    this.maze.width = cols;
    this.maze.height = rows;
    this.maze.initGrid();
    this.resetStats();
    this.renderer.draw();
  }

  getSelectedAlgorithm() {
    const selected = document.querySelector('input[name="algorithm"]:checked');
    return selected ? selected.value : 'bfs';
  }

  getAlgorithmFunction(name) {
    switch (name) {
      case 'dfs': return dfs;
      case 'dijkstra': return dijkstra;
      case 'greedy': return greedy;
      case 'astar': return astar;
      case 'bfs':
      default:
        return bfs;
    }
  }

  getAlgorithmDisplayName(name) {
    switch (name) {
      case 'bfs': return 'BFS (Breadth First)';
      case 'dfs': return 'DFS (Depth First)';
      case 'dijkstra': return 'Dijkstra\'s';
      case 'greedy': return 'Greedy Best-First';
      case 'astar': return 'A* Search';
      default: return 'Search';
    }
  }

  // Convert current grid state to serializable JSON payload
  getGridPayload(algoKey) {
    const gridData = [];
    for (let y = 0; y < this.maze.height; y++) {
      const row = [];
      for (let x = 0; x < this.maze.width; x++) {
        row.push(this.maze.grid[y][x].terrain);
      }
      gridData.push(row);
    }

    return {
      algorithm: algoKey,
      width: this.maze.width,
      height: this.maze.height,
      start: { x: this.maze.start.x, y: this.maze.start.y },
      goal: { x: this.maze.goal.x, y: this.maze.goal.y },
      grid: gridData
    };
  }

  // Map coordinates returned from server back to grid Cell references
  mapCoordinatesToCells(resultJson) {
    return {
      visitedOrder: resultJson.visitedOrder.map(coord => this.maze.getCell(coord.x, coord.y)),
      path: resultJson.success && resultJson.path.length > 0 ? 
        resultJson.path.map(coord => this.maze.getCell(coord.x, coord.y)) : null,
      nodesExpanded: resultJson.nodesExpanded,
      pathCost: resultJson.pathCost,
      executionTime: resultJson.executionTime
    };
  }

  runPathfinding() {
    if (this.animator.isPlaying) {
      this.animator.stop();
      this.resetStats();
      this.renderer.draw();
      return;
    }

    const algoKey = this.getSelectedAlgorithm();
    this.setControlsState(true);

    if (this.backendConnected) {
      this.statTime.textContent = 'Calculating (C++)...';
      const payload = this.getGridPayload(algoKey);

      fetch(`${this.backendUrl}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error('C++ solver endpoint error');
        return res.json();
      })
      .then(data => {
        const mappedResult = this.mapCoordinatesToCells(data);
        this.animateSearch(mappedResult);
      })
      .catch(err => {
        console.warn('C++ Solver failed, falling back to local JS:', err);
        this.updateBackendStatus(false);
        this.runLocalPathfinding(algoKey);
      });
    } else {
      this.runLocalPathfinding(algoKey);
    }
  }

  runLocalPathfinding(algoKey) {
    const algoFn = this.getAlgorithmFunction(algoKey);
    const result = algoFn(this.maze, this.maze.start, this.maze.goal);
    this.animateSearch(result);
  }

  animateSearch(result) {
    this.animator.start(
      result,
      (stepStats) => {
        this.statExpanded.textContent = stepStats.nodesExpanded;
        this.statTime.textContent = 'Animating...';
        this.statLength.textContent = '-';
        this.statCost.textContent = '-';
      },
      () => {
        this.statExpanded.textContent = result.nodesExpanded;
        this.statTime.textContent = `${result.executionTime.toFixed(3)} ms ${this.backendConnected ? '(C++)' : '(JS)'}`;
        
        if (result.path) {
          this.statLength.textContent = result.path.length;
          this.statCost.textContent = result.pathCost;
        } else {
          this.statLength.textContent = 'No Path';
          this.statCost.textContent = '∞';
        }
        
        this.setControlsState(false);
      }
    );
  }

  togglePause() {
    if (this.animator.isPaused) {
      this.animator.play();
      this.btnPause.innerHTML = '<i data-lucide="pause"></i> Pause';
    } else {
      this.animator.pause();
      this.btnPause.innerHTML = '<i data-lucide="play"></i> Resume';
    }
    lucide.createIcons();
  }

  resetGrid() {
    this.animator.stop();
    this.maze.resetSearch();
    this.resetStats();
    this.renderer.draw();
  }

  resetStats() {
    this.statExpanded.textContent = '-';
    this.statTime.textContent = '-';
    this.statLength.textContent = '-';
    this.statCost.textContent = '-';
    if (this.algoTitleElement) {
      this.algoTitleElement.innerHTML = '<i data-lucide="activity"></i> Run Statistics';
      lucide.createIcons();
    }
  }

  setControlsState(isRunning) {
    this.btnRun.innerHTML = isRunning ? 
      '<i data-lucide="square"></i> Stop' : 
      '<i data-lucide="play"></i> Run Algorithm';
    
    if (isRunning) {
      this.btnRun.classList.remove('btn-primary');
      this.btnRun.classList.add('btn-secondary');
    } else {
      this.btnRun.classList.remove('btn-secondary');
      this.btnRun.classList.add('btn-primary');
    }

    this.btnPause.disabled = !isRunning;
    this.btnPause.innerHTML = '<i data-lucide="pause"></i> Pause';
    
    // Disable grid config, generator buttons, algorithm radios during animation
    this.btnReset.disabled = isRunning;
    this.btnCompare.disabled = isRunning;
    this.gridSizeSelect.disabled = isRunning;
    
    this.btnGenClassic.disabled = isRunning;
    this.btnGenWeighted.disabled = isRunning;
    this.btnGenRandom.disabled = isRunning;
    
    document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
      radio.disabled = isRunning;
    });

    lucide.createIcons();
  }

  compareAlgorithms() {
    if (this.animator.isPlaying) return;

    this.maze.resetSearch();
    this.btnCompare.innerHTML = '<i data-lucide="loader"></i> Fetching...';
    this.btnCompare.disabled = true;

    if (this.backendConnected) {
      const payload = this.getGridPayload('all'); // comparison sends complete grid
      fetch(`${this.backendUrl}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error('C++ compare endpoint error');
        return res.json();
      })
      .then(data => {
        this.comparisonResults = {};
        this.compareTableBody.innerHTML = '';
        
        const algorithms = ['bfs', 'dfs', 'dijkstra', 'greedy', 'astar'];
        for (const key of algorithms) {
          const mappedResult = this.mapCoordinatesToCells(data[key]);
          this.comparisonResults[key] = mappedResult;
          this.addRowToCompareTable(key, mappedResult);
        }
        
        this.btnCompare.innerHTML = '<i data-lucide="bar-chart-2"></i> Compare All';
        this.btnCompare.disabled = false;
        lucide.createIcons();
        this.compareModal.classList.add('open');
        this.bindVisualizeButtons();
      })
      .catch(err => {
        console.warn('C++ Compare failed, falling back to local JS:', err);
        this.updateBackendStatus(false);
        this.runLocalCompare();
      });
    } else {
      this.runLocalCompare();
    }
  }

  runLocalCompare() {
    this.comparisonResults = {};
    this.compareTableBody.innerHTML = '';
    
    const algorithms = ['bfs', 'dfs', 'dijkstra', 'greedy', 'astar'];
    for (const key of algorithms) {
      const algoFn = this.getAlgorithmFunction(key);
      const result = algoFn(this.maze, this.maze.start, this.maze.goal);
      this.comparisonResults[key] = result;
      this.addRowToCompareTable(key, result);
    }
    
    this.btnCompare.innerHTML = '<i data-lucide="bar-chart-2"></i> Compare All';
    this.btnCompare.disabled = false;
    lucide.createIcons();
    this.compareModal.classList.add('open');
    this.bindVisualizeButtons();
  }

  addRowToCompareTable(key, result) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-algo', key);

    const statusBadge = result.path ? 
      `<span class="status-badge status-success"><i data-lucide="check"></i> Solved</span>` : 
      `<span class="status-badge status-fail"><i data-lucide="x"></i> Unreachable</span>`;

    const costText = result.path ? result.pathCost : '∞';
    const lengthText = result.path ? result.path.length : '0';
    const sourceSuffix = this.backendConnected ? ' (C++)' : ' (JS)';

    tr.innerHTML = `
      <td><strong>${this.getAlgorithmDisplayName(key)}</strong></td>
      <td>${statusBadge}</td>
      <td>${costText}</td>
      <td>${lengthText}</td>
      <td>${result.nodesExpanded}</td>
      <td>${result.executionTime.toFixed(3)} ms${sourceSuffix}</td>
      <td>
        <button class="btn btn-secondary btn-sm btn-visualize-path" data-algo="${key}" ${!result.path ? 'disabled' : ''}>
          Visualize Path
        </button>
      </td>
    `;

    this.compareTableBody.appendChild(tr);
  }

  bindVisualizeButtons() {
    const vizBtns = this.compareTableBody.querySelectorAll('.btn-visualize-path');
    vizBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-algo');
        this.visualizeOverlayPath(key);
      });
    });
  }

  visualizeOverlayPath(key) {
    const result = this.comparisonResults[key];
    if (!result || !result.path) return;

    // Close Modal
    this.compareModal.classList.remove('open');

    // Reset search markers on grid
    this.maze.resetSearch();
    
    // Set parent pointers from the path so renderer draws it correctly
    for (let i = 1; i < result.path.length; i++) {
      result.path[i].parent = result.path[i - 1];
    }

    // Mark nodes in path as visited
    result.visitedOrder.forEach(cell => {
      cell.visited = true;
    });

    this.renderer.draw();

    // Update main page Stats Board
    this.statExpanded.textContent = result.nodesExpanded;
    this.statTime.textContent = `${result.executionTime.toFixed(3)} ms ${this.backendConnected ? '(C++)' : '(JS)'}`;
    this.statLength.textContent = result.path.length;
    this.statCost.textContent = result.pathCost;

    if (this.algoTitleElement) {
      this.algoTitleElement.innerHTML = `<i data-lucide="activity"></i> Statistics: ${this.getAlgorithmDisplayName(key)}`;
      lucide.createIcons();
    }
  }
}
