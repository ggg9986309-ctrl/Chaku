const ADMIN_KEY = "90190482989535573493";

const lockScreen = document.getElementById("lockScreen");
const adminPanel = document.getElementById("adminPanel");
const adminKey = document.getElementById("adminKey");
const unlockBtn = document.getElementById("unlockBtn");
const loginMsg = document.getElementById("loginMsg");
const showKey = document.getElementById("showKey");

const form = document.getElementById("appForm");
const publishBtn = document.getElementById("publishBtn");
const formMsg = document.getElementById("formMsg");

const library = document.getElementById("library");
const totalApps = document.getElementById("totalApps");
const featuredApps = document.getElementById("featuredApps");
const totalDownloads = document.getElementById("totalDownloads");

const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("toast");

let apps = [];


/* =========================
   KEY SHOW / HIDE
========================= */

showKey.addEventListener("click", () => {
  if (adminKey.type === "password") {
    adminKey.type = "text";
    showKey.textContent = "🙈";
  } else {
    adminKey.type = "password";
    showKey.textContent = "👁";
  }
});


/* =========================
   UNLOCK
========================= */

unlockBtn.addEventListener("click", unlock);

adminKey.addEventListener("keydown", e => {
  if (e.key === "Enter") unlock();
});

function unlock() {

  const key = adminKey.value.trim();

  if (!key) {
    showLogin("⚠️ Admin key enter karo.", false);
    shake();
    return;
  }

  unlockBtn.disabled = true;
  unlockBtn.innerHTML = "VERIFYING <span>•••</span>";

  setTimeout(() => {

    if (key === ADMIN_KEY) {

      sessionStorage.setItem("kiruu_admin_key", key);

      loginMsg.style.color = "#62ffae";
      loginMsg.textContent = "✓ ACCESS GRANTED";

      lockScreen.style.transition = "1s";
      lockScreen.style.transform = "scale(1.08)";
      lockScreen.style.opacity = "0";

      setTimeout(() => {
        lockScreen.style.display = "none";
        adminPanel.style.display = "block";
        loadApps();
      }, 700);

    } else {

      showLogin("✕ Invalid admin key", false);
      unlockBtn.disabled = false;
      unlockBtn.innerHTML = "<span>UNLOCK PANEL</span><b>→</b>";

      shake();
    }

  }, 900);
}


function showLogin(message, success) {
  loginMsg.textContent = message;
  loginMsg.style.color = success ? "#62ffae" : "#ff668e";
}

function shake() {
  const card = document.querySelector(".lock-card");

  card.animate(
    [
      { transform:"translateX(0)" },
      { transform:"translateX(-10px)" },
      { transform:"translateX(10px)" },
      { transform:"translateX(-7px)" },
      { transform:"translateX(7px)" },
      { transform:"translateX(0)" }
    ],
    {
      duration:450,
      easing:"ease-out"
    }
  );
}


/* =========================
   AUTO LOGIN
========================= */

if (sessionStorage.getItem("kiruu_admin_key") === ADMIN_KEY) {
  lockScreen.style.display = "none";
  adminPanel.style.display = "block";
  loadApps();
}


/* =========================
   LOAD APPS
========================= */

async function loadApps() {

  try {

    const response = await fetch("/api/apps", {
      cache:"no-store"
    });

    if (!response.ok) {
      throw new Error("API error");
    }

    apps = await response.json();

    if (!Array.isArray(apps)) {
      apps = [];
    }

    renderStats();
    renderLibrary();

  } catch (error) {

    console.error(error);

    library.innerHTML = `
      <div class="empty">
        ❌ Apps load nahi ho rahe.<br>
        Backend/API check karo.
      </div>
    `;
  }
}


/* =========================
   STATS
========================= */

function renderStats() {

  totalApps.textContent = apps.length;

  featuredApps.textContent =
    apps.filter(app => app.featured).length;

  const downloads = apps.reduce(
    (sum, app) => sum + (Number(app.downloads) || 0),
    0
  );

  totalDownloads.textContent =
    downloads.toLocaleString();
}


/* =========================
   LIBRARY
========================= */

function renderLibrary() {

  if (!apps.length) {

    library.innerHTML = `
      <div class="empty">
        📦 Abhi koi app publish nahi hai.
      </div>
    `;

    return;
  }

  library.innerHTML = apps.map(app => {

    const icon = app.icon || "";

    return `
      <div class="app-item">

        ${
          icon
          ? `<img class="app-icon" src="${escapeHTML(icon)}">`
          : `<div class="app-icon"></div>`
        }

        <div class="app-info">
          <h3>
            ${escapeHTML(app.name || "Untitled")}
            ${app.featured ? " ⭐" : ""}
          </h3>

          <p>
            ${escapeHTML(app.category || "Other")}
            • v${escapeHTML(app.version || "1.0.0")}
            • ${(Number(app.downloads)||0).toLocaleString()} downloads
          </p>
        </div>

        <button
          class="delete-btn"
          onclick="deleteApp('${String(app.id).replace(/'/g,"\\'")}')">
          🗑️ Delete
        </button>

      </div>
    `;

  }).join("");
}


/* =========================
   PUBLISH
========================= */

form.addEventListener("submit", async e => {

  e.preventDefault();

  const key =
    sessionStorage.getItem("kiruu_admin_key") || ADMIN_KEY;

  const apk = document.getElementById("file").files[0];

  if (!apk) {
    showForm("❌ APK file select karo.", false);
    return;
  }

  const data = new FormData(form);

  data.set(
    "featured",
    document.getElementById("featured").checked
      ? "true"
      : "false"
  );

  publishBtn.disabled = true;
  publishBtn.innerHTML = "🚀 UPLOADING...";

  try {

    const response = await fetch("/api/apps", {
      method:"POST",
      headers:{
        "x-admin-key":key
      },
      body:data
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Publish failed"
      );
    }

    showForm(
      "✓ App successfully published!",
      true
    );

    showToast("🚀 App Published Successfully!");

    form.reset();

    await loadApps();

  } catch(error) {

    console.error(error);

    showForm(
      "❌ " + error.message,
      false
    );

  } finally {

    publishBtn.disabled = false;
    publishBtn.innerHTML = "🚀 PUBLISH APP";
  }
});


/* =========================
   DELETE
========================= */

async function deleteApp(id) {

  if (!confirm("Is app ko delete karna hai?")) {
    return;
  }

  const key =
    sessionStorage.getItem("kiruu_admin_key") || ADMIN_KEY;

  try {

    const response = await fetch(
      "/api/apps/" + encodeURIComponent(id),
      {
        method:"DELETE",
        headers:{
          "x-admin-key":key
        }
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Delete failed"
      );
    }

    showToast("🗑️ App Deleted");

    loadApps();

  } catch(error) {

    showToast("❌ " + error.message);

  }
}


/* =========================
   REFRESH
========================= */

refreshBtn.addEventListener("click", async () => {

  refreshBtn.textContent = "↻ Loading...";

  await loadApps();

  refreshBtn.textContent = "↻ Refresh";

  showToast("✓ Library refreshed");
});


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener("click", () => {

  sessionStorage.removeItem("kiruu_admin_key");

  location.reload();
});


/* =========================
   MESSAGES
========================= */

function showForm(message, success) {

  formMsg.textContent = message;
  formMsg.style.color =
    success ? "#62ffae" : "#ff668e";
}

function showToast(message) {

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


/* =========================
   SECURITY DISPLAY
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
