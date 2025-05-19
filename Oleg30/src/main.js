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

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  camOrbitAngle -= dx * 0.01;
  camOrbitVAngle -= dy * 0.01;
});

// Optional: zoom with mouse wheel
canvas.addEventListener('wheel', (e) => {
  camOrbitRadius += e.deltaY * 0.01;
  camOrbitRadius = Math.max(2, Math.min(15, camOrbitRadius));
});

scene.add(new THREE.HemisphereLight(0xffffee, 0x444444, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

addChessFloor();

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

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    pressed.add(e.code);
    // Determine movement angle based on key and camera angle
    let angleOffset = 0;
    if (e.code === "ArrowUp") angleOffset = 0;
    else if (e.code === "ArrowDown") angleOffset = Math.PI;
    else if (e.code === "ArrowLeft") angleOffset = Math.PI / 2;
    else if (e.code === "ArrowRight") angleOffset = -Math.PI / 2;
    moveAngle = camOrbitAngle + angleOffset;
    model.rotation.y = moveAngle + modelBaseRotation;
    switchToRun(true);
  }

  if (e.code === "Space" && !isJumping) {
    isJumping = true;
    velocityY = jumpPower;
  }
});

window.addEventListener('keyup', e => {
  if (!model) return;

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    pressed.delete(e.code);
    if (pressed.size === 0) {
      switchToRun(false);
    } else {
      updateMovementDirection();
    }
  }
});

// Вычисление направления движения с учётом комбинации клавиш

// updateMovementDirection is no longer needed, movement is now based on camera angle

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

addCoins(15); // Добавить 15 монет

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  // Движение модели
  if (model && pressed.size > 0) {
    const moveDir = new THREE.Vector3(0, 0, -1);
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), moveAngle);
    moveDir.multiplyScalar(moveSpeed * delta);
    model.position.add(moveDir);
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

  checkCoinCollection(); // Проверка сбора монет

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
