/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- Global Variables ---
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let controls: PointerLockControls;
let cameraRig: THREE.Object3D; 

const objects: THREE.Mesh[] = [];
let raycaster: THREE.Raycaster; 
let avatarGroup: THREE.Group;

// Ghost
let ghostGroup: THREE.Group | null = null;
let ghostLabelElement: HTMLElement | null = null;
let trainingMode = true; 
let ghostPathIndex = 0;
let ghostSpeed = 35.0; 

// Waypoints
const ghostWaypoints = [
  new THREE.Vector3(0, 0, 0),     
  new THREE.Vector3(0, 0, -30),   
  new THREE.Vector3(0, 0, -60),   
  new THREE.Vector3(0, 0, -90),   
  new THREE.Vector3(0, 0, -120),  
  
  new THREE.Vector3(0, 0, -160),  
  new THREE.Vector3(-12, 0, -190), 
  new THREE.Vector3(0, 0, -220),   
  new THREE.Vector3(12, 0, -250),  
  
  new THREE.Vector3(0, 2, -290), 
  new THREE.Vector3(0, 4, -320),  
  new THREE.Vector3(0, 2, -350),  
  new THREE.Vector3(0, 0, -380),  

  new THREE.Vector3(0, 0, -430),  
  new THREE.Vector3(-20, 0, -470),
  new THREE.Vector3(0, 0, -510),  

  new THREE.Vector3(0, 0, -560),  
  new THREE.Vector3(0, 0, -600),  
  new THREE.Vector3(0, 5, -680)   
];

let leftLeg: THREE.Mesh, rightLeg: THREE.Mesh;
let leftArm: THREE.Mesh, rightArm: THREE.Mesh;
let earsGroup: THREE.Group;

let scoreElement: HTMLElement;
let livesElement: HTMLElement;
let hintElement: HTMLElement;
let instructionsElement: HTMLElement;
let blockerElement: HTMLElement;
let ghostLabelElementRef: HTMLElement;

// --- TIMING VARIABLES ---
let hintTimeout: any = null;

let currentScore = 0;
let maxDistance = 0;
let lives = 5;
const MAX_LIVES = 5;
let gameWon = false;
let isGameRunning = false;
let isScreenshotMode = false;

// Audio
let audioCtx: AudioContext | null = null;
let isMusicPlaying = false;
let nextNoteTime = 0;
let noteIndex = 0;
const melody = [
  261.63, 293.66, 329.63, 349.23, 392.00, 392.00, 440.00, 392.00, 
  329.63, 329.63, 293.66, 293.66, 261.63, 0, 261.63, 0            
];

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3(); 
const direction = new THREE.Vector3();
const startPosition = new THREE.Vector3(0, 10, 0);

// Physics
const GRAVITY = 600.0;     
const JUMP_FORCE = 350.0;  
const MOVE_SPEED = 400.0;  
const FRICTION = 20.0;     

const playerCollider = new THREE.Box3();
let winPlatform: THREE.Mesh;

// Levels
const levelData = [
  {
    color: 0x228b22, // Green
    platforms: [
      { pos: [0, 0, -30], scale: [25, 2, 25] }, 
      { pos: [0, 0, -60], scale: [25, 2, 25] }, 
      { pos: [0, 0, -90], scale: [25, 2, 25] }, 
      { pos: [0, 0, -120], scale: [25, 2, 25] },
    ],
  },
  {
    color: 0xffd700, // Yellow
    platforms: [
      { pos: [0, 0, -160], scale: [40, 2, 30] }, 
      { pos: [-12, 0, -190], scale: [40, 2, 30] }, 
      { pos: [0, 0, -220], scale: [40, 2, 30] },
      { pos: [12, 0, -250], scale: [40, 2, 30] },
    ],
  },
  {
    color: 0x00ffff, // Cyan
    platforms: [
      { pos: [0, 2, -290], scale: [30, 2, 30] }, 
      { pos: [0, 4, -320], scale: [30, 2, 30] }, 
      { pos: [0, 2, -350], scale: [30, 2, 30] },
      { pos: [0, 0, -380], scale: [30, 2, 30] },
    ],
  },
  {
    color: 0xff00ff, // Magenta
    platforms: [
      { pos: [0, 0, -430], scale: [50, 2, 40] },
      { pos: [-20, 0, -470], scale: [35, 2, 30] },
      { pos: [0, 0, -510], scale: [50, 2, 40] },
    ],
  },
  {
    color: 0xffa500, // Orange
    platforms: [
      { pos: [0, 0, -560], scale: [30, 2, 30] },
      { pos: [0, 0, -600], scale: [30, 2, 30] },
    ],
  },
];

init();
animate();

// --- TEXTURE ---
function createCheckerboardTexture(color1: string, color2: string) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color1; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = color2; const square = size / 4; 
  for(let y=0; y<4; y++) {
    for(let x=0; x<4; x++) {
      if ((x+y)%2 === 0) ctx.fillRect(x*square, y*square, square, square);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// --- MENU ---
function showMainMenu() {
    isGameRunning = false;
    blockerElement.style.display = 'flex';
    instructionsElement.style.display = 'flex';
    instructionsElement.innerHTML = '';
    
    const title = document.createElement('h1');
    title.innerText = gameWon ? "YOU WIN!" : (lives <= 0 ? "GAME OVER" : "LABUBU’S SKY HOP");
    title.style.fontSize = "48px"; title.style.margin = "0 0 20px 0";
    title.style.color = gameWon ? "#ffd700" : "#ffffff";
    instructionsElement.appendChild(title);

    const sub = document.createElement('p');
    sub.innerText = "Choose your mode:"; sub.style.color = "#ccc";
    instructionsElement.appendChild(sub);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'btn-container';

    const btnNormal = document.createElement('button');
    btnNormal.className = 'menu-btn'; btnNormal.innerText = "NORMAL MODE";
    btnNormal.onclick = () => startGame(false);

    const btnTrain = document.createElement('button');
    btnTrain.className = 'menu-btn primary'; btnTrain.innerText = "TRAINING MODE";
    btnTrain.onclick = () => startGame(true);

    btnContainer.appendChild(btnNormal); btnContainer.appendChild(btnTrain);
    instructionsElement.appendChild(btnContainer);
}

function startGame(training: boolean) {
    trainingMode = training;
    isGameRunning = true;
    gameWon = false;
    lives = MAX_LIVES;
    livesElement.innerText = lives.toString();
    currentScore = 0;
    maxDistance = 0; 
    scoreElement.innerText = "Score: 0";
    avatarGroup.position.copy(startPosition);
    velocity.set(0,0,0);
    
    if (ghostGroup) scene.remove(ghostGroup);
    if (trainingMode) {
        ghostGroup = createGhost();
        scene.add(ghostGroup);
        ghostGroup.position.copy(startPosition);
        ghostPathIndex = 0;
    } else {
        ghostGroup = null;
        if(ghostLabelElementRef) ghostLabelElementRef.style.display = 'none';
    }

    controls.lock();
    initAudio();
}

// --- GHOST ---
function createGhost(): THREE.Group {
  const group = new THREE.Group();
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 4, 8), ghostMat); body.position.y = 2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), ghostMat); head.position.y = 5;
  const ears = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4, 8), ghostMat); ears.position.set(-1.5, 7.5, 0); ears.rotation.z = 0.2;
  const ears2 = ears.clone(); ears2.position.set(1.5, 7.5, 0); ears2.rotation.z = -0.2;
  group.add(body, head, ears, ears2);
  return group;
}

function updateGhost(delta: number) {
  if (!ghostGroup || !trainingMode || !ghostLabelElementRef) return;
  const distToPlayer = ghostGroup.position.distanceTo(avatarGroup.position);
  if (distToPlayer > 60) { ghostLabelElementRef.style.display = 'none'; return; }

  const target = ghostWaypoints[ghostPathIndex];
  const dir = new THREE.Vector3().subVectors(target, ghostGroup.position);
  const dist = dir.length();
  const timeSeconds = (dist / ghostSpeed).toFixed(1);

  if (dist < 1.0) {
    ghostPathIndex++;
    if (ghostPathIndex >= ghostWaypoints.length) ghostPathIndex = ghostWaypoints.length - 1; 
  } else {
    dir.normalize();
    let keyString = "W + SPACE"; 
    const z = ghostGroup.position.z;
    if (z < -260 && z > -380) keyString = "HOLD SPACE! (Step Up)";
    else if (z <= -380 && z > -520) {
        const dx = target.x - ghostGroup.position.x;
        if (dx < -2) keyString = "TURN A + SPACE"; else if (dx > 2) keyString = "TURN D + SPACE"; else keyString = "CENTER + SPACE";
    } else {
        const dx = target.x - ghostGroup.position.x;
        if (Math.abs(dx) > 2) { if (dx < -1) keyString = "A + SPACE"; else keyString = "D + SPACE"; }
        if (parseFloat(timeSeconds) > 0.2) keyString += ` (${timeSeconds}s)`;
    }

    const labelPos = ghostGroup.position.clone(); labelPos.y += 10; labelPos.project(camera);
    if (labelPos.z > 1) { ghostLabelElementRef.style.display = 'none'; } else {
       const x = (labelPos.x * 0.5 + 0.5) * window.innerWidth;
       const y = (-(labelPos.y * 0.5) + 0.5) * window.innerHeight;
       ghostLabelElementRef.style.display = 'block';
       ghostLabelElementRef.style.left = `${x}px`; ghostLabelElementRef.style.top = `${y}px`;
       ghostLabelElementRef.innerText = keyString;
    }
    ghostGroup.position.add(dir.multiplyScalar(ghostSpeed * delta));
    const angle = Math.atan2(dir.x, dir.z);
    ghostGroup.rotation.y = angle + Math.PI; 
    ghostGroup.position.y = target.y + Math.abs(Math.sin(Date.now() / 200)) * 2;
  }
}

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  isMusicPlaying = true; nextNoteTime = audioCtx.currentTime;
}
function stopAudio() {
  isMusicPlaying = false;
  if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
}
function playMusicLoop() {
  if (!isMusicPlaying || !audioCtx || audioCtx.state !== 'running') return;
  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    const freq = melody[noteIndex];
    if (freq > 0) {
      const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
      osc.type = 'square'; osc.frequency.value = freq;
      osc.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.05, nextNoteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + 0.2);
      osc.start(nextNoteTime); osc.stop(nextNoteTime + 0.25);
    }
    nextNoteTime += 0.25; noteIndex = (noteIndex + 1) % melody.length;
  }
}

function createTree(x: number, y: number, z: number) {
  const trunkGeo = new THREE.CylinderGeometry(2, 2, 10, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, y + 5, z); trunk.castShadow = true; trunk.receiveShadow = true;
  const leavesGeo = new THREE.ConeGeometry(8, 20, 8);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.set(0, 10, 0); leaves.castShadow = true;
  trunk.add(leaves); scene.add(trunk);
}
function createCloud(x: number, y: number, z: number) {
  const cloudGroup = new THREE.Group();
  const cloudGeo = new THREE.SphereGeometry(10, 16, 16);
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const p1 = new THREE.Mesh(cloudGeo, cloudMat);
  const p2 = new THREE.Mesh(cloudGeo, cloudMat); p2.position.set(10, 2, 0); p2.scale.set(0.8, 0.8, 0.8);
  const p3 = new THREE.Mesh(cloudGeo, cloudMat); p3.position.set(-10, -2, 2); p3.scale.set(0.9, 0.9, 0.9);
  cloudGroup.add(p1, p2, p3); cloudGroup.position.set(x, y, z);
  scene.add(cloudGroup);
}

function createLabubuAvatar(): THREE.Group {
  const group = new THREE.Group(); group.castShadow = true; const offset = 2.0;
  const furColor = 0xdfbea0; const skinMaterial = new THREE.MeshStandardMaterial({ color: furColor });
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const headGeo = new THREE.SphereGeometry(2.5, 32, 32); headGeo.scale(1.2, 1, 1);
  const head = new THREE.Mesh(headGeo, skinMaterial); head.position.y = 5 + offset; head.castShadow = true; group.add(head);
  const faceGeo = new THREE.CircleGeometry(1.8, 32); const face = new THREE.Mesh(faceGeo, whiteMaterial); face.position.set(0, 5 + offset, 2.2); group.add(face);
  const eyeGeo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
  const leftEye = new THREE.Mesh(eyeGeo, blackMaterial); leftEye.rotation.z = Math.PI / 4; leftEye.position.set(-0.8, 5.5 + offset, 2.3);
  const rightEye = new THREE.Mesh(eyeGeo, blackMaterial); rightEye.rotation.z = -Math.PI / 4; rightEye.position.set(0.8, 5.5 + offset, 2.3);
  group.add(leftEye); group.add(rightEye);
  for(let i=-3; i<=3; i++) {
    const toothGeo = new THREE.BoxGeometry(0.2, 0.3, 0.1);
    const tooth = new THREE.Mesh(toothGeo, blackMaterial); tooth.position.set(i * 0.3, 4.5 + offset + (Math.abs(i)*0.1), 2.3); group.add(tooth);
  }
  earsGroup = new THREE.Group();
  const earGeo = new THREE.ConeGeometry(0.8, 4, 16);
  const leftEar = new THREE.Mesh(earGeo, skinMaterial); leftEar.position.set(-1.5, 7.5 + offset, 0); leftEar.rotation.z = 0.2;
  const rightEar = new THREE.Mesh(earGeo, skinMaterial); rightEar.position.set(1.5, 7.5 + offset, 0); rightEar.rotation.z = -0.2;
  earsGroup.add(leftEar, rightEar); group.add(earsGroup);
  const bodyGeo = new THREE.CylinderGeometry(1.5, 2, 4, 16);
  const body = new THREE.Mesh(bodyGeo, skinMaterial); body.position.y = 2 + offset; body.castShadow = true; group.add(body);
  const limbGeo = new THREE.CapsuleGeometry(0.6, 2.5, 4, 8);
  leftArm = new THREE.Mesh(limbGeo, skinMaterial); leftArm.position.set(-2.2, 3 + offset, 0); leftArm.castShadow = true; group.add(leftArm);
  rightArm = new THREE.Mesh(limbGeo, skinMaterial); rightArm.position.set(2.2, 3 + offset, 0); rightArm.castShadow = true; group.add(rightArm);
  leftLeg = new THREE.Mesh(limbGeo, skinMaterial); leftLeg.position.set(-1, 0 + offset, 0); leftLeg.castShadow = true; group.add(leftLeg);
  rightLeg = new THREE.Mesh(limbGeo, skinMaterial); rightLeg.position.set(1, 0 + offset, 0); rightLeg.castShadow = true; group.add(rightLeg);
  return group;
}

function init() {
  scoreElement = document.getElementById('score-display')!;
  livesElement = document.getElementById('lives-count')!;
  hintElement = document.getElementById('death-hint')!;
  instructionsElement = document.getElementById('instructions')!;
  blockerElement = document.getElementById('blocker')!;
  ghostLabelElementRef = document.getElementById('ghost-label')!;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 20, 1000);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  hemiLight.position.set(0, 200, 0); scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
  dirLight.position.set(100, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.top = 200; dirLight.shadow.camera.bottom = -200;
  dirLight.shadow.camera.left = -200; dirLight.shadow.camera.right = 200;
  scene.add(dirLight);

  cameraRig = new THREE.Object3D();
  scene.add(cameraRig);
  cameraRig.add(camera);
  camera.position.set(0, 20, 40);
  camera.lookAt(0, 0, 0);

  controls = new PointerLockControls(cameraRig, document.body);

  controls.addEventListener('lock', function () {
    instructionsElement.style.display = 'none';
    blockerElement.style.display = 'none';
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    isMusicPlaying = true;
    isScreenshotMode = false;
  });

  controls.addEventListener('unlock', function () {
    if (isScreenshotMode) {
        blockerElement.style.display = 'none';
        instructionsElement.style.display = 'none';
    } else {
        blockerElement.style.display = 'flex';
        instructionsElement.style.display = 'flex';
        showMainMenu(); 
    }
    if(avatarGroup) avatarGroup.rotation.y = 0;
    stopAudio();
    if (ghostLabelElementRef) ghostLabelElementRef.style.display = 'none';
  });

  document.addEventListener('click', function(e) {
      if (isScreenshotMode) {
          isScreenshotMode = false;
          controls.lock();
          // Resume hint timer
          if (hintElement.style.display === 'block') {
              if (hintTimeout) clearTimeout(hintTimeout);
              hintTimeout = setTimeout(() => { hintElement.style.display = 'none'; }, 4000);
          }
      }
  });

  avatarGroup = createLabubuAvatar();
  avatarGroup.position.copy(startPosition);
  scene.add(avatarGroup);
  avatarGroup.rotation.y = 0;

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp': case 'KeyW': moveForward = true; break;
      case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
      case 'ArrowDown': case 'KeyS': moveBackward = true; break;
      case 'ArrowRight': case 'KeyD': moveRight = true; break;
      case 'Space': if (canJump) { velocity.y += JUMP_FORCE; canJump = false; } break;
      case 'KeyP': 
        isScreenshotMode = true; 
        if (hintTimeout) clearTimeout(hintTimeout); // Freeze hint
        controls.unlock(); 
        break;
      case 'Escape': 
        isScreenshotMode = false;
        controls.unlock(); 
        break;
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp': case 'KeyW': moveForward = false; break;
      case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
      case 'ArrowDown': case 'KeyS': moveBackward = false; break;
      case 'ArrowRight': case 'KeyD': moveRight = false; break;
    }
  };
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 2.5);

  buildWorld();
  showMainMenu(); 
  window.addEventListener('resize', onWindowResize);
}

function buildWorld() {
  const startGeo = new THREE.BoxGeometry(40, 5, 40);
  const startMat = new THREE.MeshStandardMaterial({ map: createCheckerboardTexture('#666666', '#888888') });
  const startPlatform = new THREE.Mesh(startGeo, startMat);
  startPlatform.position.set(0, 0, 0); startPlatform.receiveShadow = true;
  scene.add(startPlatform); objects.push(startPlatform);

  createTree(-15, 2.5, -15); createTree(15, 2.5, -15);
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

  for (const level of levelData) {
    let c1 = 'white', c2 = 'gray';
    if(level.color === 0x228b22) { c1='#228b22'; c2='#116611'; }
    if(level.color === 0xffd700) { c1='#ffd700'; c2='#ccaa00'; }
    if(level.color === 0x00ffff) { c1='#00ffff'; c2='#00cccc'; }
    if(level.color === 0xff00ff) { c1='#ff00ff'; c2='#cc00cc'; }
    if(level.color === 0xffa500) { c1='#ffa500'; c2='#cc8400'; }
    const boxMaterial = new THREE.MeshStandardMaterial({ map: createCheckerboardTexture(c1, c2) });

    for (const platform of level.platforms) {
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(platform.pos[0], platform.pos[1], platform.pos[2]);
      if (platform.scale) {
          box.scale.set(platform.scale[0], platform.scale[1], platform.scale[2]);
          const mat = box.material as THREE.MeshStandardMaterial;
          if (mat.map) {
              mat.map = mat.map.clone(); 
              mat.map.repeat.set(platform.scale[0]/4, platform.scale[2]/4);
              mat.map.needsUpdate = true;
          }
      }
      box.castShadow = true; box.receiveShadow = true;
      scene.add(box); objects.push(box);
    }
  }
  const lastLevel = levelData[levelData.length - 1];
  const lastPos = lastLevel.platforms[lastLevel.platforms.length - 1].pos;
  const winGeo = new THREE.BoxGeometry(30, 30, 30);
  const winMat = new THREE.MeshStandardMaterial({ map: createCheckerboardTexture('#ffd700', '#ffffff'), emissive: 0xaa8800, emissiveIntensity: 0.2 });
  winPlatform = new THREE.Mesh(winGeo, winMat);
  winPlatform.position.set(lastPos[0], lastPos[1] + 5, lastPos[2] - 80);
  winPlatform.castShadow = true; scene.add(winPlatform); objects.push(winPlatform);

  for(let i=0; i<30; i++) {
    const cx = (Math.random() - 0.5) * 800;
    const cy = 100 + Math.random() * 200;
    const cz = -Math.random() * 1000;
    createCloud(cx, cy, cz);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function showHint(zPos: number) {
  if (hintTimeout) clearTimeout(hintTimeout);
  let message = "Try Again! Hold W and Jump!";
  if (zPos > -140) message = "TIP: Hold 'W' and SPACE together to jump further!";
  else if (zPos > -260) {
    const xPos = avatarGroup.position.x;
    if (zPos > -200 && xPos > -5) message = "TIP: Press 'A' + SPACE to jump LEFT onto the block!";
    else if (zPos < -200 && xPos < 5) message = "TIP: Press 'D' + SPACE to jump RIGHT!";
    else message = "TIP: Use A and D to move sideways while jumping!";
  } else if (zPos > -400) message = "TIP: Don't rush! Time your jumps carefully.";
  hintElement.innerText = message; hintElement.style.display = 'block';
  hintTimeout = setTimeout(() => { hintElement.style.display = 'none'; }, 4000);
}

function handleDeath() {
  lives--;
  livesElement.innerText = lives.toString();
  if (lives > 0) {
    currentScore = 0; maxDistance = 0; 
    scoreElement.innerText = "Score: 0";
    showHint(avatarGroup.position.z);
    velocity.set(0, 0, 0); moveForward = false; moveBackward = false; moveLeft = false; moveRight = false;
    avatarGroup.position.copy(startPosition);
    if (ghostGroup) { ghostGroup.position.copy(startPosition); ghostPathIndex = 0; }
  } else {
    controls.unlock(); showMainMenu();
  }
}

function updateAnimation(time: number, isMoving: boolean) {
    if (isMoving) {
        const speed = 15;
        leftLeg.rotation.x = Math.sin(time * speed) * 0.5;
        rightLeg.rotation.x = Math.sin(time * speed + Math.PI) * 0.5;
        leftArm.rotation.x = Math.sin(time * speed + Math.PI) * 0.5;
        rightArm.rotation.x = Math.sin(time * speed) * 0.5;
        earsGroup.rotation.z = Math.sin(time * speed * 2) * 0.05;
    } else {
        leftLeg.rotation.x = 0; rightLeg.rotation.x = 0;
        leftArm.rotation.x = 0; rightArm.rotation.x = 0;
        earsGroup.rotation.z = 0;
    }
}

function animate() {
  requestAnimationFrame(animate);
  playMusicLoop();
  const time = performance.now();
  const delta = Math.min((time - prevTime) / 1000, 0.1); 
  prevTime = time;

  if (gameWon) { 
      if (controls.isLocked) { controls.unlock(); showMainMenu(); }
      renderer.render(scene, camera); return; 
  }

  if (controls.isLocked) {
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    avatarGroup.rotation.y = Math.atan2(camDir.x, camDir.z);

    raycaster.ray.origin.copy(avatarGroup.position);
    raycaster.ray.origin.y += 2; 
    const intersections = raycaster.intersectObjects(objects, false);
    const onObject = intersections.length > 0 && intersections[0].distance < 2.5;

    velocity.y -= GRAVITY * delta; 
    if (onObject) { velocity.y = Math.max(0, velocity.y); canJump = true; }
    avatarGroup.position.y += velocity.y * delta;

    if (onObject) {
        velocity.x -= velocity.x * FRICTION * delta;
        velocity.z -= velocity.z * FRICTION * delta;
    } else {
        velocity.x -= velocity.x * (FRICTION * 0.1) * delta;
        velocity.z -= velocity.z * (FRICTION * 0.1) * delta;
    }

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); 

    if (direction.length() > 0) {
        const forward = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), forward).negate();
        const inputVec = new THREE.Vector3();
        inputVec.add(forward.multiplyScalar(direction.z));
        inputVec.add(right.multiplyScalar(direction.x));
        inputVec.normalize();
        velocity.x += inputVec.x * MOVE_SPEED * delta;
        velocity.z += inputVec.z * MOVE_SPEED * delta;
    }

    avatarGroup.position.x += velocity.x * delta;
    avatarGroup.position.z += velocity.z * delta;
    cameraRig.position.copy(avatarGroup.position);

    updateAnimation(time / 1000, direction.length() > 0);
    updateGhost(delta);

    const dist = -avatarGroup.position.z;
    if (dist > maxDistance) {
      maxDistance = dist;
      currentScore = Math.floor(maxDistance);
      scoreElement.innerText = `Score: ${currentScore}`;
    }

    if (avatarGroup.position.y < -50) handleDeath();

    const pBox = new THREE.Box3().setFromObject(avatarGroup);
    const wBox = new THREE.Box3().setFromObject(winPlatform);
    if (pBox.intersectsBox(wBox)) {
      gameWon = true;
      stopAudio();
    }
  } else {
    renderer.render(scene, camera);
  }
  renderer.render(scene, camera);
}