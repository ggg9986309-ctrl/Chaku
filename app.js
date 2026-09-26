const state = {
  apps: [],
  category: "all",
  search: ""
};

const $ = (selector) => document.querySelector(selector);

const appsGrid = $("#appsGrid");
const trendingGrid = $("#trendingGrid");
const searchInput = $("#searchInput");
const clearSearch = $("#clearSearch");
const emptyState = $("#emptyState");
const resultCount = $("#resultCount");

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(number) {
  const n = Number(number) || 0;

  if (n >= 1000000) {
    return (n / 1000000).toFixed(1).replace(".0", "") + "M";
  }

  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(".0", "") + "K";
  }

  return n.toString();
}

function getIcon(app) {
  if (app.icon && app.icon.trim()) {
    return app.icon;
  }

  return "data:image/svg+xml," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
      <rect width="160" height="160" rx="35" fill="#171522"/>
      <text
        x="80"
        y="105"
        text-anchor="middle"
        font-size="70"
        font-family="Arial"
        font-weight="bold"
        fill="white"
      >K</text>
    </svg>
  `);
}

function stars(rating) {
  const value = Math.min(
    5,
    Math.max(0, Number(rating) || 0)
  );

  const full = Math.round(value);

  return "★".repeat(full) +
         "☆".repeat(5 - full);
}


/* =========================
   APP CARD
========================= */

function appCard(app) {

  const id = escapeHTML(app.id || "");
  const name = escapeHTML(app.name || "Untitled App");
  const category = escapeHTML(app.category || "Other");
  const version = escapeHTML(app.version || "Latest");
  const size = escapeHTML(app.size || "—");

  const downloads = formatNumber(app.downloads);

  const rating =
    Number(app.rating || 0).toFixed(1);

  const icon =
    escapeHTML(getIcon(app));

  const download =
    app.download
      ? escapeHTML(app.download)
      : "";

  return `
    <article
      class="app-card"
      data-id="${id}"
    >

      ${
        app.featured
          ? `
            <div class="featured-badge">
              ✦ Featured
            </div>
          `
          : ""
      }

      <div class="app-card-top">

        <img
          class="app-icon"
          src="${icon}"
          alt="${name}"
          loading="lazy"
          onerror="this.src='${escapeHTML(
            getIcon({})
          )}'"
        >

        <div class="app-main">

          <h3>${name}</h3>

          <div class="app-meta">

            <span>${category}</span>

            <i>•</i>

            <span>
              v${version}
            </span>

          </div>

        </div>

      </div>


      <div class="app-description">

        ${escapeHTML(
          app.description ||
          "Discover this release on KIRUU STORE."
        )}

      </div>


      <div class="app-bottom">

        <div class="app-stats">

          <span>
            ★ ${rating}
          </span>

          <span>
            ↓ ${downloads}
          </span>

        </div>

        <span class="size">
          ${size}
        </span>

      </div>


      <div class="app-actions">

        <button
          class="details-btn"
          data-open="${id}"
        >
          View Details
          <span>→</span>
        </button>


        ${
          download
            ? `
              <a
                class="download-btn"
                href="${download}"
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                ⬇ DOWNLOAD APK
              </a>
            `
            : `
              <button
                class="download-btn disabled"
                disabled
              >
                UNAVAILABLE
              </button>
            `
        }

      </div>

    </article>
  `;
}


/* =========================
   STATS
========================= */

function renderStats() {

  const total =
    state.apps.length;

  const downloads =
    state.apps.reduce(
      (sum, app) =>
        sum +
        (Number(app.downloads) || 0),
      0
    );

  $("#totalApps").textContent =
    total;

  $("#safeApps").textContent =
    total;

  $("#totalDownloads").textContent =
    formatNumber(downloads);
}


/* =========================
   FILTER
========================= */

function filteredApps() {

  return state.apps.filter((app) => {

    const categoryMatch =
      state.category === "all" ||
      String(
        app.category || "Other"
      ).toLowerCase() ===
      state.category.toLowerCase();


    const text = `
      ${app.name || ""}
      ${app.category || ""}
      ${app.description || ""}
    `.toLowerCase();


    const searchMatch =
      !state.search ||
      text.includes(
        state.search.toLowerCase()
      );


    return (
      categoryMatch &&
      searchMatch
    );

  });
}


/* =========================
   RENDER APPS
========================= */

function renderApps() {

  const apps =
    filteredApps();


  resultCount.textContent =
    `${apps.length} release${
      apps.length === 1
        ? ""
        : "s"
    }`;


  if (!apps.length) {

    appsGrid.innerHTML = "";

    emptyState.classList.remove(
      "hidden"
    );

    return;
  }


  emptyState.classList.add(
    "hidden"
  );


  appsGrid.innerHTML =
    apps.map(appCard).join("");
}


/* =========================
   TRENDING
========================= */

function renderTrending() {

  let trending =
    [...state.apps];


  trending.sort((a, b) => {

    if (
      Boolean(b.featured) !==
      Boolean(a.featured)
    ) {
      return b.featured ? 1 : -1;
    }


    return (
      (Number(b.downloads) || 0) -
      (Number(a.downloads) || 0)
    );

  });


  trending =
    trending.slice(0, 4);


  if (!trending.length) {

    trendingGrid.innerHTML = `
      <div class="no-trending">
        Apps will appear here after
        you publish them from Admin.
      </div>
    `;

    return;
  }


  trendingGrid.innerHTML =
    trending.map(appCard).join("");
}


/* =========================
   OPEN MODAL
========================= */

function openModal(id) {

  const app =
    state.apps.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!app) return;


  $("#modalIcon").src =
    getIcon(app);


  $("#modalName").textContent =
    app.name ||
    "Untitled App";


  $("#modalCategory").textContent =
    app.category ||
    "Other";


  $("#modalDescription").textContent =
    app.description ||
    "No description available.";


  $("#modalVersion").textContent =
    app.version ||
    "Latest";


  $("#modalSize").textContent =
    app.size ||
    "—";


  $("#modalDownloads").textContent =
    formatNumber(
      app.downloads
    );


  $("#modalRating").textContent =
    `${stars(app.rating)}  ${
      (Number(app.rating) || 0)
        .toFixed(1)
    }`;


  const download =
    $("#modalDownload");


  if (app.download) {

    download.href =
      app.download;

    download.setAttribute(
      "download",
      ""
    );

    download.target =
      "_blank";

    download.rel =
      "noopener noreferrer";

    download.style.pointerEvents =
      "auto";

    download.style.opacity =
      "1";

    download.style.display =
      "flex";

  } else {

    download.href = "#";

    download.style.pointerEvents =
      "none";

    download.style.opacity =
      ".5";

  }


  $("#appModal").classList.add(
    "show"
  );

  document.body.classList.add(
    "modal-open"
  );
}


/* =========================
   CLOSE MODAL
========================= */

function closeModal() {

  $("#appModal").classList.remove(
    "show"
  );

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================
   LOAD APPS
========================= */

async function loadApps() {

  try {

    const response =
      await fetch(
        "/api/apps",
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        "API request failed"
      );
    }


    const data =
      await response.json();


    state.apps =
      Array.isArray(data)
        ? data
        : [];


    renderStats();
    renderTrending();
    renderApps();


  } catch (error) {

    console.error(error);

    state.apps = [];

    renderStats();
    renderTrending();
    renderApps();

    showToast(
      "Store data load nahi ho paya."
    );

  }
}


/* =========================
   SEARCH
========================= */

if (searchInput) {

  searchInput.addEventListener(
    "input",
    () => {

      state.search =
        searchInput.value.trim();


      if (clearSearch) {

        clearSearch.classList.toggle(
          "show",
          Boolean(state.search)
        );

      }


      renderApps();

    }
  );

}


if (clearSearch) {

  clearSearch.addEventListener(
    "click",
    () => {

      searchInput.value = "";

      state.search = "";

      clearSearch.classList.remove(
        "show"
      );

      renderApps();

      searchInput.focus();

    }
  );

}


/* =========================
   CATEGORY
========================= */

document
  .querySelectorAll(".filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".filter")
          .forEach(btn =>
            btn.classList.remove(
              "active"
            )
          );


        button.classList.add(
          "active"
        );


        state.category =
          button.dataset.category ||
          "all";


        renderApps();

      }
    );

  });


/* =========================
   CARD / BUTTON CLICKS
========================= */

document.addEventListener(
  "click",
  event => {

    const openButton =
      event.target.closest(
        "[data-open]"
      );


    if (openButton) {

      openModal(
        openButton.dataset.open
      );

      return;
    }


    const viewAll =
      event.target.closest(
        "[data-scroll]"
      );


    if (viewAll) {

      const target =
        document.querySelector(
          viewAll.dataset.scroll
        );


      if (target) {

        target.scrollIntoView({
          behavior: "smooth"
        });

      }

    }

  }
);


/* =========================
   MODAL EVENTS
========================= */

const closeModalButton =
  $("#closeModal");


if (closeModalButton) {

  closeModalButton.addEventListener(
    "click",
    closeModal
  );

}


const modalBackdrop =
  document.querySelector(
    ".modal-backdrop"
  );


if (modalBackdrop) {

  modalBackdrop.addEventListener(
    "click",
    closeModal
  );

}


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeModal();

    }

  }
);


/* =========================
   RESET FILTERS
========================= */

function resetFilters() {

  state.category = "all";

  state.search = "";


  if (searchInput) {
    searchInput.value = "";
  }


  document
    .querySelectorAll(".filter")
    .forEach(btn => {

      btn.classList.toggle(
        "active",
        btn.dataset.category ===
        "all"
      );

    });


  if (clearSearch) {

    clearSearch.classList.remove(
      "show"
    );

  }


  renderApps();
}


const resetButton =
  $("#resetFilters");


if (resetButton) {

  resetButton.addEventListener(
    "click",
    resetFilters
  );

}


const emptyReset =
  $("#emptyReset");


if (emptyReset) {

  emptyReset.addEventListener(
    "click",
    resetFilters
  );

}


/* =========================
   TOAST
========================= */

function showToast(message) {

  const toast =
    $("#toast");


  if (!toast) return;


  const text =
    toast.querySelector("p");


  if (text) {
    text.textContent =
      message;
  }


  toast.classList.add(
    "show"
  );


  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  }, 2800);

}


/* =========================
   START STORE
========================= */

loadApps();


/* =========================
   AUTO REFRESH
========================= */

setInterval(
  loadApps,
  30000
);
