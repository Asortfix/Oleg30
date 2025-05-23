// Photo reveal counter UI
let photoCounterDiv = document.createElement('div');
photoCounterDiv.style.position = 'absolute';
photoCounterDiv.style.top = '10px';
photoCounterDiv.style.right = '10px';
photoCounterDiv.style.fontFamily = 'sans-serif';
photoCounterDiv.style.fontSize = '24px';
photoCounterDiv.style.color = '#fff';
photoCounterDiv.style.textShadow = '1px 1px 2px #000';
photoCounterDiv.style.zIndex = '10';
photoCounterDiv.textContent = 'Photos: 0/0';
document.body.appendChild(photoCounterDiv);

function updatePhotoCounter() {
  const total = photoWalls.length;
  const revealed = photoWalls.filter(w => w.userData.revealed).length;
  photoCounterDiv.textContent = `Photos: ${revealed}/${total}`;
}
// Helper: find nearest photo wall within distance
function getNearestPhotoWall(maxDist = 2.5) {
  if (!model) return null;
  let nearest = null;
  let minDist = maxDist;
  for (const wall of photoWalls) {
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
let isDragging = false;
let lastMouseX = 0, lastMouseY = 0;


// Maze map (1 = wall, 0 = path)
// Example 15x10 maze (you can expand this to match your image more closely)
const mazeMap = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1],
  [1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
  [1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1],
  [1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1],
  [1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
const mazeRows = mazeMap.length;
const mazeCols = mazeMap[0].length;
const mazeTileSize = 2;

let doors = [];
const doorWidth = 1.5;
const doorHeight = 2.5;
const doorDepth = 0.2;

// UI for door action

let doorActionDiv = document.createElement('div');
doorActionDiv.style.position = 'absolute';
doorActionDiv.style.top = '50%';
doorActionDiv.style.left = '50%';
doorActionDiv.style.transform = 'translate(-50%, -50%)';
doorActionDiv.style.padding = '16px 32px';
doorActionDiv.style.background = 'rgba(0,0,0,0.7)';
doorActionDiv.style.color = '#fff';
doorActionDiv.style.fontSize = '2em';
doorActionDiv.style.display = 'none';
doorActionDiv.style.zIndex = '10';
doorActionDiv.innerText = 'Press F to open the door';
document.body.appendChild(doorActionDiv);

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
photoWallActionDiv.innerText = 'Press F to reveal photo';
document.body.appendChild(photoWallActionDiv);

// Store special photo walls for interaction
let photoWalls = [];


function addMaze() {
  // Reset photoWalls for new maze
  photoWalls.length = 0;
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
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  // let photoTextures = [];
  // let photoFiles = [];
  // let photoIndex = 0;
  const questionTexture = new THREE.TextureLoader().load('/photos/question.png');

  // Get photo file names from the workspace (preliminary, static list)
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
    "photo_2025-05-23_21-34-40.jpg"
  ];
  let photoTextures = photoFileNames.map(f => {
    const tex = new THREE.TextureLoader().load('/photos/' + f);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  });
  let photoIndex = 0;

  // Only build walls after textures are loaded
  for (let row = 0; row < mazeRows; row++) {
    for (let col = 0; col < mazeCols; col++) {
      if (mazeMap[row][col] === 1) {
        // Only horizontal walls (let's say those with even row or col)
        let isPhotoWall = false;
        let photoTex = null;
        let origPhotoIndex = null;
        if (photoTextures.length > 0 && Math.random() < 0.3 && (row % 2 === 0 || col % 2 === 0)) {
          isPhotoWall = true;
          origPhotoIndex = photoIndex % photoTextures.length;
          photoTex = photoTextures[origPhotoIndex];
          photoIndex++;
        }
        let mat;
        if (isPhotoWall) {
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
          wall.userData.revealed = false;
          wall.userData.photoTexture = photoTex;
          photoWalls.push(wall);
          updatePhotoCounter();
        }
      }
    }
  }
  updatePhotoCounter();
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
  const dx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
  const dy = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
  camOrbitAngle -= dx * 0.01;
  camOrbitVAngle -= dy * 0.01;
});


// Disable zooming with mouse wheel
// Set camera to maximum close by default
camOrbitRadius = 2;

scene.add(new THREE.HemisphereLight(0xffffee, 0x444444, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

addMaze();

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

const moveSpeed = 3;

// Загрузка модели
new GLTFLoader().load('/OlegRunning.glb', gltf => {
  model = gltf.scene;
  scene.add(model);

  const bbox = new THREE.Box3().setFromObject(model);
  const modelMinY = bbox.min.y;
  groundY = -modelMinY;
  model.position.y = groundY;
  model.rotation.y = modelBaseRotation;

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

  // Door open action
  if (e.code === 'KeyF' && doorActionDiv.style.display === 'block' && nearestDoor) {
    openDoor(nearestDoor);
    doorActionDiv.style.display = 'none';
  }

  // Photo wall reveal action
  if (e.code === 'KeyF' && photoWallActionDiv.style.display === 'block' && nearestPhotoWall) {
    if (!nearestPhotoWall.userData.revealed) {
      nearestPhotoWall.material.map = nearestPhotoWall.userData.photoTexture;
      nearestPhotoWall.material.needsUpdate = true;
      nearestPhotoWall.userData.revealed = true;
      photoWallActionDiv.style.display = 'none';
      updatePhotoCounter();
    }
  }
});

window.addEventListener('keyup', e => {
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
let nearestDoor = null;
let nearestPhotoWall = null;
function checkDoorProximity() {
  doorActionDiv.style.display = 'none';
  // Photo wall proximity
  nearestPhotoWall = getNearestPhotoWall();
  if (nearestPhotoWall) {
    photoWallActionDiv.style.display = 'block';
  } else {
    photoWallActionDiv.style.display = 'none';
  }
}
function openDoor(door) {}

let coins = [];
let score = 0;

// Создание монет
function addCoins(count = 10) {
  const coinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32);
  const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.3 });

  for (let i = 0; i < count; i++) {
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.rotation.x = Math.PI / 2;
    // Случайная позиция на полу
    coin.position.x = (Math.floor(Math.random() * 18) - 9) + 0.5;
    coin.position.z = (Math.floor(Math.random() * 18) - 9) + 0.5;
    coin.position.y = 0.15;
    scene.add(coin);
    coins.push(coin);
  }
}

// Проверка сбора монет
function checkCoinCollection() {
  if (!model) return;
  const playerPos = model.position;
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    const dist = playerPos.distanceTo(coin.position);
    if (dist < 0.5) {
      scene.remove(coin);
      coins.splice(i, 1);
      score++;
      document.getElementById('score').textContent = `Coins: ${score}`;
    }
  }
}


//addCoins(15); // Отключаем монеты для коридора

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  // Движение модели
  if (model && pressed.size > 0) {
    // Determine which direction(s) are currently pressed
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
    // Default to forward if something goes wrong
    if (angleOffset === null) angleOffset = 0;

    // Calculate intended next position
    const moveDir = new THREE.Vector3(0, 0, -1);
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), camOrbitAngle + angleOffset);
    moveDir.normalize();
    const nextPos = model.position.clone().add(moveDir.clone().multiplyScalar(mazeTileSize * 0.4));

    // Convert world position to maze grid
    const gridX = Math.round((nextPos.x + (mazeCols * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize);
    const gridZ = Math.round((nextPos.z + (mazeRows * mazeTileSize) / 2 - mazeTileSize / 2) / mazeTileSize);

    // Check for wall collision
    let canMove = true;
    if (
      gridZ >= 0 && gridZ < mazeRows &&
      gridX >= 0 && gridX < mazeCols &&
      mazeMap[gridZ][gridX] === 1
    ) {
      canMove = false;
    }

    // Always face the direction, even if can't move
    model.rotation.y = camOrbitAngle + angleOffset + modelBaseRotation;

    if (canMove) {
      moveDir.multiplyScalar(moveSpeed * delta);
      model.position.add(moveDir);
    }
  }

  // Прыжок
  if (model && isJumping) {
    velocityY += gravity * delta;
    model.position.y += velocityY * delta;

    if (model.position.y <= groundY) {
      model.position.y = groundY;
      velocityY = 0;
      isJumping = false;
    }
  }


  //checkCoinCollection(); // Отключаем монеты для коридора

  checkDoorProximity();

  // Камера следует за мышью
  updateCameraPosition();
  renderer.render(scene, camera);
}
animate();

// Шахматный пол
function addChessFloor(tileSize = 1, tilesX = 20, tilesZ = 20) {
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

  for (let x = -tilesX / 2; x < tilesX / 2; x++) {
    for (let z = -tilesZ / 2; z < tilesZ / 2; z++) {
      const isWhite = (x + z) % 2 === 0;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(tileSize, 0.05, tileSize),
        isWhite ? whiteMat : blackMat
      );
      tile.position.set(x * tileSize, 0, z * tileSize);
      scene.add(tile);
    }
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Camera auto-follow: smoothly rotate camera to stay behind the character
  if (model && pressed.size > 0) {
    // moveAngle is set to the direction of movement
    // Smoothly interpolate camOrbitAngle towards moveAngle
    const lerpSpeed = 0.08; // adjust for smoothness
    let targetAngle = moveAngle;
    // Normalize angles to avoid sudden jumps
    let deltaAngle = targetAngle - camOrbitAngle;
    while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
    camOrbitAngle += deltaAngle * lerpSpeed;
  }
