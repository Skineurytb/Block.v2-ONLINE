// ============ ADMIN 3D TEST ENGINE ============
let scene, camera, renderer, clock, playerCharacter, armLGroup, armRGroup, onWheel;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let zoomDist = 0; // 0 is First Person

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
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.4), new THREE.MeshStandardMaterial({color: 0xffffff}));
  torso.position.y = 1.5;
  playerCharacter.add(torso);

  // Head (Beige)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({color: 0xf5f5dc}));
  head.position.y = 2.25;
  playerCharacter.add(head);

  // Arms (Beige)
  const armGeo = new THREE.BoxGeometry(0.35, 1, 0.35);
  const armMat = new THREE.MeshStandardMaterial({color: 0xf5f5dc});
  
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
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), new THREE.MeshStandardMaterial({color: 0x0000ff}));
  legL.position.set(-0.2, 0.5, 0);
  playerCharacter.add(legL);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), new THREE.MeshStandardMaterial({color: 0x0000ff}));
  legR.position.set(0.2, 0.5, 0);
  playerCharacter.add(legR);

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
  if (zoomDist < 0.5) camera.rotation.set(rotation.x, rotation.y, 0, 'YXZ');
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

  // Character Animations
  const time = clock.elapsedTime;
  const isWalking = (moveForward || moveBackward || moveLeft || moveRight) && canJump;

  if (!canJump) {
    // Jumping: Raise arms
    armLGroup.rotation.x = 2.5; 
    armRGroup.rotation.x = 2.5;
  } else if (isWalking) {
    // Walking: Swing arms back and forth
    armLGroup.rotation.x = Math.sin(time * 10) * 0.8;
    armRGroup.rotation.x = -Math.sin(time * 10) * 0.8;
  } else {
    // Idle: Reset arms
    armLGroup.rotation.x = 0;
    armRGroup.rotation.x = 0;
  }

  // Camera following logic
  const isThirdPerson = zoomDist > 0.5;
  playerCharacter.visible = isThirdPerson;

  if (!isThirdPerson) {
    camera.position.copy(playerCharacter.position);
    camera.position.y += 2.2; // Head height
  } else {
    // Dynamically calculate offset based on zoom distance
    const relativeCameraOffset = new THREE.Vector3(0, 1 + zoomDist * 0.3, zoomDist);
    const cameraOffset = relativeCameraOffset.applyMatrix4(playerCharacter.matrixWorld);
    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
    camera.lookAt(playerCharacter.position.x, playerCharacter.position.y + 1.5, playerCharacter.position.z);
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