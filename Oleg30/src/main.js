// --- START MENU UI ---
let gameStarted = false;
let menuStage = 0; // 0: greeting, 1: character, 2: game

// Hide all game UI until game starts
// Temporary stub, will be redefined after all UI elements are created
let setGameUIVisible = function(){};

// Create start menu overlay
const startMenuDiv = document.createElement('div');
startMenuDiv.id = 'start-menu';
startMenuDiv.style.position = 'fixed';
startMenuDiv.style.top = '0';
startMenuDiv.style.left = '0';
startMenuDiv.style.width = '100vw';
startMenuDiv.style.height = '100vh';
startMenuDiv.style.background = 'linear-gradient(rgba(0,0,0,0.85),rgba(0,0,0,0.85))';
startMenuDiv.style.display = 'flex';
startMenuDiv.style.flexDirection = 'column';
startMenuDiv.style.justifyContent = 'center';
startMenuDiv.style.alignItems = 'center';
startMenuDiv.style.zIndex = '1000';
startMenuDiv.innerHTML = `
  <img src="/photos/OlegOriginal.jpg" alt="OlegOriginal" style="max-width:80vw;max-height:80vh;border-radius:16px;box-shadow:0 0 32px #000;margin-bottom:32px;">
  <div style="color:#fff;font-size:2.5em;text-shadow:2px 2px 8px #000;margin-bottom:32px;">Хочешь попасть в игру?</div>
  <button id="menu-yes-btn" style="font-size:2em;padding:0.5em 2em;margin-bottom:16px;">ДА</button>
`;
document.body.appendChild(startMenuDiv);

// Second menu stage (character preview)
const charMenuDiv = document.createElement('div');
charMenuDiv.id = 'char-menu';
charMenuDiv.style.position = 'fixed';
charMenuDiv.style.top = '0';
charMenuDiv.style.left = '0';
charMenuDiv.style.width = '100vw';
charMenuDiv.style.height = '100vh';
charMenuDiv.style.background = 'linear-gradient(rgba(0,0,0,0.92),rgba(0,0,0,0.92))';
charMenuDiv.style.display = 'none';
charMenuDiv.style.flexDirection = 'column';
charMenuDiv.style.justifyContent = 'center';
charMenuDiv.style.alignItems = 'center';
charMenuDiv.style.zIndex = '1001';
charMenuDiv.innerHTML = `
  <div id="char-3d-container" style="width:340px;height:480px;background:rgba(0,0,0,0.2);border-radius:24px;margin-bottom:32px;box-shadow:0 0 32px #000;display:flex;align-items:center;justify-content:center;"></div>
  <button id="menu-start-btn" style="font-size:2em;padding:0.5em 2em;">Начать игру</button>
`;
document.body.appendChild(charMenuDiv);

// Minimap UI (created here for visibility control)
let minimapCanvas = document.createElement('canvas');
minimapCanvas.id = 'minimap';
minimapCanvas.width = 220;
minimapCanvas.height = 220;
minimapCanvas.style.position = 'absolute';
minimapCanvas.style.bottom = '10px';
minimapCanvas.style.left = '10px';
minimapCanvas.style.background = 'rgba(0,0,0,0.7)';
minimapCanvas.style.border = '2px solid #fff';
minimapCanvas.style.zIndex = '20';
document.body.appendChild(minimapCanvas);
const minimapCtx = minimapCanvas.getContext('2d');
// Minimap draw function
function drawMinimap() {
  const w = minimapCanvas.width, h = minimapCanvas.height;
  minimapCtx.clearRect(0, 0, w, h);
  // Draw maze
  const cellW = w / mazeCols;
  const cellH = h / mazeRows;
  for (let row = 0; row < mazeRows; row++) {
    for (let col = 0; col < mazeCols; col++) {
      if (mazeMap[row][col] === 1) {
        minimapCtx.fillStyle = '#222';
        minimapCtx.fillRect(col * cellW, row * cellH, cellW, cellH);
      } else {
        minimapCtx.fillStyle = '#eee';
        minimapCtx.fillRect(col * cellW, row * cellH, cellW, cellH);
      }
    }
  }
  
  // Draw photo walls (unrevealed: yellow, revealed: green)
  for (const wall of photoWalls) {
    const gridX = Math.round((wall.position.x + (mazeCols * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize);
    const gridZ = Math.round((wall.position.z + (mazeRows * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize);
    minimapCtx.fillStyle = wall.userData.revealed ? '#0f0' : '#ff0';
    minimapCtx.fillRect(gridX * cellW, gridZ * cellH, cellW, cellH);
  }
  
  // Draw video walls (unrevealed: purple, revealed: light purple)
  for (const wall of videoWalls) {
    const gridX = Math.round((wall.position.x + (mazeCols * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize);
    const gridZ = Math.round((wall.position.z + (mazeRows * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize);
    minimapCtx.fillStyle = wall.userData.revealed ? '#a020f0' : '#800080';
    minimapCtx.fillRect(gridX * cellW, gridZ * cellH, cellW, cellH);
  }
  
  // Draw Yanuk figure (blue dot)
  if (yanukFigure && !hasYanukDisk) {
    const yanukX = (yanukFigure.position.x + (mazeCols * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize;
    const yanukZ = (yanukFigure.position.z + (mazeRows * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize;
    minimapCtx.fillStyle = '#00f';
    minimapCtx.beginPath();
    minimapCtx.arc(yanukX * cellW + cellW/2, yanukZ * cellH + cellH/2, Math.max(2, cellW/2), 0, 2 * Math.PI);
    minimapCtx.fill();
  }
  
  // Draw player
  if (model) {
    const px = (model.position.x + (mazeCols * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize;
    const pz = (model.position.z + (mazeRows * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize;
    minimapCtx.fillStyle = '#f00';
    minimapCtx.beginPath();
    minimapCtx.arc(px * cellW + cellW/2, pz * cellH + cellH/2, Math.max(2, cellW/2), 0, 2 * Math.PI);
    minimapCtx.fill();
  }
}
let photoCounterDiv = document.createElement('div');
photoCounterDiv.style.position = 'absolute';
photoCounterDiv.style.top = '10px';
photoCounterDiv.style.right = '10px';
photoCounterDiv.style.fontFamily = 'sans-serif';
photoCounterDiv.style.fontSize = '24px';
photoCounterDiv.style.color = '#fff';
photoCounterDiv.style.textShadow = '1px 1px 2px #000';
photoCounterDiv.style.zIndex = '10';
photoCounterDiv.style.padding = '5px 10px';
photoCounterDiv.style.background = 'rgba(0,0,0,0.5)';
photoCounterDiv.style.borderRadius = '5px';
photoCounterDiv.textContent = 'Фотки: 0/0 | Видео: 0/0';
document.body.appendChild(photoCounterDiv);

// Add step counter UI
let stepCounterDiv = document.createElement('div');
stepCounterDiv.style.position = 'absolute';
stepCounterDiv.style.top = '10px';
stepCounterDiv.style.left = '10px';
stepCounterDiv.style.fontFamily = 'sans-serif';
stepCounterDiv.style.fontSize = '24px';
stepCounterDiv.style.color = '#fff';
stepCounterDiv.style.textShadow = '1px 1px 2px #000';
stepCounterDiv.style.zIndex = '10';
stepCounterDiv.style.padding = '5px 10px';
stepCounterDiv.style.background = 'rgba(0,0,0,0.5)';
stepCounterDiv.style.borderRadius = '5px';
stepCounterDiv.textContent = 'Шаги: 0';
document.body.appendChild(stepCounterDiv);

// Add sunglasses collection UI
// let sunglassesCounterDiv = document.createElement('div');
// sunglassesCounterDiv.style.position = 'absolute';
// sunglassesCounterDiv.style.top = '50px';
// sunglassesCounterDiv.style.left = '10px';
// sunglassesCounterDiv.style.fontFamily = 'sans-serif';
// sunglassesCounterDiv.style.fontSize = '24px';
// sunglassesCounterDiv.style.color = '#fff';
// sunglassesCounterDiv.style.textShadow = '1px 1px 2px #000';
// sunglassesCounterDiv.style.zIndex = '10';
// sunglassesCounterDiv.textContent = 'Sunglasses: 0/3';
// document.body.appendChild(sunglassesCounterDiv);

// Add collection UI
let collectionCounterDiv = document.createElement('div');
collectionCounterDiv.style.position = 'absolute';
collectionCounterDiv.style.top = '50px';
collectionCounterDiv.style.left = '10px';
collectionCounterDiv.style.fontFamily = 'sans-serif';
collectionCounterDiv.style.fontSize = '24px';
collectionCounterDiv.style.color = '#fff';
collectionCounterDiv.style.textShadow = '1px 1px 2px #000';
collectionCounterDiv.style.zIndex = '10';
collectionCounterDiv.style.display = 'none'; // Hidden initially
collectionCounterDiv.style.padding = '5px 10px';
collectionCounterDiv.style.background = 'rgba(0,0,0,0.5)';
collectionCounterDiv.style.borderRadius = '5px';
collectionCounterDiv.innerHTML = `
  <div>Диски: <span id="disk-count">0</span>/1</div>
`;
document.body.appendChild(collectionCounterDiv);

// Hide game UI initially (before redefining setGameUIVisible)
setGameUIVisible(false);

// Now that all UI elements are defined, redefine setGameUIVisible
setGameUIVisible = function(visible) {
  if (typeof minimapCanvas !== 'undefined' && minimapCanvas) minimapCanvas.style.display = visible ? '' : 'none';
  if (typeof photoCounterDiv !== 'undefined' && photoCounterDiv) photoCounterDiv.style.display = visible ? '' : 'none';
  if (typeof stepCounterDiv !== 'undefined' && stepCounterDiv) stepCounterDiv.style.display = visible ? '' : 'none';
  if (typeof collectionCounterDiv !== 'undefined' && collectionCounterDiv) collectionCounterDiv.style.display = hasCollectedAnyItem ? '' : 'none';
  if (typeof speechBubbleDiv !== 'undefined' && speechBubbleDiv) speechBubbleDiv.style.display = visible ? '' : 'none';
  if (typeof photoWallActionDiv !== 'undefined' && photoWallActionDiv) photoWallActionDiv.style.display = 'none';
  const scoreDiv = document.getElementById('score');
  if (scoreDiv) scoreDiv.style.display = visible ? '' : 'none';
};

// --- MENU LOGIC ---
// Stage 1: Greeting -> Stage 2: Character -> Stage 3: Game
const yesBtn = document.getElementById('menu-yes-btn');
const startBtn = document.getElementById('menu-start-btn');
if (yesBtn) {
  yesBtn.onclick = () => {
    // Animate out greeting, show char preview
    startMenuDiv.style.transition = 'opacity 1.2s cubic-bezier(0.4,0,0.2,1)';
    startMenuDiv.style.opacity = '0';
    setTimeout(() => {
      startMenuDiv.style.display = 'none';
      charMenuDiv.style.display = 'flex';
      charMenuDiv.style.opacity = '0';
      setTimeout(() => {
        charMenuDiv.style.transition = 'opacity 1.2s cubic-bezier(0.4,0,0.2,1)';
        charMenuDiv.style.opacity = '1';
      }, 10);
      // Show 3D character in char-3d-container
      showCharPreview();
    }, 1200);
  };
}
if (startBtn) {
  startBtn.onclick = () => {
    // Animate out char preview, start game
    charMenuDiv.style.transition = 'opacity 1.2s cubic-bezier(0.4,0,0.2,1)';
    charMenuDiv.style.opacity = '0';
    setTimeout(() => {
      charMenuDiv.style.display = 'none';
      setGameUIVisible(true);
      gameStarted = true;
      // Start main game logic
      startGame();
    }, 1200);
  };
}

// Show 3D character preview in menu
function showCharPreview() {
  // Use Three.js to render OlegRunning.glb in the char-3d-container
  if (window.charPreviewRenderer) return; // Only once
  const container = document.getElementById('char-3d-container');
  // Make container 2x bigger
  container.style.width = '680px';
  container.style.height = '960px';
  const previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  previewRenderer.setClearColor(0x000000, 0);
  previewRenderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(previewRenderer.domElement);
  window.charPreviewRenderer = previewRenderer;
  const previewScene = new THREE.Scene();
  const previewCamera = new THREE.PerspectiveCamera(50, container.clientWidth/container.clientHeight, 0.1, 100);
  previewCamera.position.set(0, 3, 8); // Move camera back for bigger model
  previewCamera.lookAt(0, 2, 0);
  previewScene.add(new THREE.HemisphereLight(0xffffee, 0x444444, 1));
  const loader = new GLTFLoader();
  loader.load('/Oleg2.glb', gltf => {
    const charModel = gltf.scene;
    charModel.position.set(0, 0, 0);
    charModel.scale.set(4, 4, 4); // 2x bigger than before
    previewScene.add(charModel);
    // Face the screen
    charModel.rotation.y = -Math.PI / 2;
    // Animate idle if available
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(charModel);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
      function animatePreview() {
        if (!window.charPreviewRenderer) return;
        mixer.update(0.016);
        previewRenderer.render(previewScene, previewCamera);
        requestAnimationFrame(animatePreview);
      }
      animatePreview();
    } else {
      previewRenderer.render(previewScene, previewCamera);
    }
  });
}

// Main game logic entry point
function startGame() {
  // All game logic that should only run after menu
  addMaze();
  // Model loading and animation already handled below, so just continue
}

function updatePhotoCounter() {
  const totalPhotos = photoWalls.length;
  const revealedPhotos = photoWalls.filter(w => w.userData.revealed).length;
  const totalVideos = videoWalls.length;
  const revealedVideos = videoWalls.filter(w => w.userData.revealed).length;
  photoCounterDiv.textContent = `Фотки: ${revealedPhotos}/${totalPhotos} | Видео: ${revealedVideos}/${totalVideos}`;
}
// Helper: find nearest media wall within distance
function getNearestMediaWall(maxDist = 2.5) {
  if (!model) return null;
  let nearest = null;
  let minDist = maxDist;
  
  // Check both photo and video walls
  for (const wall of [...photoWalls, ...videoWalls]) {
    if (wall.userData.revealed) continue;
    const dist = model.position.distanceTo(wall.position);
    if (dist < minDist) {
      minDist = dist;
      nearest = wall;
    }
  }
  return nearest;
}
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera orbit control variables
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
let camOrbitRadius = 5;
let camOrbitY = 2.5; // height above character
let camOrbitAngle = 0; // horizontal angle (radians)
let camOrbitVAngle = 0.2; // vertical angle (radians)

// Separate arrays for photos and videos
const videoFileNames = [
  "video_2025-05-23_22-28-15.mp4"
];

const photoFileNames = [
  "photo_2025-04-27_22-34-08.jpg",
  "photo_2025-04-27_22-35-22.jpg",
  "photo_2025-04-27_22-37-04 (2).jpg",
  "photo_2025-04-27_22-37-04.jpg",
  "photo_2025-04-27_22-38-19.jpg",
  "photo_2025-04-27_22-39-09.jpg",
  "photo_2025-04-27_22-39-24.jpg",
  "photo_2025-05-23_21-10-25 (2).jpg",
  "photo_2025-05-23_21-10-25 (3).jpg",
  "photo_2025-05-23_21-10-25 (4).jpg",
  "photo_2025-05-23_21-10-25 (5).jpg",
  "photo_2025-05-23_21-10-25 (6).jpg",
  "photo_2025-05-23_21-10-25 (7).jpg",
  "photo_2025-05-23_21-10-25 (8).jpg",
  "photo_2025-05-23_21-10-25.jpg",
  "photo_2025-05-23_21-10-26 (10).jpg",
  "photo_2025-05-23_21-10-26 (11).jpg",
  "photo_2025-05-23_21-10-26 (2).jpg",
  "photo_2025-05-23_21-10-26 (3).jpg",
  "photo_2025-05-23_21-10-26 (4).jpg",
  "photo_2025-05-23_21-10-26 (5).jpg",
  "photo_2025-05-23_21-10-26 (6).jpg",
  "photo_2025-05-23_21-10-26 (7).jpg",
  "photo_2025-05-23_21-10-26 (8).jpg",
  "photo_2025-05-23_21-10-26 (9).jpg",
  "photo_2025-05-23_21-10-26.jpg",
  "photo_2025-05-23_21-10-27 (2).jpg",
  "photo_2025-05-23_21-10-27 (3).jpg",
  "photo_2025-05-23_21-10-27 (4).jpg",
  "photo_2025-05-23_21-10-27 (5).jpg",
  "photo_2025-05-23_21-10-27 (6).jpg",
  "photo_2025-05-23_21-10-27.jpg",
  "photo_2025-05-23_21-16-35.jpg",
  "photo_2025-05-23_21-33-52 (2).jpg",
  "photo_2025-05-23_21-33-52.jpg",
  "photo_2025-05-23_21-34-21.jpg",
  "photo_2025-05-23_21-34-40.jpg",
  "photo_2025-05-23_21-36-20.jpg",
  "photo_2025-05-23_21-39-37.jpg",
  "photo_2025-05-23_22-24-13 (2).jpg",
  "photo_2025-05-23_22-24-13 (3).jpg",
  "photo_2025-05-23_22-24-13 (4).jpg",
  "photo_2025-05-23_22-24-13 (5).jpg",
  "photo_2025-05-23_22-24-13 (6).jpg",
  "photo_2025-05-23_22-24-13 (7).jpg",
  "photo_2025-05-23_22-24-13 (8).jpg",
  "photo_2025-05-23_22-24-13.jpg",
  "photo_2025-05-23_22-24-14 (2).jpg",
  "photo_2025-05-23_22-24-14 (3).jpg",
  "photo_2025-05-23_22-24-14 (4).jpg",
  "photo_2025-05-23_22-24-14 (5).jpg",
  "photo_2025-05-23_22-24-14 (6).jpg",
  "photo_2025-05-23_22-24-14 (7).jpg",
  "photo_2025-05-23_22-24-14 (8).jpg",
  "photo_2025-05-23_22-24-14 (9).jpg",
  "photo_2025-05-23_22-24-14.jpg",
  "photo_2025-05-23_22-24-24 (2).jpg",
  "photo_2025-05-23_22-24-24.jpg"
];

const mazeTileSize = 2;
// Original static maze
const baseMaze = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1],
  [1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
  [1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
  [1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,1,0,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
const baseRows = baseMaze.length;
const baseCols = baseMaze[0].length;
const scale = 2; // 2x2 blocks for both walls and corridors
const mazeRows = baseRows * scale;
const mazeCols = baseCols * scale;
// Expand each cell to a scale x scale block (2x2 for both walls and corridors)
let mazeMap = Array.from({ length: mazeRows }, () => Array(mazeCols).fill(1));
for (let r = 0; r < baseRows; r++) {
  for (let c = 0; c < baseCols; c++) {
    for (let dr = 0; dr < scale; dr++) {
      for (let dc = 0; dc < scale; dc++) {
        mazeMap[r * scale + dr][c * scale + dc] = baseMaze[r][c];
      }
    }
  }
}

// UI for photo wall action
let photoWallActionDiv = document.createElement('div');
photoWallActionDiv.style.position = 'absolute';
photoWallActionDiv.style.top = '55%';
photoWallActionDiv.style.left = '50%';
photoWallActionDiv.style.transform = 'translate(-50%, -50%)';
photoWallActionDiv.style.padding = '16px 32px';
photoWallActionDiv.style.background = 'rgba(0,0,0,0.7)';
photoWallActionDiv.style.color = '#fff';
photoWallActionDiv.style.fontSize = '2em';
photoWallActionDiv.style.display = 'none';
photoWallActionDiv.style.zIndex = '10';
photoWallActionDiv.innerText = 'Нажми F чтобы увидеть фотку';
document.body.appendChild(photoWallActionDiv);

// Store special photo walls for interaction
let photoWalls = [];

// Store video walls separately
let videoWalls = [];

let hasCollectedAnyItem = false;

// Store collectible items
let diskItems = [];
let collectedDisks = 0;

function addMaze() {
  // Reset photoWalls and videoWalls for new maze
  photoWalls.length = 0;
  videoWalls.length = 0;
  // Floor
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  for (let row = 0; row < mazeRows; row++) {
    for (let col = 0; col < mazeCols; col++) {
      const isWhite = (row + col) % 2 === 0;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(mazeTileSize, 0.05, mazeTileSize),
        isWhite ? whiteMat : blackMat
      );
      tile.position.set(
        (col - mazeCols / 2) * mazeTileSize + mazeTileSize / 2,
        0,
        (row - mazeRows / 2) * mazeTileSize + mazeTileSize / 2
      );
      scene.add(tile);
    }
  }

  // Walls with optional photo textures (hidden by question.png)
  const wallTexture = new THREE.TextureLoader().load('/photos/wall.png');
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(2, 2); // Adjust texture tiling
  const wallMat = new THREE.MeshStandardMaterial({ 
    map: wallTexture,
    roughness: 0.7,
    metalness: 0.1
  });
  const questionTexture = new THREE.TextureLoader().load('/photos/question.png');
  let photoTextures = photoFileNames.map(f => {
    const tex = new THREE.TextureLoader().load('/photos/' + f);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  });

  // Find all eligible wall positions (including outer walls)
  let eligiblePhotoWalls = [];
  let eligibleVideoWalls = [];
  for (let row = 0; row < mazeRows; row++) {
    for (let col = 0; col < mazeCols; col++) {
      // Check if this is a wall block
      if (mazeMap[row][col] === 1) {
        // Check if it's accessible from at least one side
        let isAccessible = false;
        
        // Check all four directions
        const directions = [
          {dr: -1, dc: 0}, // up
          {dr: 1, dc: 0},  // down
          {dr: 0, dc: -1}, // left
          {dr: 0, dc: 1}   // right
        ];
        
        for (const dir of directions) {
          const newRow = row + dir.dr;
          const newCol = col + dir.dc;
          
          // Check if the adjacent position is within bounds and is a path
          if (newRow >= 0 && newRow < mazeRows && 
              newCol >= 0 && newCol < mazeCols && 
              mazeMap[newRow][newCol] === 0) {
            isAccessible = true;
            break;
          }
        }
        
        if (isAccessible) {
          eligiblePhotoWalls.push({ row, col });
          eligibleVideoWalls.push({ row, col });
        }
      }
    }
  }

  // Shuffle and pick positions for photos and videos
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
  eligiblePhotoWalls = shuffle(eligiblePhotoWalls);
  eligibleVideoWalls = shuffle(eligibleVideoWalls);
  
  const selectedPhotoWalls = eligiblePhotoWalls.slice(0, photoFileNames.length);
  const selectedVideoWalls = eligibleVideoWalls.slice(0, videoFileNames.length);

  // Map for quick lookup
  const photoWallMap = new Map();
  const videoWallMap = new Map();
  
  selectedPhotoWalls.forEach((pos, i) => {
    photoWallMap.set(`${pos.row},${pos.col}`, i);
  });
  
  selectedVideoWalls.forEach((pos, i) => {
    videoWallMap.set(`${pos.row},${pos.col}`, i);
  });

  // Build walls
  for (let row = 0; row < mazeRows; row++) {
    for (let col = 0; col < mazeCols; col++) {
      if (mazeMap[row][col] === 1) {
        let isPhotoWall = false;
        let isVideoWall = false;
        let photoTex = null;
        let videoPath = null;
        
        let photoIdx = photoWallMap.get(`${row},${col}`);
        let videoIdx = videoWallMap.get(`${row},${col}`);
        
        if (photoIdx !== undefined) {
          isPhotoWall = true;
          photoTex = new THREE.TextureLoader().load('/photos/' + photoFileNames[photoIdx]);
        } else if (videoIdx !== undefined) {
          isVideoWall = true;
          videoPath = '/videos/' + videoFileNames[videoIdx];
        }
        
        let mat;
        if (isPhotoWall || isVideoWall) {
          mat = new THREE.MeshStandardMaterial({ map: questionTexture });
        } else {
          mat = wallMat;
        }
        
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(mazeTileSize, 2.5, mazeTileSize),
          mat
        );
        wall.position.set(
          (col - mazeCols / 2) * mazeTileSize + mazeTileSize / 2,
          1.25,
          (row - mazeRows / 2) * mazeTileSize + mazeTileSize / 2
        );
        scene.add(wall);
        
        if (isPhotoWall) {
          wall.userData.isPhotoWall = true;
          wall.userData.isVideoWall = false;
          wall.userData.revealed = false;
          wall.userData.mediaPath = '/photos/' + photoFileNames[photoIdx];
          photoWalls.push(wall);
        } else if (isVideoWall) {
          wall.userData.isPhotoWall = false;
          wall.userData.isVideoWall = true;
          wall.userData.revealed = false;
          wall.userData.mediaPath = videoPath;
          videoWalls.push(wall);
        }
      }
    }
  }
  updatePhotoCounter();

  // Place collectibles after maze is created
  placeCollectibles();

  // Place Yanuk after maze is created
  placeYanuk();
}

function addDoors() {
  for (let i = doorInterval; i < corridorLength; i += doorInterval) {
    const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x663300 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, doorHeight/2, -i);
    door.userData.isOpen = false;
    scene.add(door);
    doors.push(door);
  }
}

function updateCameraPosition() {
  if (!model) return;
  // Clamp vertical angle
  camOrbitVAngle = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, camOrbitVAngle));
  // Calculate camera position in spherical coordinates
  const x = model.position.x + camOrbitRadius * Math.sin(camOrbitAngle) * Math.cos(camOrbitVAngle);
  const z = model.position.z + camOrbitRadius * Math.cos(camOrbitAngle) * Math.cos(camOrbitVAngle);
  const y = model.position.y + camOrbitY + camOrbitRadius * Math.sin(camOrbitVAngle);
  camera.position.set(x, y, z);
  camera.lookAt(model.position.x, model.position.y + 1, model.position.z);
}

// Camera always rotates with mouse movement (no click needed)
window.addEventListener('mousemove', (e) => {
  if (!gameStarted) return;
  const dx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
  const dy = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
  camOrbitAngle -= dx * 0.01;
  camOrbitVAngle -= dy * 0.01;
});

scene.add(new THREE.HemisphereLight(0xffffee, 0x444444, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Only start animation/game loop after menu
function mainAnimate() {
  requestAnimationFrame(mainAnimate);
  // Only run game logic if gameStarted
  if (!gameStarted) {
    // Render char preview if visible (handled in showCharPreview)
    return;
  }
  gameLoop();
}
mainAnimate();

// Single game loop for all in-game logic and rendering
function gameLoop() {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  // Movement (classic: WASD/arrow keys, camera follows, smooth)
  if (model && pressed.size > 0) {
    const up = pressed.has('ArrowUp');
    const down = pressed.has('ArrowDown');
    const left = pressed.has('ArrowLeft');
    const right = pressed.has('ArrowRight');
    let angleOffset = null;
    if (up && !down && !left && !right) angleOffset = 0;
    else if (down && !up && !left && !right) angleOffset = Math.PI;
    else if (left && !right && !up && !down) angleOffset = Math.PI / 2;
    else if (right && !left && !up && !down) angleOffset = -Math.PI / 2;
    else if (up && left && !right && !down) angleOffset = Math.PI / 4;
    else if (up && right && !left && !down) angleOffset = -Math.PI / 4;
    else if (down && left && !right && !up) angleOffset = (3 * Math.PI) / 4;
    else if (down && right && !left && !up) angleOffset = (-3 * Math.PI) / 4;
    if (angleOffset === null) angleOffset = 0;
    moveAngle = camOrbitAngle + angleOffset;
    const moveDir = new THREE.Vector3(0, 0, -1);
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), moveAngle);
    moveDir.normalize();
    const nextPos = model.position.clone().add(moveDir.clone().multiplyScalar(mazeTileSize * 0.4));
    const gridX = Math.round((nextPos.x + (mazeCols * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize);
    const gridZ = Math.round((nextPos.z + (mazeRows * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize);
    let canMove = true;
    if (
      gridZ >= 0 && gridZ < mazeRows &&
      gridX >= 0 && gridX < mazeCols &&
      mazeMap[gridZ][gridX] === 1
    ) {
      canMove = false;
    }
    model.rotation.y = moveAngle + modelBaseRotation;
    if (canMove) {
      moveDir.multiplyScalar(moveSpeed * delta);
      model.position.add(moveDir);
      
      // Check if moved enough to count as a step
      const distanceMoved = model.position.distanceTo(lastStepPosition);
      if (distanceMoved >= mazeTileSize * 0.5) { // Count a step after moving half a tile
        stepCount++;
        stepCounterDiv.textContent = `Steps: ${stepCount}`;
        lastStepPosition.copy(model.position);
        
        // Show messages at specific intervals
        if (stepCount % 500 === 0) {
          // Show drink message every 500 steps
          const drinkMessage = messages.drink[Math.floor(Math.random() * messages.drink.length)];
          showMessage(drinkMessage);
        } else if (stepCount % 100 === 0) {
          // Show regular message every 100 steps
          const regularMessage = messages.regular[Math.floor(Math.random() * messages.regular.length)];
          showMessage(regularMessage);
        }
      }
    }
  }

  // Jump
  if (model && isJumping) {
    velocityY += gravity * delta;
    model.position.y += velocityY * delta;
    if (model.position.y <= groundY) {
      model.position.y = groundY;
      velocityY = 0;
      isJumping = false;
    }
  }

  // Proximity checks
  checkDoorProximity();

  // Camera
  updateCameraPosition();
  renderer.render(scene, camera);

  // Minimap
  drawMinimap();

  // Update speech bubble position
  updateSpeechBubble();

  // Check for item collection
  checkItemCollection();

  // Check Yanuk proximity
  if (yanukFigure && !hasYanukDisk) {
    const distance = model.position.distanceTo(yanukFigure.position);
    isNearYanuk = distance < 2.5;
    yanukProximityDiv.style.display = isNearYanuk ? 'block' : 'none';
    // Hide action dialog when not near
    if (!isNearYanuk) {
      yanukActionDiv.style.display = 'none';
    }
  }
}

let model, mixer;
let runAction, currentAction;
const clock = new THREE.Clock();
const pressed = new Set();

const modelBaseRotation = Math.PI / 2; // модель изначально "смотрит вправо"
let moveAngle = 0;

let isJumping = false;
let velocityY = 0;
const gravity = -20;
const jumpPower = 7;
let groundY = 0;

const baseMoveSpeed = 3;
const sprintMoveSpeed = 7;
let moveSpeed = baseMoveSpeed;

// Add step counter variable
let stepCount = 0;
let lastStepPosition = new THREE.Vector3();

// Загрузка модели
new GLTFLoader().load('/OlegRunning.glb', gltf => {
  model = gltf.scene;
  // Increase model scale by 1.5x
  model.scale.set(1.5, 1.5, 1.5);
  scene.add(model);

  const bbox = new THREE.Box3().setFromObject(model);
  const modelMinY = bbox.min.y;
  groundY = -modelMinY;
  model.position.y = groundY;
  model.rotation.y = modelBaseRotation;
  lastStepPosition.copy(model.position);

  mixer = new THREE.AnimationMixer(model);

  console.log('Available animations:');
  gltf.animations.forEach((clip, i) => {
    console.log(`[${i}] ${clip.name}`);
  });

  if (gltf.animations.length > 0) {
    runAction = mixer.clipAction(gltf.animations[0]);
    runAction.loop = THREE.LoopRepeat;
  } else {
    console.warn('⚠️ No animations found!');
  }
});

function switchToRun(play) {
  if (!runAction) return;
  if (play && currentAction !== runAction) {
    runAction.reset().fadeIn(0.2).play();
    currentAction = runAction;
  } else if (!play && currentAction === runAction) {
    runAction.fadeOut(0.2);
    currentAction = null;
  }
}

// Обработка клавиш
window.addEventListener('keydown', e => {
  // Sprint run
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    moveSpeed = sprintMoveSpeed;
  }
  if (!model) return;

  // Support both arrows and WASD
  let code = e.code;
  if (code === 'KeyW') code = 'ArrowUp';
  if (code === 'KeyS') code = 'ArrowDown';
  if (code === 'KeyA') code = 'ArrowLeft';
  if (code === 'KeyD') code = 'ArrowRight';

  // Diagonal movement support
  const up = pressed.has('ArrowUp') || code === 'ArrowUp';
  const down = pressed.has('ArrowDown') || code === 'ArrowDown';
  const left = pressed.has('ArrowLeft') || code === 'ArrowLeft';
  const right = pressed.has('ArrowRight') || code === 'ArrowRight';

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) {
    pressed.add(code);
    let angleOffset = null;
    if (up && !down && !left && !right) angleOffset = 0;
    else if (down && !up && !left && !right) angleOffset = Math.PI;
    else if (left && !right && !up && !down) angleOffset = Math.PI / 2;
    else if (right && !left && !up && !down) angleOffset = -Math.PI / 2;
    else if (up && left && !right && !down) angleOffset = Math.PI / 4;
    else if (up && right && !left && !down) angleOffset = -Math.PI / 4;
    else if (down && left && !right && !up) angleOffset = (3 * Math.PI) / 4;
    else if (down && right && !left && !up) angleOffset = (-3 * Math.PI) / 4;
    // Default to forward if something goes wrong
    if (angleOffset === null) angleOffset = 0;
    moveAngle = camOrbitAngle + angleOffset;
    model.rotation.y = moveAngle + modelBaseRotation;
    switchToRun(true);
  }

  if (e.code === "Space" && !isJumping) {
    isJumping = true;
    velocityY = jumpPower;
  }

  // Photo/video wall reveal action
  if (e.code === 'KeyF') {
    if (currentRevealedPhoto) {
      hideFullSizePhoto();
    } else if (currentPlayingVideo) {
      hideFullSizeVideo();
    } else if (photoWallActionDiv.style.display === 'block' && nearestPhotoWall) {
      if (!nearestPhotoWall.userData.revealed) {
        // First reveal: show on wall
        nearestPhotoWall.material.map = new THREE.TextureLoader().load(nearestPhotoWall.userData.mediaPath);
        nearestPhotoWall.material.needsUpdate = true;
        nearestPhotoWall.userData.revealed = true;
        photoWallActionDiv.style.display = 'none';
        updatePhotoCounter();
        
        // Show full size based on media type
        if (nearestPhotoWall.userData.isVideoWall) {
          showFullSizeVideo(nearestPhotoWall.userData.mediaPath);
        } else {
          showFullSizePhoto(nearestPhotoWall.userData.mediaPath);
        }
      } else {
        // Already revealed: show full size again
        if (nearestPhotoWall.userData.isVideoWall) {
          showFullSizeVideo(nearestPhotoWall.userData.mediaPath);
        } else {
          showFullSizePhoto(nearestPhotoWall.userData.mediaPath);
        }
      }
    } else if (isNearYanuk && !hasYanukDisk) {
      yanukProximityDiv.style.display = 'none';
      setTimeout(() => {
        yanukActionDiv.style.display = 'block';
      }, 100);
    }
  }

  // Close full-size media with Escape key
  if (e.code === 'Escape') {
    if (currentRevealedPhoto) {
      hideFullSizePhoto();
    } else if (currentPlayingVideo) {
      hideFullSizeVideo();
    }
  }
});

window.addEventListener('keyup', e => {
  // Stop sprint
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    moveSpeed = baseMoveSpeed;
  }
  if (!model) return;

  // Support both arrows and WASD
  let code = e.code;
  if (code === 'KeyW') code = 'ArrowUp';
  if (code === 'KeyS') code = 'ArrowDown';
  if (code === 'KeyA') code = 'ArrowLeft';
  if (code === 'KeyD') code = 'ArrowRight';

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) {
    pressed.delete(code);
    if (pressed.size === 0) {
      switchToRun(false);
    }
  }
});

// Вычисление направления движения с учётом комбинации клавиш

// Door logic (not used in maze mode)
let nearestPhotoWall = null;
function checkDoorProximity() {
  nearestPhotoWall = getNearestMediaWall();
  if (nearestPhotoWall) {
    photoWallActionDiv.style.display = 'block';
    // Update action text based on media type
    if (nearestPhotoWall.userData.isVideoWall) {
      photoWallActionDiv.innerText = 'Нажми F чтобы посмотреть видео';
    } else {
      photoWallActionDiv.innerText = 'Нажми F чтобы увидеть фотку';
    }
  } else {
    photoWallActionDiv.style.display = 'none';
  }
}

// Add full-size photo view overlay
const fullSizePhotoDiv = document.createElement('div');
fullSizePhotoDiv.id = 'full-size-photo';
fullSizePhotoDiv.style.position = 'fixed';
fullSizePhotoDiv.style.top = '0';
fullSizePhotoDiv.style.left = '0';
fullSizePhotoDiv.style.width = '100vw';
fullSizePhotoDiv.style.height = '100vh';
fullSizePhotoDiv.style.background = 'rgba(0,0,0,0.7)';
fullSizePhotoDiv.style.display = 'none';
fullSizePhotoDiv.style.zIndex = '2000';
fullSizePhotoDiv.style.justifyContent = 'center';
fullSizePhotoDiv.style.alignItems = 'center';
fullSizePhotoDiv.innerHTML = `
  <div style="background:white;padding:20px;border-radius:10px;box-shadow:0 0 20px rgba(0,0,0,0.5);">
    <img id="full-size-photo-img" style="max-width:70vw;max-height:70vh;object-fit:contain;display:block;">
  </div>
`;
document.body.appendChild(fullSizePhotoDiv);

// Store the currently revealed photo
let currentRevealedPhoto = null;

// Function to show full-size photo
function showFullSizePhoto(photoPath) {
  const img = document.getElementById('full-size-photo-img');
  img.src = photoPath;
  fullSizePhotoDiv.style.display = 'flex';
  currentRevealedPhoto = photoPath;
}

// Function to hide full-size photo
function hideFullSizePhoto() {
  fullSizePhotoDiv.style.display = 'none';
  currentRevealedPhoto = null;
}

// Add click handler to close full-size photo
fullSizePhotoDiv.addEventListener('click', (e) => {
  // Only close if clicking the background, not the image
  if (e.target === fullSizePhotoDiv) {
    hideFullSizePhoto();
  }
});

// Add speech bubble UI
let speechBubbleDiv = document.createElement('div');
speechBubbleDiv.style.position = 'absolute';
speechBubbleDiv.style.padding = '10px 20px';
speechBubbleDiv.style.background = 'rgba(255, 255, 255, 0.9)';
speechBubbleDiv.style.borderRadius = '15px';
speechBubbleDiv.style.color = '#000';
speechBubbleDiv.style.fontSize = '18px';
speechBubbleDiv.style.fontFamily = 'sans-serif';
speechBubbleDiv.style.display = 'none';
speechBubbleDiv.style.zIndex = '1000';
speechBubbleDiv.style.textAlign = 'center';
speechBubbleDiv.style.maxWidth = '300px';
speechBubbleDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
document.body.appendChild(speechBubbleDiv);

// Messages for different step intervals
const messages = {
  regular: [
    "Где я? Что это за место?",
    "Я должен найти выход отсюда...",
    "Столько фотографий... Что они означают?",
    "Почему я здесь?",
    "Нужно осмотреться получше",
    "Интересно, есть ли здесь другие люди?",
    "Я устал... Но нужно идти дальше",
    "Странное место...",
    "Должно быть, здесь есть подсказки",
    "Я заперт в этой игре..."
  ],
  drink: [
    "СРОЧНО НУЖНО ВЫПИТЬ!!!",
    "НЕМЕДЛЕННО ТРЕБУЕТСЯ ВОДКА!!!",
    "ПОМОГИТЕ, МНЕ СРОЧНО НУЖНО ВЫПИТЬ!!!",
    "Я УМРУ БЕЗ ВОДКИ ПРЯМО СЕЙЧАС!!!",
    "ВЫПИТЬ НУЖНО НЕМЕДЛЕННО!!!"
  ]
};

let lastMessageStep = 0;
let messageTimeout = null;

function showMessage(message) {
  speechBubbleDiv.textContent = message;
  speechBubbleDiv.style.display = 'block';
  
  // Clear any existing timeout
  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }
  
  // Hide message after 5 seconds
  messageTimeout = setTimeout(() => {
    speechBubbleDiv.style.display = 'none';
  }, 5000);
}

function updateSpeechBubble() {
  if (!model) return;

  // Convert 3D position to screen coordinates
  const vector = model.position.clone();
  vector.y += 3; // Position above character's head
  vector.project(camera);
  
  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
  
  speechBubbleDiv.style.left = `${x - speechBubbleDiv.offsetWidth / 2}px`;
  speechBubbleDiv.style.top = `${y - 50}px`;
}

// Function to place collectibles in the maze
function placeCollectibles() {
  // Find all accessible positions
  let accessiblePositions = [];
  for (let row = 0; row < mazeRows; row++) {
    for (let col = 0; col < mazeCols; col++) {
      if (mazeMap[row][col] === 0) { // Only place on paths
        accessiblePositions.push({ row, col });
      }
    }
  }

  // Shuffle positions
  for (let i = accessiblePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [accessiblePositions[i], accessiblePositions[j]] = [accessiblePositions[j], accessiblePositions[i]];
  }
}

// Function to check for item collection
function checkItemCollection() {
  if (!model) return;
  
  // Check disk
  for (let i = diskItems.length - 1; i >= 0; i--) {
    const disk = diskItems[i];
    const distance = model.position.distanceTo(disk.position);
    
    if (distance < 1.5) {
      scene.remove(disk);
      diskItems.splice(i, 1);
      collectedDisks++;
      hasCollectedAnyItem = true;
      document.getElementById('disk-count').textContent = collectedDisks;
      collectionCounterDiv.style.display = '';
      showMessage("Нашел диск! Интересно, что на нем?");
    }
  }
}

// Add Yanuk interaction UI
let yanukActionDiv = document.createElement('div');
yanukActionDiv.style.position = 'absolute';
yanukActionDiv.style.top = '55%';
yanukActionDiv.style.left = '50%';
yanukActionDiv.style.transform = 'translate(-50%, -50%)';
yanukActionDiv.style.padding = '16px 32px';
yanukActionDiv.style.background = 'rgba(0,0,0,0.7)';
yanukActionDiv.style.color = '#fff';
yanukActionDiv.style.fontSize = '2em';
yanukActionDiv.style.display = 'none';
yanukActionDiv.style.zIndex = '10';
yanukActionDiv.innerHTML = `
  <div>Взять диск?</div>
  <div style="margin-top: 16px;">
    <button id="yanuk-yes" style="margin-right: 16px; padding: 8px 16px;">Да</button>
    <button id="yanuk-no" style="padding: 8px 16px;">Нет</button>
  </div>
`;
document.body.appendChild(yanukActionDiv);

// Add Yanuk proximity prompt
let yanukProximityDiv = document.createElement('div');
yanukProximityDiv.style.position = 'absolute';
yanukProximityDiv.style.top = '55%';
yanukProximityDiv.style.left = '50%';
yanukProximityDiv.style.transform = 'translate(-50%, -50%)';
yanukProximityDiv.style.padding = '16px 32px';
yanukProximityDiv.style.background = 'rgba(0,0,0,0.7)';
yanukProximityDiv.style.color = '#fff';
yanukProximityDiv.style.fontSize = '2em';
yanukProximityDiv.style.display = 'none';
yanukProximityDiv.style.zIndex = '10';
yanukProximityDiv.textContent = 'Нажмите F';
document.body.appendChild(yanukProximityDiv);

let yanukFigure = null;
let isNearYanuk = false;
let hasYanukDisk = false;

// Function to place Yanuk in a corridor
function placeYanuk() {
  // Find a corridor position in the bottom right area
  let found = false;
  let col = mazeCols - 2;
  let row = mazeRows - 2;
  
  // Search for a corridor position in the bottom right area
  while (!found && row > mazeRows / 2 && col > mazeCols / 2) {
    if (mazeMap[row][col] === 0) { // Check if it's a corridor
      found = true;
    } else {
      // Try moving left first
      col--;
      if (col <= mazeCols / 2) {
        // If we've gone too far left, move up and reset column
        col = mazeCols - 2;
        row--;
      }
    }
  }
  
  // If no corridor found in bottom right, search the entire bottom area
  if (!found) {
    row = mazeRows - 2;
    col = mazeCols - 2;
    while (!found && row > mazeRows / 2) {
      while (!found && col > 0) {
        if (mazeMap[row][col] === 0) {
          found = true;
        } else {
          col--;
        }
      }
      if (!found) {
        row--;
        col = mazeCols - 2;
      }
    }
  }
  
  // Convert grid position to world coordinates
  const x = (col - mazeCols / 2) * mazeTileSize + mazeTileSize / 2;
  const z = (row - mazeRows / 2) * mazeTileSize + mazeTileSize / 2;

  // Load Yanuk model
  new GLTFLoader().load('/yanuk.glb', gltf => {
    yanukFigure = gltf.scene;
    yanukFigure.position.set(x, 1, z); // Keep the height at 2.5
    yanukFigure.scale.set(1.5, 1.5, 1.5);
    yanukFigure.rotation.y = Math.PI; // Face towards the center of the maze
    
    // Add a point light to make it more visible
    const light = new THREE.PointLight(0x4444ff, 1, 5);
    light.position.set(0, 2, 0);
    yanukFigure.add(light);
    
    scene.add(yanukFigure);
  });
}

// Add Yanuk interaction handlers
document.getElementById('yanuk-yes').addEventListener('click', () => {
  yanukActionDiv.style.display = 'none';
  hasYanukDisk = true;
  
  // Animate Yanuk rising up before disappearing
  if (yanukFigure) {
    const startY = yanukFigure.position.y;
    const endY = startY + 5;
    const duration = 1000;
    const startTime = Date.now();
    
    function animateRise() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      yanukFigure.position.y = startY + (endY * progress);
      
      if (progress < 1) {
        requestAnimationFrame(animateRise);
      } else {
        scene.remove(yanukFigure);
        yanukFigure = null;
      }
    }
    
    animateRise();
  }
  
  // Update counter
  document.getElementById('disk-count').textContent = '1';
  collectionCounterDiv.style.display = '';
});

document.getElementById('yanuk-no').addEventListener('click', () => {
  yanukActionDiv.style.display = 'none';
  if (isNearYanuk) {
    yanukProximityDiv.style.display = 'block';
  }
});

// Add video player overlay
const videoPlayerDiv = document.createElement('div');
videoPlayerDiv.id = 'video-player';
videoPlayerDiv.style.position = 'fixed';
videoPlayerDiv.style.top = '0';
videoPlayerDiv.style.left = '0';
videoPlayerDiv.style.width = '100vw';
videoPlayerDiv.style.height = '100vh';
videoPlayerDiv.style.background = 'rgba(0,0,0,0.7)';
videoPlayerDiv.style.display = 'none';
videoPlayerDiv.style.zIndex = '2000';
videoPlayerDiv.style.justifyContent = 'center';
videoPlayerDiv.style.alignItems = 'center';
videoPlayerDiv.innerHTML = `
  <div style="background:black;padding:20px;border-radius:10px;box-shadow:0 0 20px rgba(0,0,0,0.5);">
    <video id="full-size-video" style="max-width:70vw;max-height:70vh;object-fit:contain;display:block;" controls>
      Your browser does not support the video tag.
    </video>
  </div>
`;
document.body.appendChild(videoPlayerDiv);

// Store the currently playing video
let currentPlayingVideo = null;

// Function to show full-size video
function showFullSizeVideo(videoPath) {
  const video = document.getElementById('full-size-video');
  video.src = videoPath;
  videoPlayerDiv.style.display = 'flex';
  currentPlayingVideo = videoPath;
  video.play();
}

// Function to hide full-size video
function hideFullSizeVideo() {
  const video = document.getElementById('full-size-video');
  video.pause();
  video.src = '';
  videoPlayerDiv.style.display = 'none';
  currentPlayingVideo = null;
}

// Add click handler to close video
videoPlayerDiv.addEventListener('click', (e) => {
  // Only close if clicking the background, not the video
  if (e.target === videoPlayerDiv) {
    hideFullSizeVideo();
  }
});
