// ============ ADMIN 3D TEST ENGINE ============
let scene, camera, renderer, clock, playerCharacter, headMesh, armLGroup, armRGroup, legLGroup, legRGroup, onWheel;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let zoomDist = 0; // 0 is First Person
let isFrontView = false;

function createPixelTexture(color, width, height, drawExtra) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const r = Math.random();
      if (r > 0.8) { ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(x, y, 1, 1); }
      else if (r > 0.9) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x, y, 1, 1); }
    }
  }
  if (drawExtra) drawExtra(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  return texture;
}

window.init3D = function() {
  document.getElementById('three-overlay').style.display = 'flex';
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Sky Blue
  scene.fog = new THREE.Fog(0x87CEEB, 0, 500);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('three-canvas-container').appendChild(renderer.domElement);

  // Character Model
  playerCharacter = new THREE.Group();
  
  // Torso (White)
  const torsoTex = createPixelTexture('#ffffff', 8, 12);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.4), new THREE.MeshStandardMaterial({map: torsoTex}));
  torso.position.y = 1.5;
  playerCharacter.add(torso);

  // Head (Beige)
  const headTex = createPixelTexture('#f5f5dc', 8, 8);
  const faceTex = createPixelTexture('#f5f5dc', 8, 8, (ctx) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(1, 2, 2, 2); // Eye L
    ctx.fillRect(5, 2, 2, 2); // Eye R
    ctx.fillRect(2, 5, 4, 1); // Mouth
    ctx.fillRect(2, 4, 1, 1); ctx.fillRect(5, 4, 1, 1);
  });
  const headMats = [
    new THREE.MeshStandardMaterial({map: headTex}), // Right
    new THREE.MeshStandardMaterial({map: headTex}), // Left
    new THREE.MeshStandardMaterial({map: headTex}), // Top
    new THREE.MeshStandardMaterial({map: headTex}), // Bottom
    new THREE.MeshStandardMaterial({map: headTex}), // Back
    new THREE.MeshStandardMaterial({map: faceTex}), // Front
  ];
  headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), headMats);
  headMesh.position.y = 2.35;
  playerCharacter.add(headMesh);

  // Arms (Beige)
  const armTex = createPixelTexture('#f5f5dc', 4, 12);
  const armGeo = new THREE.BoxGeometry(0.35, 1, 0.35);
  const armMat = new THREE.MeshStandardMaterial({map: armTex});
  
  armLGroup = new THREE.Group();
  const armLMesh = new THREE.Mesh(armGeo, armMat);
  armLMesh.position.y = -0.5; // Offset so pivot is at top of arm
  armLGroup.add(armLMesh);
  armLGroup.position.set(-0.575, 2, 0); // Position at shoulder (no gap)
  playerCharacter.add(armLGroup);

  armRGroup = new THREE.Group();
  const armRMesh = new THREE.Mesh(armGeo, armMat);
  armRMesh.position.y = -0.5;
  armRGroup.add(armRMesh);
  armRGroup.position.set(0.575, 2, 0);
  playerCharacter.add(armRGroup);

  // Legs (Blue)
  const legTex = createPixelTexture('#0000ff', 4, 12);
  const legGeo = new THREE.BoxGeometry(0.4, 1, 0.4);
  const legMat = new THREE.MeshStandardMaterial({map: legTex});

  legLGroup = new THREE.Group();
  const legLMesh = new THREE.Mesh(legGeo, legMat);
  legLMesh.position.y = -0.5; // Pivot at top
  legLGroup.add(legLMesh);
  legLGroup.position.set(-0.2, 1, 0); // Position at hip
  playerCharacter.add(legLGroup);

  legRGroup = new THREE.Group();
  const legRMesh = new THREE.Mesh(legGeo, legMat);
  legRMesh.position.y = -0.5;
  legRGroup.add(legRMesh);
  legRGroup.position.set(0.2, 1, 0);
  playerCharacter.add(legRGroup);

  scene.add(playerCharacter);
  playerCharacter.visible = false; // Start in 1st person

  // Simple Plane (The Plate)
  const grid = new THREE.GridHelper(100, 50, 0x000000, 0x555555);
  scene.add(grid);

  const planeGeo = new THREE.PlaneGeometry(100, 100);
  const planeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // Lights
  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

  // Simple First Person Control logic
  const onKeyDown = (e) => {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': moveForward = true; break;
      case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
      case 'ArrowDown': case 'KeyS': moveBackward = true; break;
      case 'ArrowRight': case 'KeyD': moveRight = true; break;
      case 'Space': if (canJump) { velocity.y = 12; canJump = false; } break;
      case 'KeyC': if (zoomDist < 0.6) zoomDist = 6; isFrontView = !isFrontView; break;
    }
  };
  const onKeyUp = (e) => {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': moveForward = false; break;
      case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
      case 'ArrowDown': case 'KeyS': moveBackward = false; break;
      case 'ArrowRight': case 'KeyD': moveRight = false; break;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  onWheel = (e) => {
    if (isFrontView) {
      e.preventDefault();
      return; // Zoom is locked in front view
    }
    zoomDist = Math.max(0, Math.min(15, zoomDist + e.deltaY * 0.01));
    e.preventDefault();
  };
  window.addEventListener('wheel', onWheel, { passive: false });
  
  clock = new THREE.Clock();
  animate();

  // Click to lock mouse
  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    controlsEnabled = document.pointerLockElement === renderer.domElement;
  });
};

let controlsEnabled = false;
let rotation = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
  if (!controlsEnabled) return;
  rotation.y -= e.movementX * 0.002;
  rotation.x -= e.movementY * 0.002;
  rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotation.x));
  if (zoomDist < 0.5 && !isFrontView) camera.rotation.set(rotation.x, rotation.y, 0, 'YXZ');
});

function animate() {
  if (!scene) return;
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * 3.5 * delta; // Gravity

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveLeft) - Number(moveRight);
  direction.normalize();

  // Calculate movement direction relative to camera, but ignore pitch (vertical tilt)
  if (moveForward || moveBackward || moveLeft || moveRight) {
    const camForward = new THREE.Vector3(0, 0, -1);
    camForward.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
    camForward.normalize();

    const camRight = new THREE.Vector3();
    camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(camForward, direction.z);
    moveDir.addScaledVector(camRight, -direction.x);
    moveDir.normalize();

    velocity.x += moveDir.x * 150.0 * delta;
    velocity.z += moveDir.z * 150.0 * delta;
  }

  playerCharacter.position.x += velocity.x * delta;
  playerCharacter.position.z += velocity.z * delta;
  playerCharacter.position.y += velocity.y * delta;
  playerCharacter.rotation.y = rotation.y;

  // Character Head Rotation
  if (headMesh) headMesh.rotation.x = -rotation.x;

  // Character Animations
  const time = clock.elapsedTime;
  const isWalking = (moveForward || moveBackward || moveLeft || moveRight) && canJump;

  if (!canJump) {
    // Jumping: Raise arms
    armLGroup.rotation.x = Math.PI; 
    armRGroup.rotation.x = Math.PI;
    legLGroup.rotation.x = 0;
    legRGroup.rotation.x = 0;
  } else if (isWalking) {
    // Walking: Swing arms back and forth
    const angle = Math.sin(time * 10) * 0.8;
    armLGroup.rotation.x = angle;
    armRGroup.rotation.x = -angle;
    legLGroup.rotation.x = -angle;
    legRGroup.rotation.x = angle;
  } else {
    // Idle: Reset arms
    armLGroup.rotation.x = 0;
    armRGroup.rotation.x = 0;
    legLGroup.rotation.x = 0;
    legRGroup.rotation.x = 0;
  }

  // Camera following logic
  const isThirdPerson = (zoomDist > 0.5) || isFrontView;
  playerCharacter.visible = isThirdPerson;

  const targetPos = playerCharacter.position.clone().add(new THREE.Vector3(0, 2.2, 0));

  if (!isThirdPerson && !isFrontView) {
    camera.position.copy(playerCharacter.position);
    camera.position.y += 2.2;
    camera.rotation.set(rotation.x, rotation.y, 0, 'YXZ');
  } else {
    const dist = zoomDist || 6;
    let offset = new THREE.Vector3(0, 0, isFrontView ? -dist : dist);
    offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), isFrontView ? rotation.x : -rotation.x);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
    camera.position.copy(targetPos).add(offset);
    camera.lookAt(targetPos);
  }

  if (playerCharacter.position.y < 0) {
    velocity.y = 0;
    playerCharacter.position.y = 0;
    canJump = true;
  }

  renderer.render(scene, camera);
}

window.close3D = function() {
  document.getElementById('three-overlay').style.display = 'none';
  const container = document.getElementById('three-canvas-container');
  while (container.firstChild) container.removeChild(container.firstChild);
  scene = null;
};