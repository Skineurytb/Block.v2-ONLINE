// ============ ADMIN 3D TEST ENGINE ============
let scene, camera, renderer, clock, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

window.init3D = function() {
  document.getElementById('three-overlay').style.display = 'flex';
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Sky Blue
  scene.fog = new THREE.Fog(0x87CEEB, 0, 500);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.y = 2; // Eyes height

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('three-canvas-container').appendChild(renderer.domElement);

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
      case 'Space': if (canJump) velocity.y += 15; canJump = false; break;
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
  camera.rotation.set(rotation.x, rotation.y, 0, 'YXZ');
});

function animate() {
  if (!scene) return;
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * 4.0 * delta; // Gravity

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

  camera.translateX(-velocity.x * delta);
  camera.translateZ(velocity.z * delta);
  camera.position.y += (velocity.y * delta);

  if (camera.position.y < 2) {
    velocity.y = 0;
    camera.position.y = 2;
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