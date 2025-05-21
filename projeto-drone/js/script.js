const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");
const rows = 40, cols = 40;
const cellSize = canvas.width / cols;

let grid = [], visited = [], pessoas = [], drone = { x: 0, y: 0 };
let rastros = [];

function resetGrid() {
  grid = [], visited = [], pessoas = [], rastros = [];
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    visited[y] = [];
    for (let x = 0; x < cols; x++) {
      grid[y][x] = 0;
      visited[y][x] = false;
    }
  }
  drone = { x: 0, y: 0 };
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  rastros.forEach((ponto, i) => {
    if (i === 0) return;
    ctx.strokeStyle = "#74e36a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rastros[i - 1].x * cellSize + cellSize / 2, rastros[i - 1].y * cellSize + cellSize / 2);
    ctx.lineTo(ponto.x * cellSize + cellSize / 2, ponto.y * cellSize + cellSize / 2);
    ctx.stroke();
  });

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (visited[y][x]) {
        ctx.fillStyle = "#b2fab4";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      } else {
        ctx.strokeStyle = "#ccc";
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  pessoas.forEach(p => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(p.x * cellSize + cellSize / 2, p.y * cellSize + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "gray";
  ctx.beginPath();
  ctx.arc(drone.x * cellSize + cellSize / 2, drone.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
  ctx.fill();
}

async function bfs() {
  const queue = [[drone.x, drone.y]];
  visited[drone.y][drone.x] = true;

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    drone.x = x;
    drone.y = y;
    rastros.push({ x, y });
    drawGrid();
    await new Promise(res => setTimeout(res, 20));

    for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx]) {
        visited[ny][nx] = true;
        queue.push([nx, ny]);
      }
    }
  }

  document.getElementById("rescueBtn").disabled = false;
}

function placeRandomPessoas(qtd = 5) {
  pessoas = [];
  const set = new Set();
  while (pessoas.length < qtd) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    const key = `${x},${y}`;
    if (!set.has(key) && (x !== 0 || y !== 0)) {
      pessoas.push({ x, y });
      set.add(key);
    }
  }
}

function dijkstra(start, end) {
  const dist = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const prev = Array.from({ length: rows }, () => Array(cols).fill(null));
  dist[start.y][start.x] = 0;

  let pq = [{ x: start.x, y: start.y, d: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d);
    const { x, y, d } = pq.shift();

    if (x === end.x && y === end.y) break;

    for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        const nd = d + 1;
        if (nd < dist[ny][nx]) {
          dist[ny][nx] = nd;
          prev[ny][nx] = { x, y };
          pq.push({ x: nx, y: ny, d: nd });
        }
      }
    }
  }

  const path = [];
  let curr = end;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr.y][curr.x];
  }
  return path;
}

async function resgatar() {
  const voltarInicio = dijkstra(drone, { x: 0, y: 0 });
  for (const pos of voltarInicio) {
    drone.x = pos.x;
    drone.y = pos.y;
    rastros.push({ x: pos.x, y: pos.y });
    drawGrid();
    await new Promise(res => setTimeout(res, 50));
  }

  let base = { x: 0, y: 0 };
  const restantes = [...pessoas];
  while (restantes.length > 0) {
    restantes.sort((a, b) => Math.abs(a.x - base.x) + Math.abs(a.y - base.y) - (Math.abs(b.x - base.x) + Math.abs(b.y - base.y)));
    const alvo = restantes.shift();
    const caminho = dijkstra(drone, alvo);
    for (const pos of caminho) {
      drone.x = pos.x;
      drone.y = pos.y;
      rastros.push({ x: pos.x, y: pos.y });
      drawGrid();
      await new Promise(res => setTimeout(res, 50));
    }
  }

  const volta = dijkstra(drone, { x: 0, y: 0 });
  for (const pos of volta) {
    drone.x = pos.x;
    drone.y = pos.y;
    rastros.push({ x: pos.x, y: pos.y });
    drawGrid();
    await new Promise(res => setTimeout(res, 50));
  }
}

document.getElementById("startBtn").onclick = () => {
  resetGrid();
  placeRandomPessoas();
  drawGrid();
  bfs();
};

document.getElementById("rescueBtn").onclick = () => {
  resgatar();
};

document.getElementById("resetBtn").onclick = () => {
  resetGrid();
  drawGrid();
  document.getElementById("rescueBtn").disabled = true;
};

resetGrid();
drawGrid();
