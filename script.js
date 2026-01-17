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

  hands.onResults(res => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔍 DEBUG: draw camera frame border
    ctx.strokeStyle = "red";
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    if (!res.multiHandLandmarks || res.multiHandLandmarks.length === 0) {
      lastX = lastY = null;
      return;
    }

    const lm = res.multiHandLandmarks[0];

    // ---- DRAW DOTS ----
    ctx.fillStyle = "lime";
    for (const p of lm) {
      ctx.beginPath();
      ctx.arc(
        p.x * canvas.width,
        p.y * canvas.height,
        5,
        0,
        Math.PI * 2
      );
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

    for (const [a, b] of links) {
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
      if (Math.abs(dx) > dead) viewGroup.rotation.y += dx * 5;
      if (Math.abs(dy) > dead) viewGroup.rotation.x += dy * 5;
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

  // ✅ FORCE canvas size (do NOT trust video.videoWidth)
  canvas.width = 640;
  canvas.height = 480;
}
