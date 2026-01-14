const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const dayInput = document.getElementById("dayInput");
const hourInput = document.getElementById("hourInput");
const minuteInput = document.getElementById("minuteInput");
const taskList = document.getElementById("taskList");
const addBtn = document.getElementById("addBtn");
const counter = document.getElementById("taskCounter");
const themeToggle = document.getElementById("themeToggle");

let tasks = [];
let editIndex = null;
let activeTimer = null;
let activeTimerIndex = null;

/* LOAD */
document.addEventListener("DOMContentLoaded", () => {
  const savedTasks = JSON.parse(localStorage.getItem("tasks"));
  const savedTheme = localStorage.getItem("theme");

  if (savedTasks) tasks = savedTasks;
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ Light";
  }

  render();
});

/* SAVE */
const save = () => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

/* THEME TOGGLE */
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️ Light" : "🌙 Dark";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

/* ENTER KEY */
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    taskForm.requestSubmit();
  }
});

/* TIME HELPERS */
const getDays = (s) => Math.floor(s / 86400);
const getHours = (s) => Math.floor((s % 86400) / 3600);
const getMinOrSec = (s) =>
  s <= 60 ? `${s}s` : Math.ceil((s % 3600) / 60);

/* ADD / UPDATE TASK (🔥 FIX HERE) */
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = taskInput.value.trim();
  if (!text) return;

  const totalSeconds =
    (Number(dayInput.value) || 0) * 86400 +
    (Number(hourInput.value) || 0) * 3600 +
    (Number(minuteInput.value) || 0) * 60;

  const newRemaining = totalSeconds > 0 ? totalSeconds : null;

  if (editIndex === null) {
    // ADD NEW
    tasks.push({
      text,
      completed: false,
      remaining: newRemaining,
      running: false
    });
  } else {
    // ✅ EDIT EXISTING (FIXED)
    const task = tasks[editIndex];

    task.text = text;
    task.remaining = newRemaining;
    task.running = false;

    // stop active timer if editing same task
    if (activeTimerIndex === editIndex) {
      clearInterval(activeTimer);
      activeTimerIndex = null;
    }

    editIndex = null;
    addBtn.innerText = "Add";
  }

  taskInput.value = "";
  dayInput.value = hourInput.value = minuteInput.value = "";

  save();
  render();
});

/* TIMER */
const toggleTimer = (index) => {
  if (tasks[index].remaining === null || tasks[index].completed) return;

  if (activeTimerIndex === index) {
    clearInterval(activeTimer);
    tasks[index].running = false;
    activeTimerIndex = null;
    render();
    return;
  }

  if (activeTimer) clearInterval(activeTimer);

  activeTimerIndex = index;
  tasks[index].running = true;

  activeTimer = setInterval(() => {
    if (tasks[index].remaining > 0) {
      tasks[index].remaining--;
      updateTimeOnly();
    } else {
      clearInterval(activeTimer);
      tasks[index].completed = true;
      tasks[index].running = false;
      activeTimerIndex = null;
      save();
      render();
    }
  }, 1000);

  render();
};

/* FAST TIME UPDATE */
const updateTimeOnly = () => {
  const rows = document.querySelectorAll(".task-row");
  const row = rows[activeTimerIndex];
  if (!row) return;

  const t = tasks[activeTimerIndex];
  row.children[1].innerText = getDays(t.remaining);
  row.children[2].innerText = getHours(t.remaining);
  row.children[3].innerText = getMinOrSec(t.remaining);
};

/* RENDER */
const render = () => {
  taskList.innerHTML = "";

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  counter.innerText = `Total: ${total} | Completed: ${completed} | Pending: ${total - completed}`;

  if (tasks.length === 0) {
    taskList.innerHTML = `<p style="text-align:center;color:var(--muted)">No tasks yet</p>`;
    return;
  }

  tasks.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "table task-row";

    row.innerHTML = `
      <div class="task-text ${t.completed ? "completed" : ""}">
        <input type="checkbox" ${t.completed ? "checked" : ""}/>
        <span>${t.text}</span>
      </div>
      <div>${t.remaining !== null ? getDays(t.remaining) : "—"}</div>
      <div>${t.remaining !== null ? getHours(t.remaining) : "—"}</div>
      <div>${t.remaining !== null ? getMinOrSec(t.remaining) : "—"}</div>
      <div>${t.completed ? "Completed" : t.running ? "Running" : "Pending"}</div>
      <div class="actions">
        ${t.remaining !== null && !t.completed
          ? `<button class="action-btn start">${t.running ? "Pause" : "Start"}</button>`
          : ""}
        <button class="action-btn edit-btn">Edit</button>
        <button class="action-btn delete-btn">Delete</button>
      </div>
    `;

    /* COMPLETE */
    row.querySelector(".task-text").onclick = () => {
      t.completed = !t.completed;
      save();
      render();
    };

    /* TIMER */
    const timerBtn = row.querySelector(".start");
    if (timerBtn) timerBtn.onclick = () => toggleTimer(i);

    /* EDIT */
    row.querySelector(".edit-btn").onclick = () => {
      taskInput.value = t.text;
      editIndex = i;
      addBtn.innerText = "Save";
    };

    /* DELETE */
    row.querySelector(".delete-btn").onclick = () => {
      if (activeTimerIndex === i) {
        clearInterval(activeTimer);
        activeTimerIndex = null;
      }
      tasks.splice(i, 1);
      save();
      render();
    };

    taskList.appendChild(row);
  });
};
