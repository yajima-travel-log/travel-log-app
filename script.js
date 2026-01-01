document.addEventListener("DOMContentLoaded", () => {
  // ----- DOM -----
  const logList = document.getElementById("logList");
  const addBtn = document.getElementById("addBtn");
  const sortNewBtn = document.getElementById("sortNew");
  const sortOldBtn = document.getElementById("sortOld");

  const prefSelect = document.getElementById("prefSelect");
  const selectedPrefsDiv = document.getElementById("selectedPrefs");

  const countrySelect = document.getElementById("countrySelect");
  const selectedCountriesDiv = document.getElementById("selectedCountries");

  const world = document.getElementById("worldMapContainer");

  if (!logList) {
    console.error("logList が見つからない");
    return;
  }

  // ----- State -----
  // セレクトで選んだ分（＝タグ表示対象）
  let selectedPrefs = new Set();
let selectedCountries = new Set();
localStorage.removeItem("visitedPrefs");
localStorage.removeItem("visitedCountries");


  // 地図を直接クリックして塗った分（＝タグ表示しない）
  let paintedPrefs = new Set(JSON.parse(localStorage.getItem("paintedPrefs") || "[]"));
  let paintedCountries = new Set(JSON.parse(localStorage.getItem("paintedCountries") || "[]"));

  // ログに書かれている国/都道府県（＝塗りっぱなし）
  let lockedPrefs = new Set();
  let lockedCountries = new Set();

  // ----- Helpers -----
  const saveSelectedPrefs = () =>
    localStorage.setItem("visitedPrefs", JSON.stringify([...selectedPrefs]));
  const saveSelectedCountries = () =>
    localStorage.setItem("visitedCountries", JSON.stringify([...selectedCountries]));

  const savePaintedPrefs = () =>
    localStorage.setItem("paintedPrefs", JSON.stringify([...paintedPrefs]));
  const savePaintedCountries = () =>
    localStorage.setItem("paintedCountries", JSON.stringify([...paintedCountries]));

  const saveLogs = () => localStorage.setItem("travelLogs", logList.innerHTML);

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}年${m}月${d}日`;
  }

  function calcStay(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const days = diffTime / (1000 * 60 * 60 * 24) + 1;
    const nights = days - 1;
    return { days, nights };
  }

  function renderStars(num) {
    return "★".repeat(Number(num));
  }

  function normalizeDataStartDateFromLogList() {
    logList.querySelectorAll("li").forEach((li) => {
      if (li.dataset.startDate) return;
      const dateText = li.querySelector(".logDate")?.textContent;
      if (!dateText) return;
      const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (!match) return;
      const [, y, m, d] = match;
      li.dataset.startDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    });
  }

  function sortLogsByDate(desc = true) {
    const items = Array.from(logList.children);
    items.sort((a, b) => {
      const dateA = new Date(a.dataset.startDate || "1970-01-01");
      const dateB = new Date(b.dataset.startDate || "1970-01-01");
      return desc ? dateB - dateA : dateA - dateB;
    });
    items.forEach((item) => logList.appendChild(item));
    saveLogs();
  }

  function buildTextToValueMap(selectEl) {
    const map = new Map();
    if (!selectEl) return map;
    Array.from(selectEl.options).forEach((opt) => {
      const label = (opt.textContent || "").trim();
      if (!label) return;
      map.set(label, opt.value);
    });
    return map;
  }

  function recomputeLockedFromLogs() {
    lockedPrefs = new Set();
    lockedCountries = new Set();

    const prefMap = buildTextToValueMap(prefSelect);
    const countryMap = buildTextToValueMap(countrySelect);

    logList.querySelectorAll(".logPrefs .prefTag").forEach((tag) => {
      const label = (tag.textContent || "").trim();
      const code = prefMap.get(label);
      if (code) lockedPrefs.add(code);
    });

    logList.querySelectorAll(".logCountries .countryTag").forEach((tag) => {
      const label = (tag.textContent || "").trim();
      const key = countryMap.get(label);
      if (key) lockedCountries.add(key);
    });
  }

  // 塗る対象 = セレクト選択 + 地図手塗り + ログロック
  function getPaintPrefs() {
    return new Set([...selectedPrefs, ...paintedPrefs, ...lockedPrefs]);
  }
  function getPaintCountries() {
    return new Set([...selectedCountries, ...paintedCountries, ...lockedCountries]);
  }

  // ----- Render -----
  function renderPrefMap() {
    document.querySelectorAll(".prefecture.visited").forEach((el) => el.classList.remove("visited"));

    const paint = getPaintPrefs();
    paint.forEach((code) => {
      const pref = document.querySelector(`.prefecture[data-code="${CSS.escape(code)}"]`);
      if (pref) pref.classList.add("visited");
    });
  }

  function renderWorldMap() {
    if (!world) return;
    world.querySelectorAll("path.country.visited").forEach((p) => p.classList.remove("visited"));

    const paint = getPaintCountries();
    paint.forEach((key) => {
      world.querySelectorAll(`path[data-country="${CSS.escape(key)}"]`).forEach((p) => p.classList.add("visited"));
    });
  }

  // selectは「セレクト選択」だけ同期（地図手塗りは反映しない）
  function syncPrefSelectFromSelected() {
    if (!prefSelect) return;
    Array.from(prefSelect.options).forEach((opt) => (opt.selected = selectedPrefs.has(opt.value)));
  }
  function syncCountrySelectFromSelected() {
    if (!countrySelect) return;
    Array.from(countrySelect.options).forEach((opt) => (opt.selected = selectedCountries.has(opt.value)));
  }

  // タグも「セレクト選択」だけ表示（地図手塗りは表示しない）
  function renderPrefTags() {
    if (!selectedPrefsDiv || !prefSelect) return;
    selectedPrefsDiv.innerHTML = "";
    Array.from(prefSelect.options).forEach((opt) => {
      if (!selectedPrefs.has(opt.value)) return;
      const tag = document.createElement("span");
      tag.className = "prefTag";
      tag.textContent = opt.textContent;
      selectedPrefsDiv.appendChild(tag);
    });
  }
  function renderCountryTags() {
    if (!selectedCountriesDiv || !countrySelect) return;
    selectedCountriesDiv.innerHTML = "";
    Array.from(countrySelect.options).forEach((opt) => {
      if (!selectedCountries.has(opt.value)) return;
      const tag = document.createElement("span");
      tag.className = "countryTag";
      tag.textContent = opt.textContent;
      selectedCountriesDiv.appendChild(tag);
    });
  }

  function renderAll() {
    syncPrefSelectFromSelected();
    syncCountrySelectFromSelected();
    renderPrefMap();
    renderWorldMap();
    renderPrefTags();
    renderCountryTags();
  }

  // ----- Init: restore logs -----
  const savedLogs = localStorage.getItem("travelLogs");
  if (savedLogs) logList.innerHTML = savedLogs;
  normalizeDataStartDateFromLogList();

  // ----- Init: world paths data-country + select options -----
  function initWorldDataCountry() {
    if (!world) return;
    world.querySelectorAll("path").forEach((p) => {
      const key = p.getAttribute("name") || p.getAttribute("id") || p.getAttribute("class");
      if (!key) return;
      p.classList.add("country");
      p.dataset.country = key;
    });
  }

  function initCountrySelectOptions() {
    if (!countrySelect || !world) return;
    countrySelect.innerHTML = "";
    const set = new Set();
    world.querySelectorAll("path.country").forEach((p) => {
      if (p.dataset.country) set.add(p.dataset.country);
    });
    [...set].sort().forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = String(name).replace(/_/g, " ");
      countrySelect.appendChild(opt);
    });
  }

  function initPrefSelectOptions() {
    if (!prefSelect) return;
    prefSelect.innerHTML = "";
    document.querySelectorAll(".prefecture").forEach((pref) => {
      const code = pref.dataset.code;
      const title = pref.querySelector("title")?.textContent || "";
      const name = title.split("/")[0].trim();
      if (!code || !name) return;
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = name;
      prefSelect.appendChild(opt);
    });
  }

  initWorldDataCountry();
  initCountrySelectOptions();
  initPrefSelectOptions();

  // options生成後にロック再計算
  recomputeLockedFromLogs();

  // 初回レンダー
  renderAll();

  // ----- Events: prefecture map click（地図手塗りだけ更新） -----
  document.querySelectorAll(".prefecture path").forEach((path) => {
    path.addEventListener("click", () => {
      const pref = path.closest(".prefecture");
      if (!pref) return;
      const code = pref.dataset.code;
      if (!code) return;

      // ログ由来は消せない（塗りっぱなし）
      if (lockedPrefs.has(code)) return;

      // 地図手塗りのトグル（selectedは触らない）
      if (paintedPrefs.has(code)) paintedPrefs.delete(code);
      else paintedPrefs.add(code);

      savePaintedPrefs();
      renderAll();
    });
  });

  // ----- Events: world map click（地図手塗りだけ更新） -----
  if (world) {
    world.addEventListener("click", (e) => {
      const path = e.target.closest("path.country");
      if (!path) return;
      const key = path.dataset.country;
      if (!key) return;

      if (lockedCountries.has(key)) return;

      if (paintedCountries.has(key)) paintedCountries.delete(key);
      else paintedCountries.add(key);

      savePaintedCountries();
      renderAll();
    });
  }

  // ----- Events: selects change（selectedだけ更新） -----
  if (prefSelect) {
    prefSelect.addEventListener("change", () => {
      selectedPrefs = new Set(Array.from(prefSelect.selectedOptions).map((o) => o.value));
      saveSelectedPrefs();
      renderAll();
    });
  }

  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      selectedCountries = new Set(Array.from(countrySelect.selectedOptions).map((o) => o.value));
      saveSelectedCountries();
      renderAll();
    });
  }

  // ----- Events: add log -----
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const place = document.getElementById("place")?.value || "";
      const startDate = document.getElementById("startDate")?.value || "";
      const endDate = document.getElementById("endDate")?.value || "";
      const memo = document.getElementById("memo")?.value || "";
      const rating = document.getElementById("rating")?.value || "";

      if (!place || !startDate || !endDate || !rating) return;
      if (new Date(startDate) > new Date(endDate)) {
        alert("終了日は開始日以降にしてね");
        return;
      }

      const selectedPrefCodes = prefSelect ? Array.from(prefSelect.selectedOptions).map((o) => o.value) : [];
      const selectedCountryCodes = countrySelect ? Array.from(countrySelect.selectedOptions).map((o) => o.value) : [];

      const prefTagsHtml = selectedPrefCodes
        .map((code) => {
          const opt = prefSelect?.querySelector(`option[value="${CSS.escape(code)}"]`);
          const name = opt ? opt.textContent : code;
          return `<span class="prefTag">${name}</span>`;
        })
        .join("");

      const countryTagsHtml = selectedCountryCodes
        .map((code) => {
          const opt = countrySelect?.querySelector(`option[value="${CSS.escape(code)}"]`);
          const name = opt ? opt.textContent : code;
          return `<span class="countryTag">${name}</span>`;
        })
        .join("");

      const stay = calcStay(startDate, endDate);

      const li = document.createElement("li");
      li.dataset.startDate = startDate;

      li.innerHTML = `
        <div class="logContent">
          <div class="logDate">
            ${formatDate(startDate)}〜${formatDate(endDate)}
            （${stay.nights}泊${stay.days}日）
          </div>

          <div class="logPlace">${place}</div>
          <div class="logStars">${renderStars(rating)}</div>
          <div class="logMemo">${memo}</div>

          <div class="logPrefs">${prefTagsHtml}</div>
          <div class="logCountries">${countryTagsHtml}</div>
        </div>

        <div class="logActions">
          <button class="editBtn">編集</button>
          <button class="deleteBtn">削除</button>
        </div>
      `;

      logList.appendChild(li);
      saveLogs();

      // ログ追加 → ロック再計算 → 塗り更新
      recomputeLockedFromLogs();
      renderAll();
    });
  }

  // ----- Events: edit/delete log -----
  logList.addEventListener("click", (e) => {
    const target = e.target;

    if (target.classList.contains("editBtn")) {
      const li = target.closest("li");
      if (!li) return;

      const memoEl = li.querySelector(".logMemo");
      const starsEl = li.querySelector(".logStars");
      if (!memoEl || !starsEl) return;

      const currentMemo = memoEl.textContent;
      const currentStars = starsEl.textContent.length;

      const newMemo = prompt("メモを編集してね", currentMemo);
      if (newMemo === null) return;

      const newRating = prompt("評価を1〜5で入力してね", String(currentStars));
      const n = Number(newRating);
      if (!newRating || Number.isNaN(n) || n < 1 || n > 5) return;

      memoEl.textContent = newMemo;
      starsEl.textContent = "★".repeat(n);

      saveLogs();
    }

    if (target.classList.contains("deleteBtn")) {
      const li = target.closest("li");
      if (!li) return;
      li.remove();
      saveLogs();

      // ログ削除 → ロック再計算
      recomputeLockedFromLogs();
      renderAll();
    }
  });

  // ----- Events: sort -----
  sortNewBtn?.addEventListener("click", () => sortLogsByDate(true));
  sortOldBtn?.addEventListener("click", () => sortLogsByDate(false));

  console.log("✅ script.js loaded (map paint does NOT affect select/tags)");
});
