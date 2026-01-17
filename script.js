let scene, camera, renderer;
let viewGroup, cubeGroup;

const cubeSize = 3;
const spacing = 1;
const cubies = [];
let isTurning = false;

init();
animate();

// ======================
// INIT
// ======================
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    45,
    innerWidth / innerHeight,
    0.1,
    100
  );
  camera.position.set(6, 6, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  document.getElementById("scene").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  // 🔑 VIEW GROUP (ROTATION ONLY)
  viewGroup = new THREE.Group();
  scene.add(viewGroup);

  // 🔑 CUBE GROUP (LOGIC ONLY)
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
    0xff0000, 0xff8800,
    0xffffff, 0xffff00,
    0x00ff00, 0x0000ff
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
// TRUE LAYER TWIST
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
// MOUSE = VIEW ROTATION
// ======================
let dragging = false;
let px = 0, py = 0;

renderer?.domElement?.addEventListener?.("mousedown", e => {
  dragging = true;
  px = e.clientX;
  py = e.clientY;
});

window.addEventListener("mouseup", () => dragging = false);

window.addEventListener("mousemove", e => {
  if (!dragging) return;
  viewGroup.rotation.y += (e.clientX - px) * 0.005;
  viewGroup.rotation.x += (e.clientY - py) * 0.005;
  px = e.clientX;
  py = e.clientY;
});

// ======================
// KEYBOARD = LAYER TWISTS
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
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
