const ANGLES = [
  { deg: 0,   rad: "0",      cos: "1",      sin: "0",      tan: "0",       q: "axis", ref: "0°" },
  { deg: 30,  rad: "π/6",    cos: "√3/2",   sin: "1/2",    tan: "√3/3",    q: "I",    ref: "30°" },
  { deg: 45,  rad: "π/4",    cos: "√2/2",   sin: "√2/2",   tan: "1",       q: "I",    ref: "45°" },
  { deg: 60,  rad: "π/3",    cos: "1/2",    sin: "√3/2",   tan: "√3",      q: "I",    ref: "60°" },
  { deg: 90,  rad: "π/2",    cos: "0",      sin: "1",      tan: "undefined", q: "axis", ref: "90°" },
  { deg: 120, rad: "2π/3",   cos: "−1/2",   sin: "√3/2",   tan: "−√3",     q: "II",   ref: "60°" },
  { deg: 135, rad: "3π/4",   cos: "−√2/2",  sin: "√2/2",   tan: "−1",      q: "II",   ref: "45°" },
  { deg: 150, rad: "5π/6",   cos: "−√3/2",  sin: "1/2",    tan: "−√3/3",   q: "II",   ref: "30°" },
  { deg: 180, rad: "π",      cos: "−1",     sin: "0",      tan: "0",       q: "axis", ref: "0°" },
  { deg: 210, rad: "7π/6",   cos: "−√3/2",  sin: "−1/2",   tan: "√3/3",    q: "III",  ref: "30°" },
  { deg: 225, rad: "5π/4",   cos: "−√2/2",  sin: "−√2/2",  tan: "1",       q: "III",  ref: "45°" },
  { deg: 240, rad: "4π/3",   cos: "−1/2",   sin: "−√3/2",  tan: "√3",      q: "III",  ref: "60°" },
  { deg: 270, rad: "3π/2",   cos: "0",      sin: "−1",     tan: "undefined", q: "axis", ref: "90°" },
  { deg: 300, rad: "5π/3",   cos: "1/2",    sin: "−√3/2",  tan: "−√3",     q: "IV",   ref: "60°" },
  { deg: 315, rad: "7π/4",   cos: "√2/2",   sin: "−√2/2",  tan: "−1",      q: "IV",   ref: "45°" },
  { deg: 330, rad: "11π/6",  cos: "√3/2",   sin: "−1/2",   tan: "−√3/3",   q: "IV",   ref: "30°" }
];

const MODES = [
  {
    id: "angle",
    name: "Angle Dash",
    icon: "θ",
    color: "#67e8f9",
    description: "See a degree or radian measure, then hit its exact spot on the circle.",
    meta: "60 sec",
    tag: "Speed"
  },
  {
    id: "value",
    name: "Value Vault",
    icon: "ƒ",
    color: "#c7ff68",
    description: "Recall exact sine, cosine, and tangent values before your streak breaks.",
    meta: "10 rounds",
    tag: "Recall"
  },
  {
    id: "coord",
    name: "Coordinate Clash",
    icon: "↗",
    color: "#8b7dff",
    description: "Match each special angle to its exact (cos θ, sin θ) coordinate.",
    meta: "10 rounds",
    tag: "Patterns"
  },
  {
    id: "sign",
    name: "Sign Sprint",
    icon: "±",
    color: "#ffd166",
    description: "Master quadrant signs for sine, cosine, and tangent in rapid-fire rounds.",
    meta: "10 rounds",
    tag: "Quadrants"
  }
];

const STORE_KEY = "trigloop-progress-v1";
const SOUND_KEY = "trigloop-sound-v1";

const defaultProgress = () => ({
  xp: 0,
  games: 0,
  bestStreak: 0,
  correct: 0,
  answered: 0,
  best: { angle: 0, value: 0, coord: 0, sign: 0 }
});

let progress = loadProgress();
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
let learnFormat = "rad";
let learnIndex = 2;
let currentModeId = null;
let game = null;
let timerId = null;
let locked = false;
let toastTimer = null;

const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY));
    return { ...defaultProgress(), ...parsed, best: { ...defaultProgress().best, ...(parsed?.best || {}) } };
  } catch {
    return defaultProgress();
  }
}

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify(progress));
  updatePersistentUI();
}

function levelInfo(xp = progress.xp) {
  const levelSize = 300;
  const level = Math.floor(xp / levelSize) + 1;
  const into = xp % levelSize;
  return { level, into, remaining: levelSize - into, pct: (into / levelSize) * 100 };
}

function routeTo(view) {
  $$(".view").forEach(el => el.classList.toggle("active", el.dataset.view === view));
  $$(".nav-link").forEach(el => el.classList.toggle("active", el.dataset.route === view));
  if (view === "progress") renderProgress();
  if (view === "play") {
    $("gameArena").classList.add("hidden");
    $("modeSelect").classList.remove("hidden");
  }
  history.replaceState(null, "", `#${view}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initRouting() {
  $$("[data-route]").forEach(el => el.addEventListener("click", (e) => {
    e.preventDefault();
    routeTo(el.dataset.route);
  }));
  const hash = location.hash.replace("#", "");
  if (["home", "learn", "play", "progress"].includes(hash)) routeTo(hash);
}

function makeModeCard(mode) {
  return `
    <button class="mode-card" data-mode="${mode.id}" style="--mode-color:${mode.color}">
      <span class="mode-icon">${mode.icon}</span>
      <h3>${mode.name}</h3>
      <p>${mode.description}</p>
      <span class="mode-meta"><span>${mode.tag}</span><b>${mode.meta}</b></span>
    </button>`;
}

function renderModes() {
  $("homeModeGrid").innerHTML = MODES.map(makeModeCard).join("");
  $("modeSelect").innerHTML = MODES.map(makeModeCard).join("");
  $$("[data-mode]").forEach(card => card.addEventListener("click", () => {
    const modeId = card.dataset.mode;
    if (card.closest("#homeModeGrid")) {
      routeTo("play");
      requestAnimationFrame(() => startGame(modeId));
    } else {
      startGame(modeId);
    }
  }));
}

function pointFor(deg, radius) {
  const r = deg * Math.PI / 180;
  return { x: Math.cos(r) * radius, y: -Math.sin(r) * radius };
}

function arcPath(deg, radius = 38) {
  if (deg === 0) return "";
  const end = pointFor(deg, radius);
  const largeArc = deg > 180 ? 1 : 0;
  return `M ${radius} 0 A ${radius} ${radius} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function createCirclePoints(group, radius, labelRadius, format, onSelect) {
  group.innerHTML = "";
  ANGLES.forEach((angle, index) => {
    const p = pointFor(angle.deg, radius);
    const lp = pointFor(angle.deg, labelRadius);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add("uc-point-group");
    g.dataset.index = index;
    g.innerHTML = `
      <circle class="uc-point-hit" cx="${p.x}" cy="${p.y}" r="13"></circle>
      <circle class="uc-point" cx="${p.x}" cy="${p.y}" r="4.5"></circle>
      ${format ? `<text class="uc-label" x="${lp.x}" y="${lp.y}">${format === "rad" ? angle.rad : `${angle.deg}°`}</text>` : ""}
    `;
    g.addEventListener("click", () => onSelect(index));
    group.appendChild(g);
  });
}

function memoryTipFor(angle) {
  if ([45,135,225,315].includes(angle.deg)) {
    return `<span class="tip-icon">✦</span><p><strong>Pattern tip:</strong> 45° angles use √2/2 for both coordinate magnitudes. Only the quadrant changes the signs.</p>`;
  }
  if ([30,150,210,330].includes(angle.deg)) {
    return `<span class="tip-icon">✦</span><p><strong>Pattern tip:</strong> At a 30° reference angle, sine has magnitude 1/2 and cosine has magnitude √3/2.</p>`;
  }
  if ([60,120,240,300].includes(angle.deg)) {
    return `<span class="tip-icon">✦</span><p><strong>Pattern tip:</strong> At a 60° reference angle, sine has magnitude √3/2 and cosine has magnitude 1/2.</p>`;
  }
  return `<span class="tip-icon">✦</span><p><strong>Axis tip:</strong> Axis angles are the anchor points: (±1, 0) and (0, ±1).</p>`;
}

function renderLearnCircle() {
  createCirclePoints($("learnPoints"), 112, 139, learnFormat, setLearnAngle);
  setLearnAngle(learnIndex, false);
  $("angleChipRow").innerHTML = ANGLES.map((a, i) =>
    `<button class="angle-chip ${i === learnIndex ? "active" : ""}" data-angle-index="${i}">${learnFormat === "rad" ? a.rad : `${a.deg}°`}</button>`
  ).join("");
  $$("[data-angle-index]").forEach(b => b.addEventListener("click", () => setLearnAngle(Number(b.dataset.angleIndex))));
}

function setLearnAngle(index, animate = true) {
  learnIndex = index;
  const a = ANGLES[index];
  const p = pointFor(a.deg, 112);
  $("learnNeedle").setAttribute("x2", p.x);
  $("learnNeedle").setAttribute("y2", p.y);
  $("learnProjectionX").setAttribute("x1", p.x);
  $("learnProjectionX").setAttribute("y1", p.y);
  $("learnProjectionX").setAttribute("x2", p.x);
  $("learnProjectionX").setAttribute("y2", 0);
  $("learnProjectionY").setAttribute("x1", 0);
  $("learnProjectionY").setAttribute("y1", p.y);
  $("learnProjectionY").setAttribute("x2", p.x);
  $("learnProjectionY").setAttribute("y2", p.y);
  $("learnArc").setAttribute("d", arcPath(a.deg));

  $$("#learnPoints .uc-point-group").forEach((g, i) => g.classList.toggle("active", i === index));
  $$(".angle-chip").forEach((b, i) => b.classList.toggle("active", i === index));

  $("factDegrees").textContent = `${a.deg}°`;
  $("factRadians").textContent = a.rad;
  $("factCoordinate").textContent = `(${a.cos}, ${a.sin})`;
  $("factCos").textContent = a.cos;
  $("factSin").textContent = a.sin;
  $("factTan").textContent = a.tan;
  $("factQuadrant").textContent = a.q === "axis" ? "Axis" : a.q;
  $("factReference").textContent = a.ref;
  $("memoryTip").innerHTML = memoryTipFor(a);

  if (animate) tone("tap");
}

function initLearn() {
  renderLearnCircle();
  $$(".segment").forEach(btn => btn.addEventListener("click", () => {
    learnFormat = btn.dataset.format;
    $$(".segment").forEach(b => b.classList.toggle("active", b === btn));
    renderLearnCircle();
  }));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - .5);
}

function uniqueChoices(correct, pool, count = 4) {
  const others = shuffled([...new Set(pool.filter(x => x !== correct))]).slice(0, count - 1);
  return shuffled([correct, ...others]);
}

function startGame(modeId) {
  const mode = MODES.find(m => m.id === modeId);
  currentModeId = modeId;
  clearInterval(timerId);
  locked = false;

  game = {
    mode: modeId,
    score: 0,
    streak: 0,
    bestStreak: 0,
    answered: 0,
    correct: 0,
    round: 0,
    total: modeId === "angle" ? Infinity : 10,
    time: modeId === "angle" ? 60 : null,
    question: null
  };

  $("modeSelect").classList.add("hidden");
  $("gameArena").classList.remove("hidden");
  $("gameModeName").textContent = mode.name;
  $("gameModeEyebrow").textContent = mode.tag.toUpperCase();
  $("gameScore").textContent = "0";
  $("gameStreak").textContent = "0";
  $("timerHud").classList.toggle("hidden", modeId !== "angle");
  $("gameTimer").textContent = "60";
  $("gameProgressBar").style.width = "0%";
  $("feedbackLine").className = "feedback-line";
  $("feedbackLine").textContent = "";
  $("gameArena").scrollIntoView({ behavior: "smooth", block: "start" });

  if (modeId === "angle") {
    timerId = setInterval(() => {
      if (!game) return;
      game.time -= 1;
      $("gameTimer").textContent = game.time;
      $("gameProgressBar").style.width = `${100 - (game.time / 60 * 100)}%`;
      if (game.time <= 0) finishGame();
    }, 1000);
  }

  nextQuestion();
}

function exitGame() {
  clearInterval(timerId);
  game = null;
  locked = false;
  $("gameArena").classList.add("hidden");
  $("modeSelect").classList.remove("hidden");
  $("modeSelect").scrollIntoView({ behavior: "smooth", block: "start" });
}

function nextQuestion() {
  if (!game) return;
  if (game.mode !== "angle" && game.round >= game.total) {
    finishGame();
    return;
  }

  game.round += 1;
  locked = false;
  $("feedbackLine").className = "feedback-line";
  $("feedbackLine").textContent = "";
  $("questionCount").textContent = game.mode === "angle" ? `HIT ${game.round}` : `QUESTION ${game.round} / ${game.total}`;
  if (game.mode !== "angle") $("gameProgressBar").style.width = `${((game.round - 1) / game.total) * 100}%`;

  $$("#gamePoints .uc-point-group").forEach(g => g.classList.remove("correct", "wrong", "active"));
  $("gameNeedle").classList.add("muted");

  if (game.mode === "angle") setupAngleQuestion();
  if (game.mode === "value") setupValueQuestion();
  if (game.mode === "coord") setupCoordinateQuestion();
  if (game.mode === "sign") setupSignQuestion();
}

function setupAngleQuestion() {
  const angle = randomItem(ANGLES);
  const useRadians = Math.random() > .38;
  game.question = { angle, correctIndex: ANGLES.indexOf(angle) };
  $("questionBadge").textContent = useRadians ? "RADIANS" : "DEGREES";
  $("questionText").textContent = `Tap ${useRadians ? angle.rad : `${angle.deg}°`}`;
  $("questionSubtext").textContent = "Choose its exact position on the unit circle.";
  $("gameCircleWrap").classList.remove("hidden");
  $("answerGrid").classList.add("hidden");
  createCirclePoints($("gamePoints"), 110, 0, null, answerCirclePoint);
}

function setupValueQuestion() {
  const angle = randomItem(ANGLES);
  const funcs = ["sin", "cos", "tan"];
  const fn = randomItem(funcs);
  const correct = angle[fn];
  const pool = ANGLES.map(a => a[fn]);
  game.question = { angle, fn, correct, choices: uniqueChoices(correct, pool) };
  $("questionBadge").textContent = fn.toUpperCase();
  $("questionText").textContent = `${fn}(${angle.rad}) = ?`;
  $("questionSubtext").textContent = `Choose the exact ${fn} value.`;
  showNeedle(angle);
  renderAnswerButtons(game.question.choices, correct);
}

function setupCoordinateQuestion() {
  const angle = randomItem(ANGLES);
  const correct = `(${angle.cos}, ${angle.sin})`;
  const pool = ANGLES.map(a => `(${a.cos}, ${a.sin})`);
  game.question = { angle, correct, choices: uniqueChoices(correct, pool) };
  $("questionBadge").textContent = Math.random() > .5 ? "RADIANS" : "DEGREES";
  const radians = $("questionBadge").textContent === "RADIANS";
  $("questionText").textContent = `${radians ? angle.rad : `${angle.deg}°`} lands where?`;
  $("questionSubtext").textContent = "Remember: (x, y) = (cos θ, sin θ).";
  showNeedle(angle);
  renderAnswerButtons(game.question.choices, correct);
}

function setupSignQuestion() {
  const quadrant = randomItem(["I", "II", "III", "IV"]);
  const patterns = {
    I:   "sin + · cos + · tan +",
    II:  "sin + · cos − · tan −",
    III: "sin − · cos − · tan +",
    IV:  "sin − · cos + · tan −"
  };
  const correct = patterns[quadrant];
  game.question = { quadrant, correct, choices: shuffled(Object.values(patterns)) };
  $("questionBadge").textContent = "QUADRANTS";
  $("questionText").textContent = `Signs in Quadrant ${quadrant}?`;
  $("questionSubtext").textContent = "Pick the sign pattern for sine, cosine, and tangent.";
  $("gameCircleWrap").classList.add("hidden");
  renderAnswerButtons(game.question.choices, correct);
}

function showNeedle(angle) {
  $("gameCircleWrap").classList.remove("hidden");
  createCirclePoints($("gamePoints"), 110, 0, null, () => {});
  const p = pointFor(angle.deg, 110);
  $("gameNeedle").setAttribute("x2", p.x);
  $("gameNeedle").setAttribute("y2", p.y);
  $("gameNeedle").classList.remove("muted");
}

function renderAnswerButtons(choices, correct) {
  $("answerGrid").classList.remove("hidden");
  const keys = ["A", "B", "C", "D"];
  $("answerGrid").innerHTML = choices.map((choice, i) =>
    `<button class="answer-btn" data-answer="${escapeHtml(choice)}" data-key="${keys[i]}">${choice}</button>`
  ).join("");
  $$(".answer-btn", $("answerGrid")).forEach(btn => btn.addEventListener("click", () => answerChoice(btn, btn.dataset.answer === correct)));
}

function answerCirclePoint(index) {
  if (locked || !game) return;
  locked = true;
  const correct = index === game.question.correctIndex;
  const groups = $$("#gamePoints .uc-point-group");
  groups[index]?.classList.add(correct ? "correct" : "wrong");
  groups[game.question.correctIndex]?.classList.add("correct");
  handleAnswer(correct, ANGLES[game.question.correctIndex].rad);
}

function answerChoice(button, correct) {
  if (locked || !game) return;
  locked = true;
  button.classList.add(correct ? "correct" : "wrong");
  $$(".answer-btn", $("answerGrid")).forEach(b => {
    b.disabled = true;
    if (b.dataset.answer === game.question.correct) b.classList.add("correct");
  });
  handleAnswer(correct, game.question.correct);
}

function handleAnswer(correct, correctAnswer) {
  if (!game) return;
  game.answered += 1;

  if (correct) {
    game.correct += 1;
    game.streak += 1;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    const multiplier = Math.min(4, 1 + Math.floor((game.streak - 1) / 3));
    const gained = 10 * multiplier;
    game.score += gained;
    $("feedbackLine").className = "feedback-line show good";
    $("feedbackLine").textContent = `Correct · +${gained} points${multiplier > 1 ? ` · x${multiplier} combo` : ""}`;
    document.body.classList.remove("wrong-flash");
    document.body.classList.add("correct-flash");
    setTimeout(() => document.body.classList.remove("correct-flash"), 300);
    tone("good");
    if (game.streak > 1) burstConfetti(Math.min(16, 5 + game.streak));
  } else {
    game.streak = 0;
    $("feedbackLine").className = "feedback-line show bad";
    $("feedbackLine").textContent = `Not quite · correct answer: ${correctAnswer}`;
    document.body.classList.remove("correct-flash");
    document.body.classList.add("wrong-flash");
    setTimeout(() => document.body.classList.remove("wrong-flash"), 300);
    tone("bad");
  }

  $("gameScore").textContent = game.score;
  $("gameStreak").textContent = game.streak;
  if (game.mode !== "angle") $("gameProgressBar").style.width = `${(game.round / game.total) * 100}%`;

  setTimeout(() => {
    if (game) nextQuestion();
  }, correct ? 620 : 950);
}

function finishGame() {
  if (!game) return;
  clearInterval(timerId);
  locked = true;
  const finished = { ...game };
  const accuracy = finished.answered ? Math.round(finished.correct / finished.answered * 100) : 0;
  const xpEarned = Math.max(5, Math.round(finished.score * .6 + finished.correct * 2));

  progress.xp += xpEarned;
  progress.games += 1;
  progress.correct += finished.correct;
  progress.answered += finished.answered;
  progress.bestStreak = Math.max(progress.bestStreak, finished.bestStreak);
  progress.best[finished.mode] = Math.max(progress.best[finished.mode] || 0, finished.score);
  saveProgress();

  $("resultScore").textContent = finished.score;
  $("resultAccuracy").textContent = `${accuracy}%`;
  $("resultXp").textContent = `+${xpEarned}`;
  $("resultTitle").textContent = accuracy >= 90 ? "Circle locked in." : accuracy >= 70 ? "Strong run." : "Keep the loop going.";
  $("resultSubtitle").textContent =
    accuracy >= 90 ? "Fast and accurate — that pattern recognition is working." :
    accuracy >= 70 ? "You are building reliable recall. Another run will make it faster." :
    "Use Learn for a quick pattern refresh, then try again.";
  $("resultModal").classList.remove("hidden");
  burstConfetti(28);
  tone("finish");
  game = null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function burstConfetti(count = 12) {
  const colors = ["#8b7dff", "#67e8f9", "#c7ff68", "#ffd166", "#ff6b86"];
  const layer = $("confettiLayer");
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("span");
    bit.className = "confetti";
    bit.style.setProperty("--c", randomItem(colors));
    bit.style.setProperty("--x", `${(Math.random() - .5) * 440}px`);
    bit.style.setProperty("--y", `${(Math.random() * 320) - 120}px`);
    bit.style.setProperty("--r", `${(Math.random() - .5) * 820}deg`);
    bit.style.left = `${45 + Math.random() * 10}%`;
    bit.style.top = `${42 + Math.random() * 10}%`;
    layer.appendChild(bit);
    setTimeout(() => bit.remove(), 900);
  }
}

function tone(type) {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const map = {
      tap: [380, .035],
      good: [620, .075],
      bad: [180, .09],
      finish: [760, .12]
    };
    const [freq, duration] = map[type] || map.tap;
    osc.frequency.setValueAtTime(freq, now);
    if (type === "good" || type === "finish") osc.frequency.exponentialRampToValueAtTime(freq * 1.28, now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.055, now + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + .02);
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
  $("soundToggle").classList.toggle("muted", !soundEnabled);
  $("soundToggle").setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  if (soundEnabled) tone("tap");
  showToast(soundEnabled ? "Sound on" : "Sound off");
}

function showToast(message) {
  const toast = $("toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function updatePersistentUI() {
  const level = levelInfo();
  $("headerXp").textContent = progress.xp.toLocaleString();
  $("playLevel").textContent = level.level;
}

function renderProgress() {
  const level = levelInfo();
  $("progressXp").textContent = progress.xp.toLocaleString();
  $("progressGames").textContent = progress.games;
  $("progressStreak").textContent = progress.bestStreak;
  $("progressAccuracy").textContent = progress.answered ? `${Math.round(progress.correct / progress.answered * 100)}%` : "—";
  $("progressLevelText").textContent = `Level ${level.level} · ${level.remaining} XP to next level`;
  $("xpTrackFill").style.width = `${level.pct}%`;

  $("bestScoreGrid").innerHTML = MODES.map(mode => `
    <article class="best-card">
      <span>Best score</span>
      <h3>${mode.name}</h3>
      <strong>${progress.best[mode.id] || 0}</strong>
    </article>`).join("");
}

function resetProgress() {
  if (!confirm("Reset all TrigLoop XP, scores, streaks, and accuracy on this browser?")) return;
  progress = defaultProgress();
  saveProgress();
  renderProgress();
  showToast("Progress reset");
}

function initGameControls() {
  $("exitGame").addEventListener("click", exitGame);
  $("closeModal").addEventListener("click", () => $("resultModal").classList.add("hidden"));
  $("backToModes").addEventListener("click", () => {
    $("resultModal").classList.add("hidden");
    $("gameArena").classList.add("hidden");
    $("modeSelect").classList.remove("hidden");
  });
  $("playAgain").addEventListener("click", () => {
    $("resultModal").classList.add("hidden");
    startGame(currentModeId);
  });
  $("resultModal").addEventListener("click", (e) => {
    if (e.target === $("resultModal")) $("resultModal").classList.add("hidden");
  });
  document.addEventListener("keydown", (e) => {
    if (!game || locked || $("answerGrid").classList.contains("hidden")) return;
    const keyMap = { "1": 0, "a": 0, "2": 1, "b": 1, "3": 2, "c": 2, "4": 3, "d": 3 };
    const index = keyMap[e.key.toLowerCase()];
    const buttons = $$(".answer-btn", $("answerGrid"));
    if (index !== undefined && buttons[index]) buttons[index].click();
  });
}

function init() {
  initRouting();
  renderModes();
  initLearn();
  initGameControls();
  updatePersistentUI();
  renderProgress();

  $("soundToggle").classList.toggle("muted", !soundEnabled);
  $("soundToggle").addEventListener("click", toggleSound);
  $("resetProgress").addEventListener("click", resetProgress);
}

init();
