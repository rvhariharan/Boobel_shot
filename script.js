const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let colors = ["red", "orange", "white"];
let currentColorIndex = 0;

function getNextColor() {
  let color = colors[currentColorIndex];
  currentColorIndex = (currentColorIndex + 1) % colors.length;
  return color;
}

let shooter = {
  x: canvas.width / 2,
  y: canvas.height - 30,
  radius: 10,
  color: getNextColor(),
  dx: 0,
  dy: 0,
  isMoving: false
};

let placedBubbles = [];

function drawShooter() {
  ctx.beginPath();
  ctx.arc(shooter.x, shooter.y, shooter.radius, 0, Math.PI * 2);
  ctx.fillStyle = shooter.color;
  ctx.fill();
  ctx.closePath();
}

function drawPlacedBubbles() {
  placedBubbles.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, shooter.radius, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.closePath();
  });
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function resetShooter() {
  shooter = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    radius: 10,
    color: getNextColor(),
    dx: 0,
    dy: 0,
    isMoving: false
  };
}

function placeBubble(x, y, color) {
  placedBubbles.push({ x, y, color });
}

function checkCollision() {
  for (let i = 0; i < placedBubbles.length; i++) {
    let b = placedBubbles[i];
    let dx = shooter.x - b.x;
    let dy = shooter.y - b.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < shooter.radius * 2) {
      if (shooter.color === b.color) {
        const removed = placedBubbles.splice(i, 1)[0];
        const center = { x: removed.x, y: removed.y };
        checkFloatingBubbles(center);
        return "remove";
      } else {
        let angle = Math.atan2(dy, dx);
        shooter.x = b.x + Math.cos(angle) * shooter.radius * 2;
        shooter.y = b.y + Math.sin(angle) * shooter.radius * 2;
        return "stick";
      }
    }
  }
  return null;
}

function updateShooter() {
  if (shooter.isMoving) {
    shooter.x += shooter.dx;
    shooter.y += shooter.dy;

    if (shooter.x <= shooter.radius || shooter.x >= canvas.width - shooter.radius) {
      shooter.dx *= -1;
    }

    if (shooter.y <= shooter.radius) {
      shooter.isMoving = false;
      placeBubble(shooter.x, shooter.y, shooter.color);
      resetShooter();
      return;
    }

    let collisionResult = checkCollision();
    if (collisionResult === "remove") {
      shooter.isMoving = false;
      resetShooter();
    } else if (collisionResult === "stick") {
      shooter.isMoving = false;
      placeBubble(shooter.x, shooter.y, shooter.color);
      resetShooter();
    }
  }
}

function checkFloatingBubbles(poppedCenter) {
  let connectedToTop = new Set();

  // Step 1: Mark all top-connected bubbles
  placedBubbles.forEach((b, i) => {
    if (b.y - b.radius <= 0) {
      dfs(i, connectedToTop);
    }
  });

  // Step 2: Find neighbors of the popped area
  let floatingSet = new Set();
  placedBubbles.forEach((b, i) => {
    let dx = b.x - poppedCenter.x;
    let dy = b.y - poppedCenter.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < b.radius * 2 + 2) {
      collectCluster(i, floatingSet);
    }
  });

  // Step 3: Remove floating group not connected to top
  placedBubbles = placedBubbles.filter((_, i) => {
    return !(floatingSet.has(i) && !connectedToTop.has(i));
  });
}

function dfs(index, connected) {
  if (connected.has(index)) return;
  connected.add(index);
  let b1 = placedBubbles[index];

  for (let i = 0; i < placedBubbles.length; i++) {
    if (i === index) continue;
    let b2 = placedBubbles[i];
    let dx = b1.x - b2.x;
    let dy = b1.y - b2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= b1.radius * 2 + 1) {
      dfs(i, connected);
    }
  }
}

function collectCluster(index, visited) {
  if (visited.has(index)) return;
  visited.add(index);
  let b1 = placedBubbles[index];

  for (let i = 0; i < placedBubbles.length; i++) {
    if (i === index) continue;
    let b2 = placedBubbles[i];
    let dx = b1.x - b2.x;
    let dy = b1.y - b2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= b1.radius * 2 + 1) {
      collectCluster(i, visited);
    }
  }
}

canvas.addEventListener("click", function (event) {
  if (!shooter.isMoving) {
    let rect = canvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    let angle = Math.atan2(mouseY - shooter.y, mouseX - shooter.x);
    shooter.dx = Math.cos(angle) * 5;
    shooter.dy = Math.sin(angle) * 5;
    shooter.isMoving = true;
  }
});

function gameLoop() {
  clearCanvas();
  drawPlacedBubbles();
  updateShooter();
  drawShooter();
  requestAnimationFrame(gameLoop);
}

gameLoop();
