// ======================
// THREE.JS SETUP
// ======================
let scene, camera, renderer, cubeGroup;
let cubeSize = 3;
let isRotating = false;

function initCube(size) {
  cubeSize = size;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(6, 6, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const container = document.getElementById("scene");
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  cubeGroup = new THREE.Group();
  const offset = (cubeSize - 1) / 2;

  const colors = [
    0xff0000, 0x00ff00, 0x0000ff,
    0xffff00, 0xff8800, 0xffffff
  ];

  for (let x = 0; x < cubeSize; x++) {
    for (let y = 0; y < cubeSize; y++) {
      for (let z = 0; z < cubeSize; z++) {
        const materials = colors.map(c =>
          new THREE.MeshStandardMaterial({ color: c })
        );

        const cubie = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.95, 0.95),
          materials
        );

        cubie.position.set(
          x - offset,
          y - offset,
          z - offset
        );

        cubeGroup.add(cubie);
      }
    }
  }

  scene.add(cubeGroup);
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// ======================
// GRID SNAP (CRITICAL)
// ======================
function snapCubie(c) {
  c.position.x = Math.round(c.position.x);
  c.position.y = Math.round(c.position.y);
  c.position.z = Math.round(c.position.z);

  c.rotation.x = Math.round(c.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
  c.rotation.y = Math.round(c.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
  c.rotation.z = Math.round(c.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
}

// ======================
// REAL LAYER ROTATION
// ======================
function rotateLayer(axis, layer, dir) {
  if (isRotating) return;
  isRotating = true;

  const angle = Math.PI / 2 * dir;
  const group = new THREE.Group();

  cubeGroup.children.forEach(c => {
    if (Math.round(c.position[axis]) === layer) {
      group.add(c);
    }
  });

  cubeGroup.add(group);

  let rotated = 0;
  const step = 0.1 * dir;

  function anim() {
    group.rotation[axis] += step;
    rotated += Math.abs(step);

    if (rotated < Math.abs(angle)) {
      requestAnimationFrame(anim);
    } else {
      group.rotation[axis] = angle;
      group.updateMatrixWorld();

      while (group.children.length) {
        const c = group.children[0];
        c.applyMatrix4(group.matrix);
        snapCubie(c);
        cubeGroup.add(c);
      }

      cubeGroup.remove(group);
      isRotating = false;
    }
  }

  anim();
}

// ======================
// HAND TRACKING
// ======================
const video = document.getElementById("video");
let lastX = null;
let lastY = null;
let lastAction = 0;

const SWIPE_THRESHOLD = 0.08;
const COOLDOWN = 600;

const hands = new Hands({
  locateFile: f =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(res => {
  if (!res.multiHandLandmarks.length) return;

  const p = res.multiHandLandmarks[0][8];
  if (lastX === null) {
    lastX = p.x;
    lastY = p.y;
    return;
  }

  const dx = p.x - lastX;
  const dy = p.y - lastY;
  const now = Date.now();

  // 👉 deliberate swipe → twist
  if (
    Math.abs(dx) > SWIPE_THRESHOLD &&
    now - lastAction > COOLDOWN
  ) {
    rotateLayer("y", Math.sign(dx), 1);
    lastAction = now;
  }

  // ✋ slow movement → rotate whole cube
  if (!isRotating) {
    cubeGroup.rotation.y += dx * 1.5;
    cubeGroup.rotation.x += dy * 1.5;
  }

  lastX = p.x;
  lastY = p.y;
});

const cam = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});
cam.start();

// ======================
// INIT + RESIZE
// ======================
initCube(3);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
