// ======================
// GLOBALS
// ======================
let scene, camera, renderer;
let viewGroup, cubeGroup;

const cubeSize = 3;
const spacing = 1;
const cubies = [];
let isTurning = false;

// ======================
// INIT
// ======================
init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(6, 6, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById("scene").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  // View group (camera interaction only)
  viewGroup = new THREE.Group();
  scene.add(viewGroup);

  // Cube group (Rubik’s logic only)
  cubeGroup = new THREE.Group();
  viewGroup.add(cubeGroup);

  createCube();
}

// ======================
// CREATE CUBE
// ======================
function createCube() {
  cubies.length = 0;
  cubeGroup.clear();

  const offset = (cubeSize - 1) / 2;
  const colors = [
    0xff0000, // red
    0xff8800, // orange
    0xffffff, // white
    0xffff00, // yellow
    0x00ff00, // green
    0x0000ff  // blue
  ];

  for (let x = 0; x < cubeSize; x++) {
    for (let y = 0; y < cubeSize; y++) {
      for (let z = 0; z < cubeSize; z++) {

        const materials = colors.map(c =>
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
function rotateLayer(axis, layer, dir) {
  if (isTurning) return;
  isTurning = true;

  const angle = Math.PI / 2;
  const group = new THREE.Group();
  cubeGroup.add(group);

  const affected = cubies.filter(c => c.userData.coord[axis] === layer);
  affected.forEach(c => group.add(c));

  let rotated = 0;
  const speed = 0.1;

  function spin() {
    const step = Math.min(speed, angle - rotated);
    group.rotation[axis] += step * dir;
    rotated += step;

    if (rotated < angle) {
      requestAnimationFrame(spin);
    } else {
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
// MOUSE ROTATION (VIEW)
// ======================
let dragging = false;
let prevX = 0, prevY = 0;

renderer.domElement.addEventListener("mousedown", e => {
  dragging = true;
  prevX = e.clientX;
  prevY = e.clientY;
});

window.addEventListener("mouseup", () => dragging = false);

window.addEventListener("mousemove", e => {
  if (!dragging) return;

  const dx = e.clientX - prevX;
  const dy = e.clientY - prevY;

  viewGroup.rotation.y += dx * 0.005;
  viewGroup.rotation.x += dy * 0.005;

  prevX = e.clientX;
  prevY = e.clientY;
});

// ======================
// HAND ROTATION (FIXED)
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

hands.onResults(results => {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    lastX = null;
    lastY = null;
    return;
  }

  const tip = results.multiHandLandmarks[0][8];

  if (lastX !== null && lastY !== null) {
    const dx = tip.x - lastX;
    const dy = tip.y - lastY;

    const deadzone = 0.008;
    const strength = 8;

    if (Math.abs(dx) > deadzone)
      viewGroup.rotation.y += dx * strength;

    if (Math.abs(dy) > deadzone)
      viewGroup.rotation.x += dy * strength;
  }

  lastX = tip.x;
  lastY = tip.y;
});

new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
}).start();

// ======================
// KEYBOARD LAYER TWISTS
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
// RENDER LOOP
// ======================
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
