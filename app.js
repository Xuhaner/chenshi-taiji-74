const moves = [
  "起势",
  "金刚捣碓",
  "懒扎衣",
  "六封四闭",
  "单鞭",
  "金刚捣碓",
  "白鹤亮翅",
  "斜行",
  "搂膝",
  "拗步",
  "斜行",
  "搂膝",
  "拗步",
  "掩手肱拳",
  "金刚捣碓",
  "撇身拳",
  "青龙出水",
  "双推掌",
  "肘下拳",
  "倒卷肱",
  "白鹤亮翅",
  "斜行",
  "闪通背",
  "掩手肱拳",
  "六封四闭",
  "单鞭",
  "云手",
  "高探马",
  "右擦脚",
  "左擦脚",
  "左蹬一跟",
  "前趟拗步",
  "击地捶",
  "踢二起",
  "护心拳",
  "旋风脚",
  "右蹬一跟",
  "掩手肱拳",
  "小擒打",
  "抱头推山",
  "六封四闭",
  "单鞭",
  "前招",
  "后招",
  "野马分鬃",
  "六封四闭",
  "单鞭",
  "玉女穿梭",
  "懒扎衣",
  "六封四闭",
  "单鞭",
  "云手",
  "摆脚跌岔",
  "金鸡独立",
  "倒卷肱",
  "白鹤亮翅",
  "斜行",
  "闪通背",
  "掩手肱拳",
  "六封四闭",
  "单鞭",
  "云手",
  "高探马",
  "十字脚",
  "指裆捶",
  "猿猴献果",
  "单鞭",
  "雀地龙",
  "上步七星",
  "下步跨虎",
  "双摆莲",
  "金刚捣碓",
  "当头炮",
  "收势",
];

const pageSize = 15;
const overlapStep = Math.floor(pageSize / 2);

const movesList = document.querySelector("#movesList");
const pageLabel = document.querySelector("#pageLabel");
const rangeLabel = document.querySelector("#rangeLabel");
const playBtn = document.querySelector("#playBtn");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const orientationBtn = document.querySelector("#orientationBtn");
const resetBtn = document.querySelector("#resetBtn");
const durationInput = document.querySelector("#durationInput");
const timingModeSelect = document.querySelector("#timingModeSelect");
const fixedDurationField = document.querySelector("#fixedDurationField");
const screenTimesPanel = document.querySelector("#screenTimesPanel");
const screenTimesGrid = document.querySelector("#screenTimesGrid");
const halfStepToggle = document.querySelector("#halfStepToggle");
const wakeLockToggle = document.querySelector("#wakeLockToggle");
const themeSelect = document.querySelector("#themeSelect");

let screenIndex = 0;
let isPlaying = false;
let timerId = null;
let wakeLock = null;
let isLandscapeView = false;
const customDurations = new Map();

function getValidSeconds(value, fallback = 60) {
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds;
  }
  return fallback;
}

function getFixedDurationMs() {
  return getValidSeconds(durationInput.value) * 1000;
}

function getMaxStartIndex() {
  return Math.max(0, moves.length - pageSize);
}

function getStep() {
  return halfStepToggle.checked ? overlapStep : pageSize;
}

function getPageStarts() {
  const starts = [];
  const step = getStep();
  const maxStartIndex = getMaxStartIndex();

  for (let index = 0; index <= maxStartIndex; index += step) {
    starts.push(index);
  }

  if (starts[starts.length - 1] !== maxStartIndex) {
    starts.push(maxStartIndex);
  }

  return starts;
}

function getCurrentStartIndex() {
  return getPageStarts()[screenIndex] ?? 0;
}

function clampScreenIndex(index) {
  const pageStarts = getPageStarts();
  return Math.min(Math.max(0, index), pageStarts.length - 1);
}

function getScreenKey(index) {
  const pageStarts = getPageStarts();
  const start = pageStarts[index] ?? 0;
  const end = Math.min(start + pageSize, moves.length);
  return `${start + 1}-${end}`;
}

function getCurrentDurationMs() {
  if (timingModeSelect.value === "fixed") {
    return getFixedDurationMs();
  }

  const key = getScreenKey(screenIndex);
  const customValue = customDurations.get(key);
  return getValidSeconds(customValue, getValidSeconds(durationInput.value)) * 1000;
}

function renderScreenTimeInputs() {
  const pageStarts = getPageStarts();
  screenTimesGrid.innerHTML = pageStarts
    .map((start, index) => {
      const end = Math.min(start + pageSize, moves.length);
      const key = `${start + 1}-${end}`;
      const value = customDurations.get(key) ?? durationInput.value;
      return `
        <label class="mini-field">
          <span>${index + 1}屏 ${key}</span>
          <input data-screen-key="${key}" type="number" min="0.1" step="0.1" value="${value}" />
        </label>
      `;
    })
    .join("");
}

function updateTimingControls() {
  const isCustom = timingModeSelect.value === "custom";
  fixedDurationField.classList.toggle("is-muted", isCustom);
  screenTimesPanel.classList.toggle("is-active", isCustom);
  if (!isCustom) screenTimesPanel.open = false;
}

function render() {
  const pageStarts = getPageStarts();
  screenIndex = clampScreenIndex(screenIndex);
  const startIndex = pageStarts[screenIndex];
  const endIndex = Math.min(startIndex + pageSize, moves.length);
  const visibleMoves = moves.slice(startIndex, endIndex);

  movesList.innerHTML = visibleMoves
    .map((name, offset) => {
      const moveNumber = startIndex + offset + 1;
      const isFocus = offset === 0 || offset === visibleMoves.length - 1;
      return `
        <li class="move ${isFocus ? "is-focus" : ""}">
          <span class="move-index">${moveNumber}</span>
          <span class="move-name">${name}</span>
        </li>
      `;
    })
    .join("");

  pageLabel.textContent = `第 ${screenIndex + 1} / ${pageStarts.length} 屏`;
  rangeLabel.textContent = `${startIndex + 1}-${endIndex}`;
  renderScreenTimeInputs();
  updateTimingControls();
}

function next() {
  const pageStarts = getPageStarts();
  screenIndex = screenIndex + 1 >= pageStarts.length ? 0 : screenIndex + 1;
  render();
}

function prev() {
  screenIndex = clampScreenIndex(screenIndex - 1);
  render();
}

function updateOrientationView() {
  document.body.classList.toggle("is-landscape-view", isLandscapeView);
  orientationBtn.textContent = isLandscapeView ? "正常显示" : "横屏显示";
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator) || !wakeLockToggle.checked || !isPlaying || wakeLock) {
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

async function releaseWakeLock() {
  if (!wakeLock) return;

  try {
    await wakeLock.release();
  } catch {
    wakeLock = null;
  }
}

function stop() {
  isPlaying = false;
  playBtn.textContent = "开始";
  window.clearTimeout(timerId);
  timerId = null;
  releaseWakeLock();
}

function play() {
  stop();
  isPlaying = true;
  playBtn.textContent = "暂停";
  requestWakeLock();
  timerId = window.setTimeout(() => {
    next();
    if (isPlaying) play();
  }, getCurrentDurationMs());
}

playBtn.addEventListener("click", () => {
  if (isPlaying) {
    stop();
  } else {
    play();
  }
});

prevBtn.addEventListener("click", () => {
  prev();
  if (isPlaying) play();
});

nextBtn.addEventListener("click", () => {
  next();
  if (isPlaying) play();
});

orientationBtn.addEventListener("click", () => {
  isLandscapeView = !isLandscapeView;
  updateOrientationView();
});

resetBtn.addEventListener("click", () => {
  screenIndex = 0;
  render();
  if (isPlaying) play();
});

function updateFixedDuration() {
  if (isPlaying) play();
}

durationInput.addEventListener("input", updateFixedDuration);
durationInput.addEventListener("change", () => {
  durationInput.value = getValidSeconds(durationInput.value).toString();
  updateFixedDuration();
});

halfStepToggle.addEventListener("change", () => {
  screenIndex = clampScreenIndex(screenIndex);
  render();
  if (isPlaying) play();
});

wakeLockToggle.addEventListener("change", () => {
  if (wakeLockToggle.checked && isPlaying) {
    requestWakeLock();
  } else {
    releaseWakeLock();
  }
});

timingModeSelect.addEventListener("change", () => {
  render();
  if (isPlaying) play();
});

function updateCustomDuration(event) {
  const input = event.target.closest("input[data-screen-key]");
  if (!input) return;
  if (event.type === "change") {
    input.value = getValidSeconds(input.value).toString();
  }
  customDurations.set(input.dataset.screenKey, input.value);
  if (isPlaying) play();
}

screenTimesGrid.addEventListener("input", updateCustomDuration);
screenTimesGrid.addEventListener("change", updateCustomDuration);

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && isPlaying) {
    requestWakeLock();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    next();
    if (isPlaying) play();
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    prev();
    if (isPlaying) play();
  }
});

document.body.dataset.theme = themeSelect.value;
updateOrientationView();
render();
