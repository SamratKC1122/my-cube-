let scene, camera, renderer;
let viewGroup, cubeGroup;
let cubies = [];
let cubeSize = 3;

init();
animate();

// ================= INIT =================
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
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

  viewGroup = new THREE.Group();
  scene.add(viewGroup);

  cubeGroup = new THREE.Group();
  viewGroup.add(cubeGroup);

  createCube();

  document.getElementById("cubeSize").addEventListener("change", e => {
    cubeSize = Number(e.target.value);
    createCube();
  });

  initMouse();
  initHands();
}

// ================= CREATE CUBE =================
function createCube() {
  cubies = [];
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

        mesh.position.set(
          x - offset,
          y - offset,
          z - offset
        );

        cubies.push(mesh);
        cubeGroup.add(mesh);
      }
    }
  }
}

// ================= MOUSE ROTATION =================
function initMouse() {
  let dragging = false;
  let px = 0, py = 0;

  renderer.domElement.addEventListener("mousedown", e => {
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
}

// ================= HAND TRACKING =================
function initHands() {
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
    if (!res.multiHandLandmarks.length) {
      lastX = lastY = null;
      return;
    }

    const p = res.multiHandLandmarks[0][8];

    if (lastX !== null) {
      const dx = p.x - lastX;
      const dy = p.y - lastY;
      const dead = 0.01;

      if (Math.abs(dx) > dead) viewGroup.rotation.y += dx * 6;
      if (Math.abs(dy) > dead) viewGroup.rotation.x += dy * 6;
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
}

// ================= RENDER =================
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
