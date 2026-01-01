// ========= Stable script.js (replace whole file) =========

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

  // ない要素がある場合でも落ちないようにガード
  if (!logList) {
    console.error("logList が見つからない");
    return;
  }

  // ----- State (single source of truth) -----
  let visitedPrefs = new Set(JSON.parse(localStorage.getItem("visitedPrefs") || "[]"));
  let visitedCountries = new Set(JSON.parse(localStorage.getItem("visitedCountries") || "[]"));

  // ----- Helpers -----
  const saveVisitedPrefs = () =>
    localStorage.setItem("visitedPrefs", JSON.stringify([...visitedPrefs]));

  const saveVisitedCountries = () =>
    localStorage.setItem("visitedCountries", JSON.stringify([...visitedCountries]));

  const saveLogs = () =>
    localStorage.setItem("travelLogs", logList.innerHTML);

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
    // travelLogs を innerHTML で復元したときに dataset が消えてるので補う
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

  // ----- Render (maps + selects + tags) -----
  function renderPrefMap() {
    document.querySelectorAll(".prefecture.visited").forEach((el) => el.classList.remove("visited"));
    visitedPrefs.forEach((code) => {
      const pref = document.querySelector(`.prefecture[data-code="${CSS.escape(code)}"]`);
      if (pref) pref.classList.add("visited");
    });
  }

  function renderWorldMap() {
    if (!world) return;
    world.querySelectorAll("path.country.visited").forEach((p) => p.classList.remove("visited"));
    visitedCountries.forEach((key) => {
      world
        .querySelectorAll(`path[data-country="${CSS.escape(key)}"]`)
        .forEach((p) => p.classList.add("visited"));
    });
  }

  function renderPrefTags() {
    if (!selectedPrefsDiv || !prefSelect) return;
    selectedPrefsDiv.innerHTML = "";
    Array.from(prefSelect.selectedOptions).forEach((opt) => {
      const tag = document.createElement("span");
      tag.className = "prefTag";
      tag.textContent = opt.textContent;
      selectedPrefsDiv.appendChild(tag);
    });
  }

  function renderCountryTags() {
    if (!selectedCountriesDiv || !countrySelect) return;
    selectedCountriesDiv.innerHTML = "";
    Array.from(countrySelect.selectedOptions).forEach((opt) => {
      const tag = document.createElement("span");
      tag.className = "countryTag";
      tag.textContent = opt.textContent;
      selectedCountriesDiv.appendChild(tag);
    });
  }

  function syncPrefSelectFromState() {
    if (!prefSelect) return;
    Array.from(prefSelect.options).forEach((opt) => (opt.selected = visitedPrefs.has(opt.value)));
  }

  function syncCountrySelectFromState() {
    if (!countrySelect) return;
    Array.from(countrySelect.options).forEach((opt) => (opt.selected = visitedCountries.has(opt.value)));
  }

  function renderAll() {
    renderPrefMap();
    renderWorldMap();
    syncPrefSelectFromState();
    syncCountrySelectFromState();
    renderPrefTags();
    renderCountryTags();
  }

  // ----- Init: restore logs -----
  const savedLogs = localStorage.getItem("travelLogs");
  if (savedLogs) {
    logList.innerHTML = savedLogs;
  }
  normalizeDataStartDateFromLogList();

  // ----- Init: world paths data-country + select options -----
  function initWorldDataCountry() {
    if (!world) return;
    const worldPaths = world.querySelectorAll("path");
    worldPaths.forEach((p) => {
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

  // ----- Init: pref select options -----
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

  // 初回レンダー
  renderAll();

  // ----- Events: prefecture map click -----
  document.querySelectorAll(".prefecture path").forEach((path) => {
    path.addEventListener("click", () => {
      const pref = path.closest(".prefecture");
      if (!pref) return;
      const code = pref.dataset.code;
      if (!code) return;

      if (visitedPrefs.has(code)) visitedPrefs.delete(code);
      else visitedPrefs.add(code);

      saveVisitedPrefs();
      renderAll();
    });
  });

  // ----- Events: world map click -----
  if (world) {
    world.addEventListener("click", (e) => {
      const path = e.target.closest("path.country");
      if (!path) return;
      const key = path.dataset.country;
      if (!key) return;

      if (visitedCountries.has(key)) visitedCountries.delete(key);
      else visitedCountries.add(key);

      saveVisitedCountries();
      renderAll();
    });
  }

  // ----- Events: selects change -----
  if (prefSelect) {
    prefSelect.addEventListener("change", () => {
      visitedPrefs = new Set(Array.from(prefSelect.selectedOptions).map((o) => o.value));
      saveVisitedPrefs();
      renderAll();
    });
  }

  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      visitedCountries = new Set(Array.from(countrySelect.selectedOptions).map((o) => o.value));
      saveVisitedCountries();
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

      const selectedPrefCodes = prefSelect
        ? Array.from(prefSelect.selectedOptions).map((o) => o.value)
        : [];
      const selectedCountryCodes = countrySelect
        ? Array.from(countrySelect.selectedOptions).map((o) => o.value)
        : [];

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

      // 選択された都道府県/国を visited にも反映（＝地図も塗れる）
      selectedPrefCodes.forEach((c) => visitedPrefs.add(c));
      selectedCountryCodes.forEach((c) => visitedCountries.add(c));
      saveVisitedPrefs();
      saveVisitedCountries();
      renderAll();
    });
  }

  // ----- Events: edit/delete log -----
  logList.addEventListener("click", (e) => {
    const target = e.target;

    // 編集
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

    // 削除
    if (target.classList.contains("deleteBtn")) {
      const li = target.closest("li");
      if (!li) return;
      li.remove();
      saveLogs();
    }
  });

  // ----- Events: sort -----
  sortNewBtn?.addEventListener("click", () => sortLogsByDate(true));
  sortOldBtn?.addEventListener("click", () => sortLogsByDate(false));

  console.log("✅ script.js loaded (stable)");
});
