// ======================
// THREE.JS SETUP
// ======================
let scene, camera, renderer, cubeGroup;
let cubeSize = 3;

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

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // Cube
  cubeGroup = new THREE.Group();
  const offset = (cubeSize - 1) / 2;

  const colors = [
    0xff0000, // red
    0x00ff00, // green
    0x0000ff, // blue
    0xffff00, // yellow
    0xff8800, // orange
    0xffffff  // white
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
// RUBIK'S CUBE TWIST LOGIC
// ======================
let isRotating = false;

function rotateLayer(axis, layerIndex, direction = 1) {
  if (isRotating) return;
  isRotating = true;

  const angle = Math.PI / 2 * direction;
  const layerGroup = new THREE.Group();

  cubeGroup.children.forEach(cubie => {
    if (Math.round(cubie.position[axis]) === layerIndex) {
      layerGroup.add(cubie);
    }
  });

  cubeGroup.add(layerGroup);

  let rotated = 0;
  const step = 0.1 * direction;

  function animateRotation() {
    layerGroup.rotation[axis] += step;
    rotated += Math.abs(step);

    if (rotated < Math.abs(angle)) {
      requestAnimationFrame(animateRotation);
    } else {
      layerGroup.rotation[axis] = angle;
      layerGroup.updateMatrixWorld();

      while (layerGroup.children.length) {
        const cubie = layerGroup.children[0];
        cubie.applyMatrix4(layerGroup.matrix);
        cubeGroup.add(cubie);
      }

      cubeGroup.remove(layerGroup);
      isRotating = false;
    }
  }

  animateRotation();
}

// ======================
// HAND TRACKING
// ======================
const video = document.getElementById("video");
let lastX = null;
let lastY = null;

const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(results => {
  if (!results.multiHandLandmarks.length || isRotating) return;

  const tip = results.multiHandLandmarks[0][8];

  if (lastX !== null) {
    const dx = tip.x - lastX;
    const dy = tip.y - lastY;

    if (Math.abs(dx) > Math.abs(dy)) {
      rotateLayer("y", 1, dx > 0 ? 1 : -1);
    } else {
      rotateLayer("x", 1, dy > 0 ? -1 : 1);
    }
  }

  lastX = tip.x;
  lastY = tip.y;
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
// UI + TEST CONTROLS
// ======================
initCube(3);

document.getElementById("cubeSize").addEventListener("change", e => {
  initCube(Number(e.target.value));
});

// Keyboard test (VERY IMPORTANT)
window.addEventListener("keydown", e => {
  if (isRotating) return;

  if (e.key === "r") rotateLayer("x", 1, 1);
  if (e.key === "l") rotateLayer("x", -1, -1);
  if (e.key === "u") rotateLayer("y", 1, 1);
  if (e.key === "d") rotateLayer("y", -1, -1);
  if (e.key === "f") rotateLayer("z", 1, 1);
  if (e.key === "b") rotateLayer("z", -1, -1);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
