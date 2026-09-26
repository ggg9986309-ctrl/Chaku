const ADMIN_KEY = "90190482989535573493";

const $ = id 
  document.getElementById(id);


/* =========================
   ADMIN FETCH
========================= */

async function adminFetch(url, options = {}) {

  options.headers = {
    ...(options.headers || {}),
    "x-admin-key": ADMIN_KEY
  };

  return fetch(url, options);
}


/* =========================
   LOCK
========================= */

$("unlockBtn").addEventListener(
  "click",
  unlock
);

$("adminKey").addEventListener(
  "keydown",
  e => {
    if (e.key === "Enter") {
      unlock();
    }
  }
);


function unlock() {

  const key =
    $("adminKey").value.trim();

  if (key === ADMIN_KEY) {

    sessionStorage.setItem(
      "kiruu_admin",
      "true"
    );

    $("adminLock")
      .classList
      .add("hidden");

    loadApps();

  } else {

    $("lockError").textContent =
      "❌ Wrong admin key";

    $("adminKey").value = "";
  }
}


if (
  sessionStorage.getItem("kiruu_admin")
  === "true"
) {

  $("adminLock")
    .classList
    .add("hidden");

}


/* =========================
   ICON PREVIEW
========================= */

$("iconFile").addEventListener(
  "change",
  () => {

    const file =
      $("iconFile").files[0];

    if (!file) {

      $("iconPreview").innerHTML = "";

      return;
    }

    const url =
      URL.createObjectURL(file);

    $("iconPreview").innerHTML = `
      <img
        src="${url}"
        alt="App Icon"
      >
    `;
  }
);


/* =========================
   APK NAME
========================= */

$("apkFile").addEventListener(
  "change",
  () => {

    const file =
      $("apkFile").files[0];

    $("fileName").textContent =
      file
        ? `📦 ${file.name}`
        : "No file selected";
  }
);


/* =========================
   PUBLISH
========================= */

$("appForm").addEventListener(
  "submit",
  async e => {

    e.preventDefault();

    const apk =
      $("apkFile").files[0];

    if (!apk) {

      alert(
        "Pehle APK select karo."
      );

      return;
    }


    const formData =
      new FormData();

    formData.append(
      "name",
      $("name").value
    );

    formData.append(
      "category",
      $("category").value
    );

    formData.append(
      "version",
      $("version").value
    );

    formData.append(
      "size",
      $("size").value
    );

    formData.append(
      "description",
      $("description").value
    );

    formData.append(
      "rating",
      $("rating").value
    );

    formData.append(
      "downloads",
      $("downloads").value
    );

    formData.append(
      "featured",
      $("featured").checked
    );

    // APK
    formData.append(
      "file",
      apk
    );

    // ICON
    const icon =
      $("iconFile").files[0];

    if (icon) {

      formData.append(
        "icon",
        icon
      );
    }


    const button =
      $("publishBtn");

    button.disabled = true;

    button.textContent =
      "⏳ Publishing...";


    try {

      const response =
        await adminFetch(
          "/api/apps",
          {
            method: "POST",
            body: formData
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Upload failed"
        );
      }


      alert(
        "✅ App published successfully!"
      );


      $("appForm").reset();

      $("iconPreview").innerHTML = "";

      $("fileName").textContent =
        "No file selected";


      loadApps();


    } catch (error) {

      alert(
        "❌ " + error.message
      );

    } finally {

      button.disabled = false;

      button.textContent =
        "🚀 PUBLISH APP";
    }

  }
);


/* =========================
   LOAD APPS
========================= */

let allApps = [];


async function loadApps() {

  try {

    const response =
      await fetch("/api/apps");

    allApps =
      await response.json();

    updateStats();

    renderApps(allApps);

  } catch (error) {

    console.error(error);

  }
}


/* =========================
   STATS
========================= */

function updateStats() {

  $("totalApps").textContent =
    allApps.length;

  $("featuredApps").textContent =
    allApps.filter(
      app => app.featured
    ).length;

  const downloads =
    allApps.reduce(
      (total, app) =>
        total +
        Number(app.downloads || 0),
      0
    );

  $("totalDownloads").textContent =
    downloads.toLocaleString();
}


/* =========================
   RENDER
========================= */

function renderApps(apps) {

  const library =
    $("library");

  if (!apps.length) {

    library.innerHTML = `
      <div class="app-item">
        <div class="app-info">
          <h3>No apps yet</h3>
          <p>
            Publish your first app above.
          </p>
        </div>
      </div>
    `;

    return;
  }


  library.innerHTML =
    apps.map(app => {

      const icon =
        app.icon || "";


      return `
        <div
          class="app-item"
          data-id="${escapeHtml(app.id)}"
        >

          ${
            icon
              ? `
                <img
                  class="app-icon"
                  src="${escapeHtml(icon)}"
                  alt=""
                >
              `
              : `
                <div class="app-icon"></div>
              `
          }


          <div class="app-info">

            <h3>
              ${escapeHtml(app.name)}

              ${
                app.featured
                  ? `
                    <span class="featured-badge">
                      ⭐ Featured
                    </span>
                  `
                  : ""
              }

            </h3>

            <p>
              ${escapeHtml(app.category)}
              · v${escapeHtml(app.version || "1.0.0")}
              · ${Number(app.downloads || 0).toLocaleString()} downloads
            </p>

          </div>


          <div class="app-actions">

            <button
              class="delete-btn"
              onclick="deleteApp('${escapeJs(app.id)}')"
            >
              🗑️ Delete
            </button>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================
   DELETE
========================= */

async function deleteApp(id) {

  const ok =
    confirm(
      "Is app ko permanently delete karna hai?"
    );

  if (!ok) return;


  try {

    const response =
      await adminFetch(
        `/api/apps/${encodeURIComponent(id)}`,
        {
          method: "DELETE"
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Delete failed"
      );
    }


    alert(
      "🗑️ App deleted."
    );

    loadApps();


  } catch (error) {

    alert(
      "❌ " + error.message
    );
  }
}


/* =========================
   SEARCH
========================= */

$("search").addEventListener(
  "input",
  e => {

    const query =
      e.target.value
        .toLowerCase()
        .trim();


    const filtered =
      allApps.filter(app =>
        String(app.name || "")
          .toLowerCase()
          .includes(query)
        ||
        String(app.category || "")
          .toLowerCase()
          .includes(query)
      );


    renderApps(filtered);

  }
);


/* =========================
   SECURITY HELPERS
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeJs(value) {

  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}


/* =========================
   START
========================= */

if (
  sessionStorage.getItem("kiruu_admin")
  === "true"
) {

  loadApps();

}
