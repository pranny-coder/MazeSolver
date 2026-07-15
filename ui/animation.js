export class Animator {
  constructor(maze, renderer) {
    this.maze = maze;
    this.renderer = renderer;
    
    this.isPlaying = false;
    this.isPaused = false;
    
    this.visitedOrder = [];
    this.path = [];
    this.currentIndex = 0;
    this.timerId = null;
    this.speed = 70; // 1 to 100
    
    this.onStepCallback = null;
    this.onCompleteCallback = null;
  }

  setSpeed(value) {
    this.speed = value;
  }

  // Calculate delay in ms based on speed slider value (1 = slow, 100 = fast)
  getDelay() {
    // Exponential curve for better control: slider 100 -> 2ms, slider 1 -> ~500ms
    const percentage = (100 - this.speed) / 100;
    return Math.max(2, Math.floor(500 * Math.pow(percentage, 2)));
  }

  start(searchResult, onStep, onComplete) {
    this.stop();
    
    this.visitedOrder = searchResult.visitedOrder;
    this.path = searchResult.path;
    this.onStepCallback = onStep;
    this.onCompleteCallback = onComplete;
    
    this.isPlaying = true;
    this.isPaused = false;
    this.currentIndex = 0;
    
    this.maze.resetSearch();
    this.tick();
  }

  play() {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false;
      this.tick();
    }
  }

  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.isPaused = true;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.visitedOrder = [];
    this.path = [];
    this.currentIndex = 0;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  tick() {
    if (!this.isPlaying || this.isPaused) return;

    if (this.currentIndex >= this.visitedOrder.length) {
      this.complete();
      return;
    }

    const currentCell = this.visitedOrder[this.currentIndex];
    
    // Mark current cell as visited and clear its frontier flag
    currentCell.visited = true;
    currentCell.frontier = false;

    // Expand neighbors as frontier nodes (for visualization)
    const neighbors = this.maze.getNeighbors(currentCell);
    for (const neighbor of neighbors) {
      if (!neighbor.visited && neighbor !== this.maze.start && neighbor !== this.maze.goal) {
        neighbor.frontier = true;
      }
    }

    // Trigger step callback for UI metrics
    if (this.onStepCallback) {
      this.onStepCallback({
        nodesExpanded: this.currentIndex + 1,
        // Show current progress, path statistics are only final at the end
        time: null,
        pathLength: null,
        pathCost: null
      });
    }

    // Re-draw grid
    this.renderer.draw();
    
    this.currentIndex++;
    this.timerId = setTimeout(() => this.tick(), this.getDelay());
  }

  complete() {
    this.isPlaying = false;
    
    // If a path was found, we ensure all path cells are marked
    if (this.path) {
      // Reconstruct path parent links for renderer.draw() default behavior
      for (let i = 1; i < this.path.length; i++) {
        this.path[i].parent = this.path[i - 1];
      }
    }

    this.renderer.draw();

    if (this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  }
}
