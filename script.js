// ======================
// THREE.JS SETUP
// ======================
let scene, camera, renderer, cubeGroup;

function initCube(size) {
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

  // Lights (THIS WAS A BIG ISSUE BEFORE)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // Cube
  cubeGroup = new THREE.Group();
  const offset = (size - 1) / 2;

  const colors = [
    0xff0000, // red
    0x00ff00, // green
    0x0000ff, // blue
    0xffff00, // yellow
    0xff8800, // orange
    0xffffff  // white
  ];

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {

        const materials = colors.map(c =>
          new THREE.MeshStandardMaterial({ color: c })
        );

        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.95, 0.95),
          materials
        );

        cube.position.set(
          x - offset,
          y - offset,
          z - offset
        );

        cubeGroup.add(cube);
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

function rotateCube(dx, dy) {
  cubeGroup.rotation.y += dx;
  cubeGroup.rotation.x += dy;
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
  if (!results.multiHandLandmarks.length) return;

  const tip = results.multiHandLandmarks[0][8];

  if (lastX !== null) {
    rotateCube(
      (tip.x - lastX) * 4,
      (tip.y - lastY) * 4
    );
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
// UI
// ======================
initCube(3);

document.getElementById("cubeSize").addEventListener("change", e => {
  initCube(Number(e.target.value));
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
