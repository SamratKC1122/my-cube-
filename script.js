let scene, camera, renderer;
let cubeGroup;
let size = 3;
let cubies = [];

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(6, 6, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  document.getElementById("scene").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  cubeGroup = new THREE.Group();
  scene.add(cubeGroup);

  createCube();

  document.getElementById("cubeSize").onchange = e => {
    size = Number(e.target.value);
    createCube();
  };

  initMouse();
  initKeyboard();
}

function createCube() {
  cubeGroup.clear();
  cubies = [];

  const offset = (size - 1) / 2;
  const colors = [
    0xff0000, 0xff8800,
    0xffffff, 0xffff00,
    0x00ff00, 0x0000ff
  ];

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const mats = colors.map(c =>
          new THREE.MeshStandardMaterial({ color: c })
        );

        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.95, 0.95),
          mats
        );

        cube.position.set(
          x - offset,
          y - offset,
          z - offset
        );

        cube.userData = { x, y, z };
        cubies.push(cube);
        cubeGroup.add(cube);
      }
    }
  }
}

/* ========= REAL LAYER TWIST ========= */
function rotateLayer(axis, index, dir) {
  const group = new THREE.Group();

  cubies.forEach(c => {
    if (c.userData[axis] === index) {
      group.add(c);
    }
  });

  cubeGroup.add(group);

  const angle = dir * Math.PI / 2;
  group.rotation[axis] = angle;

  group.updateMatrixWorld();

  group.children.forEach(c => {
    c.applyMatrix4(group.matrix);
    c.updateMatrixWorld();

    c.position.round();

    c.userData.x = Math.round(c.position.x + (size - 1) / 2);
    c.userData.y = Math.round(c.position.y + (size - 1) / 2);
    c.userData.z = Math.round(c.position.z + (size - 1) / 2);

    cubeGroup.add(c);
  });

  cubeGroup.remove(group);
}

/* ========= KEYBOARD CONTROL ========= */
function initKeyboard() {
  window.addEventListener("keydown", e => {
    const max = size - 1;

    if (e.key === "R") rotateLayer("x", max, 1);
    if (e.key === "r") rotateLayer("x", max, -1);

    if (e.key === "U") rotateLayer("y", max, 1);
    if (e.key === "u") rotateLayer("y", max, -1);

    if (e.key === "F") rotateLayer("z", max, 1);
    if (e.key === "f") rotateLayer("z", max, -1);
  });
}

/* ========= MOUSE ROTATION ========= */
function initMouse() {
  let drag = false, px = 0, py = 0;

  renderer.domElement.onmousedown = e => {
    drag = true;
    px = e.clientX;
    py = e.clientY;
  };

  window.onmouseup = () => drag = false;

  window.onmousemove = e => {
    if (!drag) return;
    cubeGroup.rotation.y += (e.clientX - px) * 0.005;
    cubeGroup.rotation.x += (e.clientY - py) * 0.005;
    px = e.clientX;
    py = e.clientY;
  };
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
