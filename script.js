/* ===================== HAND TRACKING ===================== */

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

video.onloadedmetadata = () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
};

const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(results => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results.multiHandLandmarks) return;

  results.multiHandLandmarks.forEach(landmarks => {
    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
      color: "#00ffcc",
      lineWidth: 3
    });
    drawLandmarks(ctx, landmarks, {
      color: "#ffcc00",
      radius: 4
    });
  });
});

const cam = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 1280,
  height: 720
});

cam.start();

/* ===================== THREE.JS ===================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera3d = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / (window.innerHeight * 0.6),
  0.1,
  100
);

camera3d.position.set(5, 5, 7);
camera3d.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
document.getElementById("scene").appendChild(renderer.domElement);

/* LIGHTS */
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(5, 10, 7);
scene.add(dir);

/* SIMPLE CUBE (STABLE BASE) */
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(3, 3, 3),
  new THREE.MeshStandardMaterial({ color: 0x3366ff })
);
scene.add(cube);

/* ===================== MOUSE ROTATION ===================== */

let dragging = false;
let prevX = 0;
let prevY = 0;

renderer.domElement.addEventListener("mousedown", e => {
  dragging = true;
  prevX = e.clientX;
  prevY = e.clientY;
});

window.addEventListener("mouseup", () => dragging = false);

window.addEventListener("mousemove", e => {
  if (!dragging) return;

  cube.rotation.y += (e.clientX - prevX) * 0.005;
  cube.rotation.x += (e.clientY - prevY) * 0.005;

  prevX = e.clientX;
  prevY = e.clientY;
});

/* ===================== LOOP ===================== */

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera3d);
}
animate();
