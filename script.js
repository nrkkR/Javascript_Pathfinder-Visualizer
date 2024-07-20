const algorithmSelect = document.getElementById('algorithm');
const startButton = document.getElementById('start');
const clearButton = document.getElementById('clear');
const gridContainer = document.getElementById('grid-container');

const ROWS = 20;
const COLS = 20;
let grid = [];
let startNode = null;
let endNode = null;
let isDraggingStart = false;
let isDraggingEnd = false;

function createGrid() {
    gridContainer.innerHTML = '';
    grid = [];
    for (let row = 0; row < ROWS; row++) {
        const gridRow = [];
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.id = `cell-${row}-${col}`;
            cell.addEventListener('mousedown', () => handleMouseDown(row, col));
            cell.addEventListener('mouseenter', () => handleMouseEnter(row, col));
            cell.addEventListener('mouseup', handleMouseUp);
            gridContainer.appendChild(cell);
            gridRow.push({ row, col, isStart: false, isEnd: false, isWall: false, isVisited: false, distance: Infinity, previousNode: null, heuristic: Infinity });
        }
        grid.push(gridRow);
    }
    startNode = grid[0][0];
    startNode.isStart = true;
    document.getElementById(`cell-0-0`).classList.add('start');
    endNode = grid[ROWS - 1][COLS - 1];
    endNode.isEnd = true;
    document.getElementById(`cell-${ROWS - 1}-${COLS - 1}`).classList.add('end');
}

function handleMouseDown(row, col) {
    const cell = grid[row][col];
    if (cell.isStart) {
        isDraggingStart = true;
    } else if (cell.isEnd) {
        isDraggingEnd = true;
    } else {
        cell.isWall = !cell.isWall;
        document.getElementById(`cell-${row}-${col}`).classList.toggle('wall', cell.isWall);
    }
}

function handleMouseEnter(row, col) {
    if (isDraggingStart && !grid[row][col].isEnd && !grid[row][col].isWall) {
        document.getElementById(`cell-${startNode.row}-${startNode.col}`).classList.remove('start');
        startNode.isStart = false;
        startNode = grid[row][col];
        startNode.isStart = true;
        document.getElementById(`cell-${row}-${col}`).classList.add('start');
    } else if (isDraggingEnd && !grid[row][col].isStart && !grid[row][col].isWall) {
        document.getElementById(`cell-${endNode.row}-${endNode.col}`).classList.remove('end');
        endNode.isEnd = false;
        endNode = grid[row][col];
        endNode.isEnd = true;
        document.getElementById(`cell-${row}-${col}`).classList.add('end');
    }
}

function handleMouseUp() {
    isDraggingStart = false;
    isDraggingEnd = false;
}

function clearGrid() {
    createGrid();
}

async function visualizePath() {
    if (!startNode || !endNode) return;
    const algorithm = algorithmSelect.value;
    switch (algorithm) {
        case 'dijkstra':
            await dijkstra();
            break;
        case 'aStar':
            await aStar();
            break;
    }
}

async function dijkstra() {
    const unvisitedNodes = getAllNodes();
    startNode.distance = 0;
    while (unvisitedNodes.length) {
        sortNodesByDistance(unvisitedNodes);
        const closestNode = unvisitedNodes.shift();
        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) return;
        closestNode.isVisited = true;
        document.getElementById(`cell-${closestNode.row}-${closestNode.col}`).classList.add('visited');
        await sleep(10);
        if (closestNode === endNode) {
            await drawPath();
            return;
        }
        updateUnvisitedNeighbors(closestNode);
    }
}

function sortNodesByDistance(nodes) {
    nodes.sort((a, b) => a.distance - b.distance);
}

function updateUnvisitedNeighbors(node) {
    const neighbors = getNeighbors(node);
    for (const neighbor of neighbors) {
        neighbor.distance = node.distance + 1;
        neighbor.previousNode = node;
    }
}

function getNeighbors(node) {
    const neighbors = [];
    const { row, col } = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < COLS - 1) neighbors.push(grid[row][col + 1]);
    return neighbors.filter(neighbor => !neighbor.isVisited);
}

function getAllNodes() {
    const nodes = [];
    for (const row of grid) {
        for (const node of row) {
            nodes.push(node);
        }
    }
    return nodes;
}

async function drawPath() {
    let currentNode = endNode;
    while (currentNode !== null) {
        document.getElementById(`cell-${currentNode.row}-${currentNode.col}`).classList.add('path');
        await sleep(50);
        currentNode = currentNode.previousNode;
    }
}

async function aStar() {
    const openSet = [startNode];
    startNode.distance = 0;
    startNode.heuristic = heuristic(startNode, endNode);

    while (openSet.length) {
        sortNodesByHeuristic(openSet);
        const currentNode = openSet.shift();
        if (currentNode.isWall) continue;
        if (currentNode.distance === Infinity) return;
        currentNode.isVisited = true;
        document.getElementById(`cell-${currentNode.row}-${currentNode.col}`).classList.add('visited');
        await sleep(10);
        if (currentNode === endNode) {
            await drawPath();
            return;
        }
        const neighbors = getNeighbors(currentNode);
        for (const neighbor of neighbors) {
            const tentativeDistance = currentNode.distance + 1;
            if (tentativeDistance < neighbor.distance) {
                neighbor.distance = tentativeDistance;
                neighbor.heuristic = neighbor.distance + heuristic(neighbor, endNode);
                neighbor.previousNode = currentNode;
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
}

function heuristic(node, endNode) {
    const dx = Math.abs(node.row - endNode.row);
    const dy = Math.abs(node.col - endNode.col);
    return dx + dy;
}

function sortNodesByHeuristic(nodes) {
    nodes.sort((a, b) => a.heuristic - b.heuristic);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

createGrid();

startButton.addEventListener('click', visualizePath);
clearButton.addEventListener('click', clearGrid);
gridContainer.addEventListener('mousedown', e => e.preventDefault());
