// Clean Clash: a chore stopwatch with a per-chore leaderboard.
// Attempts are stored in localStorage as { ms, attempt, date } under "chore_<name>".

const STORAGE_PREFIX = "chore_";
const TOP_N = 5;

const timerDisplay = document.getElementById("Timer");
const choreInput = document.getElementById("Chore");
const leaderboard = document.getElementById("Leaderboard");
const statusEl = document.getElementById("Status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

let startTime = 0;
let elapsedMs = 0;
let interval = null;
let isRunning = false;

/* ---------- Time helpers ---------- */

function pad(num, size = 2) {
  return String(num).padStart(size, "0");
}

// 83450 -> "00:01:23.4"
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${tenths}`;
}

// Older versions saved times as "hh:mm:ss" strings. Convert those to milliseconds.
function parseLegacyTime(text) {
  const parts = String(text).split(":").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [h, m, s] = parts;
  return (h * 3600 + m * 60 + s) * 1000;
}

/* ---------- Storage helpers ---------- */

function storageKey(chore) {
  return STORAGE_PREFIX + chore;
}

function loadAttempts(chore) {
  let raw;
  try {
    raw = JSON.parse(localStorage.getItem(storageKey(chore)));
  } catch (err) {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry, index) => {
      if (typeof entry === "string") {
        return { ms: parseLegacyTime(entry), attempt: index + 1, date: null };
      }
      const ms = typeof entry.ms === "number" ? entry.ms : parseLegacyTime(entry.time);
      return { ms, attempt: entry.attempt || index + 1, date: entry.date || null };
    })
    .filter((entry) => typeof entry.ms === "number" && entry.ms >= 0);
}

function saveAttempts(chore, attempts) {
  localStorage.setItem(storageKey(chore), JSON.stringify(attempts));
}

function listChores() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .map((key) => key.slice(STORAGE_PREFIX.length))
    .sort((a, b) => a.localeCompare(b));
}

/* ---------- Stopwatch ---------- */

function updateTimer() {
  elapsedMs = Date.now() - startTime;
  timerDisplay.textContent = formatTime(elapsedMs);
}

function setStatus(message) {
  statusEl.textContent = message;
}

function start() {
  if (isRunning) return;
  const chore = choreInput.value.trim();
  if (!chore) {
    setStatus("Enter a chore name first.");
    choreInput.focus();
    return;
  }
  isRunning = true;
  startTime = Date.now();
  elapsedMs = 0;
  interval = setInterval(updateTimer, 100);
  startBtn.disabled = true;
  stopBtn.disabled = false;
  choreInput.disabled = true;
  setStatus(`Timing "${chore}"...`);
}

function stop() {
  if (!isRunning) return;
  clearInterval(interval);
  elapsedMs = Date.now() - startTime;
  isRunning = false;
  timerDisplay.textContent = formatTime(elapsedMs);
  startBtn.disabled = false;
  stopBtn.disabled = true;
  choreInput.disabled = false;
  saveTime(choreInput.value.trim(), elapsedMs);
}

function reset() {
  clearInterval(interval);
  isRunning = false;
  elapsedMs = 0;
  timerDisplay.textContent = formatTime(0);
  startBtn.disabled = false;
  stopBtn.disabled = true;
  choreInput.disabled = false;
  setStatus("");
}

/* ---------- Leaderboard ---------- */

function saveTime(chore, ms) {
  if (!chore) return;
  const attempts = loadAttempts(chore);
  const previousBest = attempts.length ? Math.min(...attempts.map((a) => a.ms)) : null;
  const nextAttempt = attempts.length ? Math.max(...attempts.map((a) => a.attempt)) + 1 : 1;

  attempts.push({ ms, attempt: nextAttempt, date: new Date().toISOString() });
  saveAttempts(chore, attempts);

  if (previousBest === null) {
    setStatus(`Saved your first time for "${chore}": ${formatTime(ms)}.`);
  } else if (ms < previousBest) {
    setStatus(`New best for "${chore}"! ${formatTime(ms)} beats ${formatTime(previousBest)}.`);
  } else {
    setStatus(`Saved ${formatTime(ms)}. Best for "${chore}" is still ${formatTime(previousBest)}.`);
  }
  renderAllLeaderboards();
}

function renderAllLeaderboards() {
  leaderboard.innerHTML = "";
  const chores = listChores();

  if (!chores.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No times yet. Name a chore and press Start.";
    leaderboard.appendChild(empty);
    clearAllBtn.hidden = true;
    return;
  }
  clearAllBtn.hidden = false;

  chores.forEach((chore) => {
    const attempts = loadAttempts(chore);
    if (!attempts.length) return;

    const section = document.createElement("section");
    section.className = "chore-block";

    const header = document.createElement("div");
    header.className = "chore-header";

    const title = document.createElement("h3");
    title.textContent = chore;

    const count = document.createElement("span");
    count.className = "count";
    count.textContent = `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}`;

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "link-btn";
    clearBtn.textContent = "Clear";
    clearBtn.setAttribute("aria-label", `Clear times for ${chore}`);
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem(storageKey(chore));
      setStatus(`Cleared times for "${chore}".`);
      renderAllLeaderboards();
    });

    header.append(title, count, clearBtn);
    section.appendChild(header);

    const list = document.createElement("ol");
    [...attempts]
      .sort((a, b) => a.ms - b.ms)
      .slice(0, TOP_N)
      .forEach((entry) => {
        const item = document.createElement("li");
        const time = document.createElement("span");
        time.className = "time";
        time.textContent = formatTime(entry.ms);
        const label = document.createElement("span");
        label.className = "attempt";
        label.textContent = `attempt #${entry.attempt}`;
        item.append(time, label);
        list.appendChild(item);
      });

    section.appendChild(list);
    leaderboard.appendChild(section);
  });
}

/* ---------- Clear all (two clicks to confirm) ---------- */

let clearArmed = false;
let clearTimeoutId = null;

function clearAll() {
  if (!clearArmed) {
    clearArmed = true;
    clearAllBtn.textContent = "Click again to confirm";
    clearTimeoutId = setTimeout(disarmClearAll, 4000);
    return;
  }
  listChores().forEach((chore) => localStorage.removeItem(storageKey(chore)));
  disarmClearAll();
  setStatus("All chores cleared.");
  renderAllLeaderboards();
}

function disarmClearAll() {
  clearArmed = false;
  clearTimeout(clearTimeoutId);
  clearAllBtn.textContent = "Clear all chores";
}

/* ---------- Wiring ---------- */

startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
resetBtn.addEventListener("click", reset);
clearAllBtn.addEventListener("click", clearAll);
choreInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") start();
});

renderAllLeaderboards();
