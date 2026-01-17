// ================= THREE GLOBALS =================
let scene, camera, renderer;
let viewGroup, cubeGroup;
let cubeSize = 3;

// ================= INIT =================
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
  const canvas = document.getElementById("overlay");
  const ctx = canvas.getContext("2d");

  let lastX = null;
  let lastY = null;
  let canvasReady = false;

  const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(res => {
    if (!canvasReady) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!res.multiHandLandmarks || res.multiHandLandmarks.length === 0) {
      lastX = lastY = null;
      return;
    }

    const lm = res.multiHandLandmarks[0];

    // ---- DRAW DOTS ----
    ctx.fillStyle = "lime";
    for (const p of lm) {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- DRAW SKELETON ----
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;

    const links = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20]
    ];

    for (const [a,b] of links) {
      ctx.beginPath();
      ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
      ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
      ctx.stroke();
    }

    // ---- ROTATE CUBE ----
    const tip = lm[8];
    if (lastX !== null) {
      const dx = tip.x - lastX;
      const dy = tip.y - lastY;
      const dead = 0.01;

      if (Math.abs(dx) > dead) viewGroup.rotation.y += dx * 6;
      if (Math.abs(dy) > dead) viewGroup.rotation.x += dy * 6;
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

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvasReady = true;
  };
}

// ================= RENDER LOOP =================
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// ================= RESIZE =================
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
