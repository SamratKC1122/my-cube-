// ======================
// THREE SETUP
// ======================
let scene, camera, renderer, cubeGroup;
const cubeSize = 3;
const spacing = 1;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    50,
    innerWidth / innerHeight,
    0.1,
    100
  );
  camera.position.set(6, 6, 8);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  document.getElementById("scene").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  cubeGroup = new THREE.Group();
  scene.add(cubeGroup);

  createCube();
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// ======================
// CUBE CREATION
// ======================
const cubies = [];

function createCube() {
  cubies.length = 0;
  cubeGroup.clear();

  const offset = (cubeSize - 1) / 2;

  const faceColors = [
    0xff0000, 0x00ff00, 0x0000ff,
    0xffff00, 0xff8800, 0xffffff
  ];

  for (let x = 0; x < cubeSize; x++) {
    for (let y = 0; y < cubeSize; y++) {
      for (let z = 0; z < cubeSize; z++) {

        const materials = faceColors.map(c =>
          new THREE.MeshStandardMaterial({ color: c })
        );

        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.95, 0.95),
          materials
        );

        const coord = {
          x: x - offset,
          y: y - offset,
          z: z - offset
        };

        mesh.userData.coord = { ...coord };
        mesh.position.set(
          coord.x * spacing,
          coord.y * spacing,
          coord.z * spacing
        );

        cubies.push(mesh);
        cubeGroup.add(mesh);
      }
    }
  }
}

// ======================
// TRUE LAYER ROTATION
// ======================
let isTurning = false;

function rotateLayer(axis, layer, dir) {
  if (isTurning) return;
  isTurning = true;

  const angle = Math.PI / 2 * dir;
  const group = new THREE.Group();
  cubeGroup.add(group);

  const affected = cubies.filter(c => c.userData.coord[axis] === layer);

  affected.forEach(c => {
    group.add(c);
  });

  let rotated = 0;
  const speed = 0.1;

  function spin() {
    const step = Math.min(speed, Math.abs(angle - rotated));
    group.rotation[axis] += step * dir;
    rotated += step;

    if (rotated < Math.abs(angle)) {
      requestAnimationFrame(spin);
    } else {
      // Apply logical rotation
      affected.forEach(c => {
        const { x, y, z } = c.userData.coord;

        if (axis === "x") {
          c.userData.coord.y = dir * -z;
          c.userData.coord.z = dir * y;
        }
        if (axis === "y") {
          c.userData.coord.x = dir * z;
          c.userData.coord.z = dir * -x;
        }
        if (axis === "z") {
          c.userData.coord.x = dir * -y;
          c.userData.coord.y = dir * x;
        }

        c.position.set(
          c.userData.coord.x * spacing,
          c.userData.coord.y * spacing,
          c.userData.coord.z * spacing
        );

        cubeGroup.add(c);
      });

      cubeGroup.remove(group);
      isTurning = false;
    }
  }

  spin();
}

// ======================
// HAND = VIEW ROTATION ONLY
// ======================
const video = document.getElementById("video");
let lastX = null;
let lastY = null;

const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(res => {
  if (!res.multiHandLandmarks.length || isTurning) return;

  const p = res.multiHandLandmarks[0][8];
  if (lastX !== null) {
    cubeGroup.rotation.y += (p.x - lastX) * 2;
    cubeGroup.rotation.x += (p.y - lastY) * 2;
  }
  lastX = p.x;
  lastY = p.y;
});

new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
}).start();

// ======================
// KEYBOARD = EXPLICIT TWISTS
// ======================
window.addEventListener("keydown", e => {
  if (isTurning) return;
  if (e.key === "r") rotateLayer("x", 1, 1);
  if (e.key === "l") rotateLayer("x", -1, -1);
  if (e.key === "u") rotateLayer("y", 1, 1);
  if (e.key === "d") rotateLayer("y", -1, -1);
  if (e.key === "f") rotateLayer("z", 1, 1);
  if (e.key === "b") rotateLayer("z", -1, -1);
});

// ======================
init();
