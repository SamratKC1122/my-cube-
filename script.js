// --------------------
// THREE.JS CUBE SETUP
// --------------------
let scene, camera, renderer, cubeGroup;
let cubeSize = 3;

function initCube(size) {
  cubeSize = size;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(4, 4, 6);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const container = document.getElementById("scene");
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  cubeGroup = new THREE.Group();

  const offset = (cubeSize - 1) / 2;

  for (let x = 0; x < cubeSize; x++) {
    for (let y = 0; y < cubeSize; y++) {
      for (let z = 0; z < cubeSize; z++) {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.9, 0.9),
          new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        cube.position.set(x - offset, y - offset, z - offset);
        cubeGroup.add(cube);
      }
    }
  }

  scene.add(cubeGroup);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

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

// --------------------
// HAND TRACKING SETUP
// --------------------
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

  const indexFinger = results.multiHandLandmarks[0][8];

  if (lastX !== null) {
    const dx = indexFinger.x - lastX;
    const dy = indexFinger.y - lastY;

    rotateCube(dx * 4, dy * 4);
  }

  lastX = indexFinger.x;
  lastY = indexFinger.y;
});

// Camera feed
const cameraFeed = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

cameraFeed.start();

// --------------------
// UI CONTROLS
// --------------------
initCube(3);

document.getElementById("cubeSize").addEventListener("change", e => {
  initCube(Number(e.target.value));
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
