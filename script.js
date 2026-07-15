import { Maze } from './maze/maze.js';
import { Renderer } from './ui/renderer.js';
import { Animator } from './ui/animation.js';
import { Controls } from './ui/controls.js';

// Wait for DOM to finish parsing (type="module" does this by default, but let's be explicitly safe)
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('maze-canvas');
  if (!canvas) {
    console.error('Failed to locate canvas element');
    return;
  }

  // 1. Initialize Maze with 30 columns and 15 rows (matches default UI dropdown)
  const maze = new Maze(30, 15);

  // 2. Initialize Renderer
  const renderer = new Renderer(canvas, maze);

  // 3. Initialize Animator
  const animator = new Animator(maze, renderer);

  // 4. Initialize Controls (event binding, algorithm runners)
  const controls = new Controls(maze, renderer, animator);

  // 5. Perform initial draw
  renderer.draw();
});
