const form = document.getElementById("appForm");
const list = document.getElementById("appList");
const message = document.getElementById("message");

function esc(value){

    return String(value ?? "")
        .replace(/[&<>"']/g, char => ({
            "&":"&amp;",
            "<":"&lt;",
            ">":"&gt;",
            '"':"&quot;",
            "'":"&#039;"
        }[char]));

}


function showToast(text){

    const toast = document.getElementById("toast");

    toast.textContent = text;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);

}


async function loadApps(){

    try{

        const response = await fetch("/api/apps");

        const apps = await response.json();

        document.getElementById("totalApps").textContent =
            apps.length;

        document.getElementById("totalGames").textContent =
            apps.filter(app => app.category === "Games").length;

        document.getElementById("totalFeatured").textContent =
            apps.filter(app => app.featured).length;

        const downloads = apps.reduce(
            (total, app) =>
                total + Number(app.downloads || 0),
            0
        );

        document.getElementById("totalDownloads").textContent =
            downloads.toLocaleString();

        document.getElementById("libraryCount").textContent =
            `${apps.length} ${apps.length === 1 ? "ITEM" : "ITEMS"}`;


        if(!apps.length){

            list.innerHTML = `
                <div class="empty">

                    <div style="font-size:35px;margin-bottom:10px">
                        ✦
                    </div>

                    Your KIRUU library is empty.<br>

                    Add your first app or game above.

                </div>
            `;

            return;
        }


        list.innerHTML = apps.map(app => {

            const icon = app.icon
                ? `<img class="app-icon"
                    src="${esc(app.icon)}"
                    onerror="this.outerHTML='<div class=app-icon>K</div>'">`
                : `<div class="app-icon">
                    ${esc((app.name || "K")[0].toUpperCase())}
                   </div>`;


            return `

                <div class="app-row">

                    ${icon}

                    <div class="app-details">

                        <h3>
                            ${esc(app.name)}
                        </h3>

                        <p>

                            ${esc(app.category)}
                            ·
                            v${esc(app.version || "1.0.0")}
                            ·
                            ${esc(app.size || "Size not set")}

                            ${app.featured
                                ? ` · <span class="badge">
                                      FEATURED
                                   </span>`
                                : ""
                            }

                        </p>

                    </div>

                    <button
                        class="delete-btn"
                        onclick="deleteApp('${app.id}')"
                    >
                        Delete
                    </button>

                </div>

            `;

        }).join("");


    }catch(error){

        list.innerHTML = `
            <div class="empty">
                Server connection failed.
            </div>
        `;

    }

}



form.addEventListener("submit", async event => {

    event.preventDefault();

    const button =
        form.querySelector(".publish-btn");

    const text =
        button.querySelector(".btn-text");

    text.textContent = "Publishing...";

    button.disabled = true;


    try{

        const formData =
            new FormData(form);


        const response =
            await fetch("/api/apps", {

                method:"POST",

                body:formData

            });


        const result =
            await response.json();


        if(!response.ok){

            throw new Error(
                result.error || "Upload failed"
            );

        }


        form.reset();

        message.textContent =
            "✓ Release published successfully.";

        message.className =
            "success";


        showToast(
            "✓ Added to KIRUU STORE"
        );


        await loadApps();


    }catch(error){

        message.textContent =
            "✕ " + error.message;

        message.className =
            "error";


        showToast(
            "Upload failed"
        );

    }


    text.textContent =
        "Publish Release";

    button.disabled = false;

});



async function deleteApp(id){

    const confirmDelete =
        confirm(
            "Delete this release from KIRUU STORE?"
        );


    if(!confirmDelete){
        return;
    }


    try{

        const response =
            await fetch(
                "/api/apps/" + id,
                {
                    method:"DELETE"
                }
            );


        if(!response.ok){
            throw new Error("Delete failed");
        }


        showToast(
            "Release deleted"
        );


        loadApps();


    }catch(error){

        showToast(
            "Could not delete release"
        );

    }

}



loadApps();
const iconFile = document.getElementById("iconFile");
const iconPreview = document.getElementById("iconPreview");

if (iconFile) {
  iconFile.addEventListener("change", () => {
    const file = iconFile.files[0];

    if (!file) {
      iconPreview.innerHTML = "";
      return;
    }

    const url = URL.createObjectURL(file);

    iconPreview.innerHTML = `
      <img src="${url}" alt="App Icon Preview">
    `;
  });
}
