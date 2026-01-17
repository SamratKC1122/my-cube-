// ================= GLOBALS =================
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
  const faceColors = [
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
        const materials = faceColors.map(c =>
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
  let lastX = 0, lastY = 0;

  renderer.domElement.addEventListener("mousedown", e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener("mouseup", () => dragging = false);

  window.addEventListener("mousemove", e => {
    if (!dragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    viewGroup.rotation.y += dx * 0.005;
    viewGroup.rotation.x += dy * 0.005;

    lastX = e.clientX;
    lastY = e.clientY;
  });
}

// ================= HAND TRACKING + OVERLAY =================
function initHands() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("overlay");
  const ctx = canvas.getContext("2d");

  let lastX = null;
  let lastY = null;

  const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(results => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      lastX = lastY = null;
      return;
    }

    const lm = results.multiHandLandmarks[0];

    // ---- DRAW LANDMARKS ----
    ctx.fillStyle = "lime";
    for (const p of lm) {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- DRAW CONNECTIONS ----
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20]
    ];

    for (const [a, b] of connections) {
      ctx.beginPath();
      ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
      ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
      ctx.stroke();
    }

    // ---- ROTATE CUBE USING INDEX FINGER ----
    const tip = lm[8];

    if (lastX !== null && lastY !== null) {
      const dx = tip.x - lastX;
      const dy = tip.y - lastY;
      const deadzone = 0.01;

      if (Math.abs(dx) > deadzone) {
        viewGroup.rotation.y += dx * 6;
      }
      if (Math.abs(dy) > deadzone) {
        viewGroup.rotation.x += dy * 6;
      }
    }

    lastX = tip.x;
    lastY = tip.y;
  });

  const cam = new Camera(video, {
    onFrame: async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      await hands.send({ image: video });
    },
    width: 640,
    height: 480
  });

  cam.start();
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
