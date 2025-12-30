console.log("script.js 読み込まれた！");



document.getElementById("startDate").value;
document.getElementById("endDate").value;




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
  return "★".repeat(num);
}

function sortLogsByDate(desc = true) {
  const items = Array.from(logList.children);

  items.sort((a, b) => {
    const dateA = new Date(a.dataset.startDate);
    const dateB = new Date(b.dataset.startDate);

    return desc ? dateB - dateA : dateA - dateB;
  });

  items.forEach(item => logList.appendChild(item));
}




const addBtn = document.getElementById("addBtn");
const logList = document.getElementById("logList");


console.log("logList:", logList);


addBtn.addEventListener("click", () => {


  const place = document.getElementById("place").value;
const startDate = document.getElementById("startDate").value;
const endDate = document.getElementById("endDate").value;
const memo = document.getElementById("memo").value;
const rating = document.getElementById("rating").value;



if (!place || !startDate || !endDate) return;
if (new Date(startDate) > new Date(endDate)) {
  alert("終了日は開始日以降にしてね");
  return;
}
if (!place || !startDate || !endDate || !rating) return;


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
  </div>

  <div class="logActions">
    <button class="editBtn">編集</button>
    <button class="deleteBtn">削除</button>
  </div>
`;





logList.appendChild(li);


localStorage.setItem("travelLogs", logList.innerHTML);
});




const savedLogs = localStorage.getItem("travelLogs");
if (savedLogs) {
  logList.innerHTML = savedLogs;

  // ★ ここに「data-start-date を付け直す処理」を入れる
  const items = logList.querySelectorAll("li");

  items.forEach(li => {
    const dateText = li.querySelector(".logDate")?.textContent;
    if (!dateText) return;

    // 例: 2025年3月10日〜2025年3月15日
    const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!match) return;

    const [, y, m, d] = match;
    li.dataset.startDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  });

  // ★ 付け直したあとで並び替え
  sortLogsByDate(true);
}



logList.addEventListener("click", (e) => {

  // 編集
  if (e.target.classList.contains("editBtn")) {
    const li = e.target.closest("li");

    const memoEl = li.querySelector(".logMemo");
    const starsEl = li.querySelector(".logStars");

    const currentMemo = memoEl.textContent;
    const currentStars = starsEl.textContent.length;

    const newMemo = prompt("メモを編集してね", currentMemo);
    if (newMemo === null) return;

    const newRating = prompt("評価を1〜5で入力してね", currentStars);
    if (!newRating || newRating < 1 || newRating > 5) return;

    memoEl.textContent = newMemo;
    starsEl.textContent = "★".repeat(newRating);

    localStorage.setItem("travelLogs", logList.innerHTML);
  }

  // 削除
if (e.target.classList.contains("deleteBtn")) {
  e.target.closest("li").remove();
  localStorage.setItem("travelLogs", logList.innerHTML);
}

});



document.getElementById("sortNew").addEventListener("click", () => {
  sortLogsByDate(true);
});

document.getElementById("sortOld").addEventListener("click", () => {
  sortLogsByDate(false);
});

