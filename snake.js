const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('internal-status');
const startBtn = document.getElementById('start-internal-btn');
const uiOverlay = document.getElementById('internal-game-ui');

let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameLoop = null;
let gridSize = 20;
let tileCount = 20;
let speed = 100;

function initSnake() {
    canvas.width = 400;
    canvas.height = 400;
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    createFood();
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Don't spawn food on snake
    if (snake.some(part => part.x === food.x && part.y === food.y)) {
        createFood();
    }
}

function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines (subtle retro feel)
    ctx.strokeStyle = '#111';
    for(let i=0; i<canvas.width; i+=gridSize) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0055';
    ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

    // Snake
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? '#00ff88' : '#00cc66';
        ctx.shadowBlur = index === 0 ? 20 : 0;
        ctx.shadowColor = '#00ff88';
        ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
    ctx.shadowBlur = 0;
}

function update() {
    direction = nextDirection;
    const head = { x: snake[0].x, y: snake[0].y };

    if (direction === 'right') head.x++;
    if (direction === 'left') head.x--;
    if (direction === 'up') head.y--;
    if (direction === 'down') head.y++;

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self collision
    if (snake.some(part => part.x === head.x && part.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        createFood();
    } else {
        snake.pop();
    }
}

function gameOver() {
    clearInterval(gameLoop);
    gameLoop = null;
    statusText.textContent = `GAME OVER! SCORE: ${score}`;
    startBtn.textContent = 'RETRY';
    uiOverlay.classList.remove('hidden');
}

function run() {
    update();
    draw();
}

function startSnakeGame() {
    initSnake();
    uiOverlay.classList.add('hidden');
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(run, speed);
}

function stopSnakeGame() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = null;
}

// Controls
window.addEventListener('keydown', e => {
    if (['ArrowUp', 'w', 'W'].includes(e.key) && direction !== 'down') nextDirection = 'up';
    if (['ArrowDown', 's', 'S'].includes(e.key) && direction !== 'up') nextDirection = 'down';
    if (['ArrowLeft', 'a', 'A'].includes(e.key) && direction !== 'right') nextDirection = 'left';
    if (['ArrowRight', 'd', 'D'].includes(e.key) && direction !== 'left') nextDirection = 'right';
    
    // Prevent scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
});

startBtn.onclick = startSnakeGame;

// Export functions to window for script.js to call
window.SnakeGame = {
    start: () => {
        canvas.classList.remove('hidden');
        uiOverlay.classList.remove('hidden');
        statusText.textContent = 'READY?';
        startBtn.textContent = 'START GAME';
        initSnake();
        draw();
    },
    stop: () => {
        stopSnakeGame();
        canvas.classList.add('hidden');
        uiOverlay.classList.add('hidden');
    }
};
