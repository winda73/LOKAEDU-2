function ExecuteScript(strId)
{
  switch (strId)
  {
      case "6EQ8n3fUZPT":
        Script1();
        break;
      case "6Dmn8d2pJ5L":
        Script2();
        break;
      case "6aGkTdk3V8t":
        Script3();
        break;
  }
}

function Script1()
{
  (function () {
  // Tutup scanner lama jika masih terbuka
  if (window.closeARFlashcard) {
    window.closeARFlashcard();
  }

  // Buat tampilan scanner
  const overlay = document.createElement("div");
  overlay.id = "ar-flashcard-overlay";

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    background: "#000",
    zIndex: "999999",
    fontFamily: "Arial, sans-serif"
  });

  overlay.innerHTML = `
    <div style="
      position:absolute;top:12px;left:12px;right:12px;
      z-index:10;display:flex;gap:8px;align-items:center;
      justify-content:space-between;">
      <div style="color:white;font-size:16px;font-weight:bold;">
        AR Flashcard Scanner
      </div>
      <div style="display:flex;gap:8px;">
        <button id="ar-flash-toggle"
          style="padding:10px;border:0;border-radius:8px;">
          Flash
        </button>
        <button id="ar-close"
          style="padding:10px;border:0;border-radius:8px;">
          Tutup ✕
        </button>
      </div>
    </div>

    <div id="ar-status" style="
      position:absolute;bottom:20px;left:12px;right:12px;
      z-index:10;color:white;text-align:center;
      background:#0009;padding:12px;border-radius:8px;">
      Memuat AR...
    </div>

    <div id="ar-scene-container"
      style="position:absolute;inset:0;"></div>
  `;

  document.body.appendChild(overlay);

  const status = overlay.querySelector("#ar-status");
  const sceneContainer =
    overlay.querySelector("#ar-scene-container");

  let cameraTrack = null;
  let scene = null;
  let closed = false;

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  // Fungsi menutup kamera dan scanner
  window.closeARFlashcard = function () {
    closed = true;

    try {
      if (cameraTrack) {
        cameraTrack.stop();
      }

      if (scene && scene.systems &&
          scene.systems.arjs) {
        scene.systems.arjs.dispose();
      }

      // Hentikan juga track kamera yang ditemukan
      overlay.querySelectorAll("video").forEach(video => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => {
            track.stop();
          });
          video.srcObject = null;
        }
      });
    } catch (e) {
      console.warn("Pembersihan kamera:", e);
    }

    overlay.remove();
    window.closeARFlashcard = null;
  };

  overlay.querySelector("#ar-close").onclick =
    window.closeARFlashcard;

  // Tombol flash kamera (jika didukung perangkat)
  overlay.querySelector("#ar-flash-toggle").onclick =
    async function () {
      const video = overlay.querySelector("video");
      const track =
        cameraTrack ||
        (video && video.srcObject &&
          video.srcObject.getVideoTracks()[0]);

      if (!track) {
        setStatus("Kamera belum siap.");
        return;
      }

      try {
        const capabilities =
          track.getCapabilities
            ? track.getCapabilities()
            : {};

        if (!capabilities.torch) {
          setStatus(
            "Flash tidak didukung browser/perangkat ini."
          );
          return;
        }

        const settings = track.getSettings();
        const nextTorch = !settings.torch;

        await track.applyConstraints({
          advanced: [{ torch: nextTorch }]
        });

        setStatus(
          nextTorch ? "Flash aktif." : "Flash mati."
        );
      } catch (e) {
        setStatus("Flash tidak dapat diaktifkan.");
      }
    };

  // Memuat library secara berurutan
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Gagal memuat library: " + src));
      document.head.appendChild(script);
    });
  }

  async function startAR() {
    try {
      setStatus("Memuat library AR...");

      await loadScript(
        "https://aframe.io/releases/1.6.0/aframe.min.js"
      );

      if (closed) return;

      await loadScript(
        "https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js"
      );

      if (closed) return;

      // Membuat scene AR dengan marker Hiro
      sceneContainer.innerHTML = `
        <a-scene
          embedded
          vr-mode-ui="enabled: false"
          renderer="antialias: true; alpha: true"
          arjs="sourceType: webcam;
                debugUIEnabled: false;
                trackingMethod: best;">

          <a-marker
            preset="hiro"
            emitevents="true">

            <a-box
              position="0 0.5 0"
              material="color: #00D1FF; metalness: 0.2;"
              animation="
                property: rotation;
                to: 0 360 0;
                loop: true;
                dur: 4000">
            </a-box>

            <a-text
              value="AR FLASHCARD"
              position="-0.8 1.3 0"
              color="#FFFFFF"
              align="center"
              width="4">
            </a-text>

            <a-text
              value="Belajar dengan AR!"
              position="-0.8 1.0 0"
              color="#FFFF00"
              align="center"
              width="4">
            </a-text>

          </a-marker>

          <a-entity camera></a-entity>
        </a-scene>
      `;

      scene = sceneContainer.querySelector("a-scene");

      scene.addEventListener("loaded", function () {
        if (closed) return;
        setStatus(
          "Arahkan kamera ke marker Hiro pada flashcard."
        );
      }, { once: true });

      scene.addEventListener(
        "markerFound",
        function () {
          if (!closed) {
            setStatus("Flashcard terdeteksi!");
          }
        }
      );

      scene.addEventListener(
        "markerLost",
        function () {
          if (!closed) {
            setStatus("Arahkan kamera ke flashcard.");
          }
        }
      );

      // Deteksi track kamera untuk fungsi flash
      const findCamera = setInterval(() => {
        if (closed) {
          clearInterval(findCamera);
          return;
        }

        const video = overlay.querySelector("video");

        if (video && video.srcObject) {
          const tracks =
            video.srcObject.getVideoTracks();

          if (tracks.length) {
            cameraTrack = tracks[0];
            clearInterval(findCamera);
          }
        }
      }, 500);

    } catch (error) {
      console.error(error);
      setStatus(
        "Gagal membuka AR. Periksa koneksi internet, " +
        "izin kamera, dan alamat HTTPS."
      );
    }
  }

  startAR();
})();
}

function Script2()
{
  var player = GetPlayer();

/* ================================
   KONFIGURASI GAME
================================ */
var GAME_W = 960;
var GAME_H = 540;
var GRAVITY = 0.65;
var MOVE_SPEED = 4.2;
var JUMP_POWER = -13;
var COIN_SCORE = 10;
var ANSWER_SCORE = 100;

/* ================================
   10 SOAL IPS: KEARIFAN LOKAL
================================ */
var questions = [
  {
    q: "Apa yang dimaksud dengan kearifan lokal?",
    options: ["Nilai dan kebiasaan baik suatu masyarakat", "Teknologi dari luar negeri", "Mode busana global", "Bahasa asing"],
    answer: 0,
    fact: "Kearifan lokal adalah nilai, pengetahuan, dan kebiasaan baik yang diwariskan masyarakat."
  },
  {
    q: "Contoh kearifan lokal Indonesia adalah...",
    options: ["Gotong royong", "Individualisme", "Konsumsi berlebihan", "Membuang sampah ke sungai"],
    answer: 0,
    fact: "Gotong royong mencerminkan semangat kerja sama dan kepedulian sosial."
  },
  {
    q: "Bagaimana sikap terbaik menghadapi globalisasi?",
    options: ["Menolak semua budaya asing", "Meniru semua budaya asing", "Selektif dan tetap menjaga identitas", "Meninggalkan budaya sendiri"],
    answer: 2,
    fact: "Sikap selektif berarti menerima hal positif tanpa kehilangan jati diri bangsa."
  },
  {
    q: "Nilai luhur Pancasila yang sejalan dengan gotong royong adalah...",
    options: ["Kemanusiaan", "Ketuhanan", "Persatuan Indonesia", "Keadilan sosial"],
    answer: 2,
    fact: "Gotong royong memperkuat persatuan dan kebersamaan masyarakat Indonesia."
  },
  {
    q: "Rumah adat merupakan contoh kearifan lokal dalam bidang...",
    options: ["Arsitektur", "Teknologi digital", "Perdagangan internasional", "Olahraga modern"],
    answer: 0,
    fact: "Rumah adat mencerminkan penyesuaian masyarakat dengan alam dan budaya setempat."
  },
  {
    q: "Upacara adat sebaiknya dilestarikan karena...",
    options: ["Hanya untuk wisatawan", "Menjaga identitas dan nilai budaya", "Mengikuti tren luar negeri", "Menggantikan pendidikan"],
    answer: 1,
    fact: "Upacara adat menyimpan nilai sejarah, moral, dan identitas komunitas."
  },
  {
    q: "Dampak positif globalisasi bagi kearifan lokal adalah...",
    options: ["Budaya lokal dikenal dunia", "Budaya lokal otomatis hilang", "Semua tradisi dilarang", "Masyarakat menjadi tertutup"],
    answer: 0,
    fact: "Globalisasi dapat menjadi sarana promosi budaya lokal ke dunia internasional."
  },
  {
    q: "Sikap yang mencerminkan cinta budaya lokal adalah...",
    options: ["Mempelajari dan melestarikan tradisi", "Malu menggunakan bahasa daerah", "Menolak seni tradisional", "Hanya mengikuti budaya asing"],
    answer: 0,
    fact: "Mempelajari dan melestarikan tradisi membantu budaya tetap hidup."
  },
  {
    q: "Contoh penerapan kearifan lokal dalam menjaga lingkungan adalah...",
    options: ["Menebang hutan tanpa izin", "Sistem sasi atau larangan panen sementara", "Membuang limbah ke laut", "Membakar hutan"],
    answer: 1,
    fact: "Sasi adalah kearifan lokal untuk menjaga keberlanjutan sumber daya alam."
  },
  {
    q: "Agar kearifan lokal tetap relevan di era global, generasi muda sebaiknya...",
    options: ["Mengabaikannya", "Mengubahnya sepenuhnya", "Mengembangkannya secara kreatif", "Menyimpannya tanpa dipraktikkan"],
    answer: 2,
    fact: "Kearifan lokal dapat dikembangkan secara kreatif agar tetap hidup di masa modern."
  }
];

/* ================================
   ELEMEN CANVAS
================================ */
var oldCanvas = document.getElementById("ipsMarioCanvas");
if (oldCanvas) oldCanvas.remove();

var canvas = document.createElement("canvas");
canvas.id = "ipsMarioCanvas";
canvas.width = GAME_W;
canvas.height = GAME_H;
canvas.style.position = "fixed";
canvas.style.top = "50%";
canvas.style.left = "50%";
canvas.style.transform = "translate(-50%, -50%)";
canvas.style.zIndex = "999999";
canvas.style.borderRadius = "18px";
canvas.style.boxShadow = "0 20px 60px rgba(0,0,0,.55)";
canvas.style.cursor = "pointer";
document.body.appendChild(canvas);

var ctx = canvas.getContext("2d");

/* ================================
   STATE GAME
================================ */
var state = "menu";
var currentQuestion = 0;
var coinsCollected = 0;
var score = 0;
var correct = 0;
var selectedAnswer = -1;
var feedback = "";
var feedbackTimer = 0;
var musicOn = true;
var keys = {};

var player = {
  x: 60,
  y: GAME_H - 120,
  w: 34,
  h: 44,
  vx: 0,
  vy: 0,
  onGround: false,
  color: "#ff4757"
};

var platforms = [
  { x: 0, y: GAME_H - 60, w: GAME_W, h: 60 },
  { x: 180, y: 400, w: 150, h: 20 },
  { x: 420, y: 330, w: 150, h: 20 },
  { x: 680, y: 400, w: 150, h: 20 },
  { x: 830, y: 280, w: 110, h: 20 }
];

var coins = [];
var clouds = [
  { x: 80, y: 70, s: 1 },
  { x: 340, y: 110, s: 1.3 },
  { x: 620, y: 60, s: 1 },
  { x: 820, y: 130, s: 1.2 }
];

function resetLevel() {
  coins = [];
  for (var i = 0; i < 6; i++) {
    coins.push({
      x: 220 + i * 115,
      y: i % 2 === 0 ? 360 : 290,
      r: 11,
      taken: false
    });
  }
  player.x = 60;
  player.y = GAME_H - 120;
  player.vx = 0;
  player.vy = 0;
}

resetLevel();

/* ================================
   MUSIK SEDERHANA
================================ */
var audioCtx = null;
var musicTimer = null;
var melody = [523, 659, 784, 659, 587, 523, 659, 784];

function playTone(freq, duration, type, volume) {
  if (!musicOn || !audioCtx) return;
  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  osc.type = type || "square";
  osc.frequency.value = freq;
  gain.gain.value = volume || 0.05;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}

function startMusic() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    audioCtx = null;
    return;
  }
  var note = 0;
  musicTimer = setInterval(function () {
    playTone(melody[note % melody.length], 0.22, "square", 0.035);
    note++;
  }, 300);
}

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

function toggleMusic() {
  musicOn = !musicOn;
  if (musicOn) startMusic();
  else stopMusic();
}

/* ================================
   INPUT
================================ */
document.addEventListener("keydown", function (e) {
  keys[e.key.toLowerCase()] = true;
  if ([" ", "arrowup", "arrowleft", "arrowright"].indexOf(e.key.toLowerCase()) >= 0) {
    e.preventDefault();
  }
});

document.addEventListener("keyup", function (e) {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("click", function (e) {
  var rect = canvas.getBoundingClientRect();
  var x = (e.clientX - rect.left) * (canvas.width / rect.width);
  var y = (e.clientY - rect.top) * (canvas.height / rect.height);

  if (state === "menu") {
    if (inButton(x, y, GAME_W / 2 - 110, 300, 220, 58)) {
      startGame();
    } else if (inButton(x, y, GAME_W / 2 - 110, 375, 220, 52)) {
      toggleMusic();
    } else if (inButton(x, y, GAME_W / 2 - 110, 445, 220, 52)) {
      backToMenu();
    }
  } else if (state === "question") {
    var startY = 210;
    for (var i = 0; i < 4; i++) {
      if (inButton(x, y, 90, startY + i * 62, GAME_W - 180, 52)) {
        selectedAnswer = i;
        checkAnswer(i);
        break;
      }
    }
  } else if (state === "finished") {
    if (inButton(x, y, GAME_W / 2 - 110, 430, 220, 55)) {
      restartGame();
    }
  }
});

function inButton(x, y, bx, by, bw, bh) {
  return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
}

/* ================================
   ALUR GAME
================================ */
function startGame() {
  score = 0;
  correct = 0;
  currentQuestion = 0;
  coinsCollected = 0;
  state = "play";
  resetLevel();
  startMusic();

  player.SetVar("GameScore", 0);
  player.SetVar("CorrectCount", 0);
  player.SetVar("QuestionIndex", 0);
  player.SetVar("GameFinished", false);
  player.SetVar("FeedbackText", "");
  player.SetVar("FinalMessage", "");
  player.SetVar("RankText", "");
}

function restartGame() {
  startGame();
}

function backToMenu() {
  state = "menu";
  stopMusic();
  player.SetVar("GameFinished", false);
}

function openQuestion() {
  state = "question";
  selectedAnswer = -1;
  player.SetVar("QuestionIndex", currentQuestion + 1);
}

function checkAnswer(choice) {
  var item = questions[currentQuestion];
  if (choice === item.answer) {
    correct++;
    score += ANSWER_SCORE;
    feedback = "BETUL";
    playTone(880, 0.18, "triangle", 0.08);
    setTimeout(function () { playTone(1175, 0.22, "triangle", 0.08); }, 140);
  } else {
    feedback = "SALAH";
    playTone(180, 0.28, "sawtooth", 0.08);
  }

  feedbackTimer = 110;
  player.SetVar("FeedbackText", feedback);
  player.SetVar("GameScore", score);
  player.SetVar("CorrectCount", correct);
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion >= questions.length) {
    finishGame();
  } else {
    state = "play";
    resetLevel();
  }
}

function finishGame() {
  state = "finished";
  stopMusic();

  var rank = "";
  var message = "";

  if (correct >= 9) {
    rank = "RANK S - PENJAGA BUDAYA";
    message = "SELAMAT! Kamu luar biasa dalam menjaga kearifan lokal!";
  } else if (correct >= 7) {
    rank = "RANK A - PENJELAJAH BUDAYA";
    message = "SELAMAT! Pemahamanmu tentang kearifan lokal sangat baik!";
  } else if (correct >= 5) {
    rank = "RANK B - PELAJAR BUDAYA";
    message = "SELAMAT! Kamu sudah memahami dasar kearifan lokal.";
  } else {
    rank = "RANK C - CALON PENJELAJAH";
    message = "SELAMAT SUDAH MENYELESAIKAN GAME! Ayo pelajari lagi kearifan lokal.";
  }

  player.SetVar("GameScore", score);
  player.SetVar("CorrectCount", correct);
  player.SetVar("RankText", rank);
  player.SetVar("FinalMessage", message);
  player.SetVar("GameFinished", true);
}

/* ================================
   FISIKA DAN UPDATE
================================ */
function update() {
  if (state === "play") {
    player.vx = 0;

    if (keys["arrowleft"] || keys["a"]) player.vx = -MOVE_SPEED;
    if (keys["arrowright"] || keys["d"]) player.vx = MOVE_SPEED;
    if ((keys["arrowup"] || keys["w"] || keys[" "]) && player.onGround) {
      player.vy = JUMP_POWER;
      player.onGround = false;
      playTone(660, 0.12, "square", 0.05);
    }

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    if (player.x < 0) player.x = 0;
    if (player.x + player.w > GAME_W) player.x = GAME_W - player.w;

    player.onGround = false;

    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (
        player.x + player.w > p.x &&
        player.x < p.x + p.w &&
        player.y + player.h > p.y &&
        player.y + player.h < p.y + p.h + 20 &&
        player.vy >= 0
      ) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }

    for (var c = 0; c < coins.length; c++) {
      var coin = coins[c];
      if (!coin.taken &&
        player.x + player.w > coin.x - coin.r &&
        player.x < coin.x + coin.r &&
        player.y + player.h > coin.y - coin.r &&
        player.y < coin.y + coin.r
      ) {
        coin.taken = true;
        coinsCollected++;
        score += COIN_SCORE;
        player.SetVar("GameScore", score);
        playTone(1046, 0.1, "triangle", 0.06);
      }
    }

    if (player.x + player.w >= GAME_W - 25 && coinsCollected >= 4) {
      openQuestion();
    }
  }

  if (feedbackTimer > 0) {
    feedbackTimer--;
    if (feedbackTimer === 0) {
      feedback = "";
      player.SetVar("FeedbackText", "");
      nextQuestion();
    }
  }
}

/* ================================
   GAMBAR GAME
================================ */
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawButton(x, y, w, h, text, color) {
  ctx.fillStyle = color || "#2f80ed";
  roundRect(x, y, w, h, 14);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2);
}

function draw() {
  var sky = ctx.createLinearGradient(0, 0, 0, GAME_H);
  sky.addColorStop(0, "#5ec8ff");
  sky.addColorStop(1, "#c8f0ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  ctx.fillStyle = "rgba(255,255,255,.85)";
  clouds.forEach(function (c) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 22 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x + 25 * c.s, c.y - 8 * c.s, 18 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x + 50 * c.s, c.y, 20 * c.s, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(0, GAME_H - 60, GAME_W, 60);
  ctx.fillStyle = "#27ae60";
  ctx.fillRect(0, GAME_H - 60, GAME_W, 10);

  platforms.forEach(function (p, i) {
    if (i === 0) return;
    ctx.fillStyle = "#8d5524";
    roundRect(p.x, p.y, p.w, p.h, 8);
    ctx.fill();
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(p.x, p.y, p.w, 7);
  });

  coins.forEach(function (coin) {
    if (coin.taken) return;
    ctx.fillStyle = "#ffd32a";
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e1a800";
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  if (state !== "menu") {
    ctx.fillStyle = player.color;
    roundRect(player.x, player.y, player.w, player.h, 8);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x + 7, player.y + 10, 7, 7);
    ctx.fillRect(player.x + 20, player.y + 10, 7, 7);
    ctx.fillStyle = "#2d3436";
    ctx.fillRect(player.x + 8, player.y + 12, 4, 4);
    ctx.fillRect(player.x + 21, player.y + 12, 4, 4);

    ctx.fillStyle = "rgba(0,0,0,.65)";
    roundRect(18, 18, 330, 46, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Skor: " + score + "   Koin: " + coinsCollected + "/6", 32, 41);
    ctx.fillText("Soal: " + (currentQuestion + 1) + "/10", 240, 41);
  }

  if (state === "menu") {
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PETUALANGAN KEARIFAN LOKAL", GAME_W / 2, 140);

    ctx.font = "20px Arial";
    ctx.fillText("Kearifan Lokal di Tengah Globalisasi", GAME_W / 2, 185);
    ctx.fillText("Kumpulkan koin, capai bendera, lalu jawab 10 soal IPS!", GAME_W / 2, 225);

    drawButton(GAME_W / 2 - 110, 300, 220, 58, "START", "#27ae60");
    drawButton(GAME_W / 2 - 110, 375, 220, 52, musicOn ? "MUSIK: ON" : "MUSIK: OFF", "#8e44ad");
    drawButton(GAME_W / 2 - 110, 445, 220, 52, "KEMBALI KE MENU", "#e67e22");
  }

  if (state === "play") {
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(GAME_W - 35, GAME_H - 190, 8, 130);
    ctx.beginPath();
    ctx.moveTo(GAME_W - 27, GAME_H - 190);
    ctx.lineTo(GAME_W + 5, GAME_H - 170);
    ctx.lineTo(GAME_W - 27, GAME_H - 150);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,.65)";
    roundRect(GAME_W / 2 - 300, GAME_H - 120, 600, 45, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Gunakan ← → untuk bergerak, SPASI untuk melompat", GAME_W / 2, GAME_H - 97);
  }

  if (state === "question") {
    ctx.fillStyle = "rgba(10,25,50,.93)";
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    var item = questions[currentQuestion];

    ctx.fillStyle = "#ffd32a";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SOAL " + (currentQuestion + 1) + " DARI 10", GAME_W / 2, 80);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.fillText(item.q, GAME_W / 2, 135);

    var labels = ["A", "B", "C", "D"];
    for (var i = 0; i < 4; i++) {
      var y = 210 + i * 62;
      var color = "#1f3b63";
      if (selectedAnswer === i) {
        color = i === item.answer ? "#27ae60" : "#c0392b";
      }
      drawButton(90, y, GAME_W - 180, 52, labels[i] + ". " + item.options[i], color);
    }

    if (feedback) {
      ctx.fillStyle = feedback === "BETUL" ? "rgba(39,174,96,.95)" : "rgba(192,57,43,.95)";
      roundRect(GAME_W / 2 - 180, 470, 360, 55, 15);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 30px Arial";
      ctx.fillText(feedback, GAME_W / 2, 498);
    }
  }

  if (state === "finished") {
    ctx.fillStyle = "rgba(8,20,40,.95)";
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    ctx.fillStyle = "#ffd32a";
    ctx.font = "bold 46px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SELAMAT!", GAME_W / 2, 130);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Arial";
    ctx.fillText(player.GetVar("FinalMessage"), GAME_W / 2, 190);

    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#7bed9f";
    ctx.fillText("SKOR AKHIR: " + score, GAME_W / 2, 260);

    ctx.fillStyle = "#fff";
    ctx.font = "22px Arial";
    ctx.fillText("Jawaban benar: " + correct + " dari 10", GAME_W / 2, 310);
    ctx.fillText("Koin dikumpulkan: " + coinsCollected, GAME_W / 2, 345);

    ctx.fillStyle = "#00d2d3";
    ctx.font = "bold 32px Arial";
    ctx.fillText(player.GetVar("RankText"), GAME_W / 2, 400);

    drawButton(GAME_W / 2 - 110, 430, 220, 55, "MAIN LAGI", "#e67e22");
  }

  requestAnimationFrame(draw);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
}

function Script3()
{
  (function () {
  // Tutup scanner lama jika masih terbuka
  if (window.closeARFlashcard) {
    window.closeARFlashcard();
  }

  // Buat tampilan scanner
  const overlay = document.createElement("div");
  overlay.id = "ar-flashcard-overlay";

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    background: "#000",
    zIndex: "999999",
    fontFamily: "Arial, sans-serif"
  });

  overlay.innerHTML = `
    <div style="
      position:absolute;top:12px;left:12px;right:12px;
      z-index:10;display:flex;gap:8px;align-items:center;
      justify-content:space-between;">
      <div style="color:white;font-size:16px;font-weight:bold;">
        AR Flashcard Scanner
      </div>
      <div style="display:flex;gap:8px;">
        <button id="ar-flash-toggle"
          style="padding:10px;border:0;border-radius:8px;">
          Flash
        </button>
        <button id="ar-close"
          style="padding:10px;border:0;border-radius:8px;">
          Tutup ✕
        </button>
      </div>
    </div>

    <div id="ar-status" style="
      position:absolute;bottom:20px;left:12px;right:12px;
      z-index:10;color:white;text-align:center;
      background:#0009;padding:12px;border-radius:8px;">
      Memuat AR...
    </div>

    <div id="ar-scene-container"
      style="position:absolute;inset:0;"></div>
  `;

  document.body.appendChild(overlay);

  const status = overlay.querySelector("#ar-status");
  const sceneContainer =
    overlay.querySelector("#ar-scene-container");

  let cameraTrack = null;
  let scene = null;
  let closed = false;

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  // Fungsi menutup kamera dan scanner
  window.closeARFlashcard = function () {
    closed = true;

    try {
      if (cameraTrack) {
        cameraTrack.stop();
      }

      if (scene && scene.systems &&
          scene.systems.arjs) {
        scene.systems.arjs.dispose();
      }

      // Hentikan juga track kamera yang ditemukan
      overlay.querySelectorAll("video").forEach(video => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => {
            track.stop();
          });
          video.srcObject = null;
        }
      });
    } catch (e) {
      console.warn("Pembersihan kamera:", e);
    }

    overlay.remove();
    window.closeARFlashcard = null;
  };

  overlay.querySelector("#ar-close").onclick =
    window.closeARFlashcard;

  // Tombol flash kamera (jika didukung perangkat)
  overlay.querySelector("#ar-flash-toggle").onclick =
    async function () {
      const video = overlay.querySelector("video");
      const track =
        cameraTrack ||
        (video && video.srcObject &&
          video.srcObject.getVideoTracks()[0]);

      if (!track) {
        setStatus("Kamera belum siap.");
        return;
      }

      try {
        const capabilities =
          track.getCapabilities
            ? track.getCapabilities()
            : {};

        if (!capabilities.torch) {
          setStatus(
            "Flash tidak didukung browser/perangkat ini."
          );
          return;
        }

        const settings = track.getSettings();
        const nextTorch = !settings.torch;

        await track.applyConstraints({
          advanced: [{ torch: nextTorch }]
        });

        setStatus(
          nextTorch ? "Flash aktif." : "Flash mati."
        );
      } catch (e) {
        setStatus("Flash tidak dapat diaktifkan.");
      }
    };

  // Memuat library secara berurutan
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Gagal memuat library: " + src));
      document.head.appendChild(script);
    });
  }

  async function startAR() {
    try {
      setStatus("Memuat library AR...");

      await loadScript(
        "https://aframe.io/releases/1.6.0/aframe.min.js"
      );

      if (closed) return;

      await loadScript(
        "https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js"
      );

      if (closed) return;

      // Membuat scene AR dengan marker Hiro
      sceneContainer.innerHTML = `
        <a-scene
          embedded
          vr-mode-ui="enabled: false"
          renderer="antialias: true; alpha: true"
          arjs="sourceType: webcam;
                debugUIEnabled: false;
                trackingMethod: best;">

          <a-marker
            preset="hiro"
            emitevents="true">

            <a-box
              position="0 0.5 0"
              material="color: #00D1FF; metalness: 0.2;"
              animation="
                property: rotation;
                to: 0 360 0;
                loop: true;
                dur: 4000">
            </a-box>

            <a-text
              value="AR FLASHCARD"
              position="-0.8 1.3 0"
              color="#FFFFFF"
              align="center"
              width="4">
            </a-text>

            <a-text
              value="Belajar dengan AR!"
              position="-0.8 1.0 0"
              color="#FFFF00"
              align="center"
              width="4">
            </a-text>

          </a-marker>

          <a-entity camera></a-entity>
        </a-scene>
      `;

      scene = sceneContainer.querySelector("a-scene");

      scene.addEventListener("loaded", function () {
        if (closed) return;
        setStatus(
          "Arahkan kamera ke marker Hiro pada flashcard."
        );
      }, { once: true });

      scene.addEventListener(
        "markerFound",
        function () {
          if (!closed) {
            setStatus("Flashcard terdeteksi!");
          }
        }
      );

      scene.addEventListener(
        "markerLost",
        function () {
          if (!closed) {
            setStatus("Arahkan kamera ke flashcard.");
          }
        }
      );

      // Deteksi track kamera untuk fungsi flash
      const findCamera = setInterval(() => {
        if (closed) {
          clearInterval(findCamera);
          return;
        }

        const video = overlay.querySelector("video");

        if (video && video.srcObject) {
          const tracks =
            video.srcObject.getVideoTracks();

          if (tracks.length) {
            cameraTrack = tracks[0];
            clearInterval(findCamera);
          }
        }
      }, 500);

    } catch (error) {
      console.error(error);
      setStatus(
        "Gagal membuka AR. Periksa koneksi internet, " +
        "izin kamera, dan alamat HTTPS."
      );
    }
  }

  startAR();
})();
}

