export class Renderer {
  constructor(canvas, maze) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maze = maze;
    
    // Set standard internal resolution (sharp drawing)
    this.canvas.width = 1200;
    this.canvas.height = 600;
    
    // Theme Colors
    this.colors = {
      road: '#1a2236',
      roadBorder: '#273554',
      grass: '#144637',
      grassBorder: '#1c624d',
      mud: '#4e2d14',
      mudBorder: '#6d3f1c',
      water: '#0a101d',
      waterBorder: '#14203b',
      
      start: '#10b981',
      goal: '#f59e0b',
      
      visited: 'rgba(139, 92, 246, 0.35)',
      visitedBorder: 'rgba(167, 139, 250, 0.7)',
      frontier: 'rgba(236, 72, 153, 0.3)',
      frontierBorder: 'rgba(244, 63, 94, 0.6)',
      
      path: '#00f2fe',
      pathSecondary: '#4facfe'
    };
  }

  // Calculate cell layout sizes dynamically to keep cells square and centered
  getLayout() {
    const cellSize = Math.floor(Math.min(this.canvas.width / this.maze.width, this.canvas.height / this.maze.height));
    const gridWidth = this.maze.width * cellSize;
    const gridHeight = this.maze.height * cellSize;
    const offsetX = (this.canvas.width - gridWidth) / 2;
    const offsetY = (this.canvas.height - gridHeight) / 2;

    return { cellSize, offsetX, offsetY };
  }

  // Convert canvas pixel coordinates to grid cell coordinates
  canvasToGridCoords(px, py) {
    const rect = this.canvas.getBoundingClientRect();
    
    // Scale factor to map CSS pixels to internal canvas dimensions
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const internalX = (px - rect.left) * scaleX;
    const internalY = (py - rect.top) * scaleY;
    
    const { cellSize, offsetX, offsetY } = this.getLayout();
    
    const gridX = Math.floor((internalX - offsetX) / cellSize);
    const gridY = Math.floor((internalY - offsetY) / cellSize);
    
    if (gridX >= 0 && gridX < this.maze.width && gridY >= 0 && gridY < this.maze.height) {
      return { x: gridX, y: gridY };
    }
    return null;
  }

  draw(activePath = null) {
    const { cellSize, offsetX, offsetY } = this.getLayout();
    const ctx = this.ctx;
    
    // 1. Clear Canvas with dark background
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 2. Draw Grid Cells
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const cell = this.maze.grid[y][x];
        const cellX = offsetX + x * cellSize;
        const cellY = offsetY + y * cellSize;
        
        // Determine fill and stroke based on terrain
        let fillStyle = this.colors.road;
        let strokeStyle = this.colors.roadBorder;
        
        if (cell.terrain === 'grass') {
          fillStyle = this.colors.grass;
          strokeStyle = this.colors.grassBorder;
        } else if (cell.terrain === 'mud') {
          fillStyle = this.colors.mud;
          strokeStyle = this.colors.mudBorder;
        } else if (cell.terrain === 'water') {
          fillStyle = this.colors.water;
          strokeStyle = this.colors.waterBorder;
        }
        
        ctx.fillStyle = fillStyle;
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
        
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
        
        // 3. Draw Visited and Frontier overlays
        if (cell !== this.maze.start && cell !== this.maze.goal) {
          if (cell.visited) {
            ctx.fillStyle = this.colors.visited;
            ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = this.colors.visitedBorder;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
          } else if (cell.frontier) {
            ctx.fillStyle = this.colors.frontier;
            ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = this.colors.frontierBorder;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
          }
        }
      }
    }
    
    // 4. Draw Path Overlay (if any)
    const path = activePath || (this.maze.goal.visited ? this.reconstructPath() : null);
    if (path && path.length > 1) {
      ctx.save();
      ctx.beginPath();
      
      const startX = offsetX + path[0].x * cellSize + cellSize / 2;
      const startY = offsetY + path[0].y * cellSize + cellSize / 2;
      ctx.moveTo(startX, startY);
      
      for (let i = 1; i < path.length; i++) {
        const px = offsetX + path[i].x * cellSize + cellSize / 2;
        const py = offsetY + path[i].y * cellSize + cellSize / 2;
        ctx.lineTo(px, py);
      }
      
      // Neon Glow styling
      const gradient = ctx.createLinearGradient(offsetX, offsetY, offsetX + this.maze.width * cellSize, offsetY + this.maze.height * cellSize);
      gradient.addColorStop(0, this.colors.path);
      gradient.addColorStop(1, this.colors.pathSecondary);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(4, cellSize * 0.25);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = this.colors.path;
      ctx.shadowBlur = 12;
      
      ctx.stroke();
      ctx.restore();
    }
    
    // 5. Draw Start & Goal Nodes (distinctive symbols)
    this.drawNode(this.maze.start, 'S', this.colors.start, cellSize, offsetX, offsetY);
    this.drawNode(this.maze.goal, 'G', this.colors.goal, cellSize, offsetX, offsetY);
  }

  drawNode(cell, label, color, cellSize, offsetX, offsetY) {
    const ctx = this.ctx;
    const cx = offsetX + cell.x * cellSize + cellSize / 2;
    const cy = offsetY + cell.y * cellSize + cellSize / 2;
    const radius = (cellSize / 2) * 0.8;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fill();
    
    // Draw label
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#060911';
    ctx.font = `bold ${Math.floor(cellSize * 0.45)}px ${this.colors.fontTitle || 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
    
    ctx.restore();
  }

  reconstructPath() {
    const path = [];
    let curr = this.maze.goal;
    while (curr) {
      path.push(curr);
      curr = curr.parent;
    }
    path.reverse();
    return path;
  }
}
