const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA = path.join(ROOT, "apps.json");
const UPLOADS = path.join(ROOT, "uploads");

if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, "[]");

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOADS),
    filename: (_, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, Date.now() + "-" + safe);
    }
  }),
  limits: { fileSize: 300 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOADS));
app.use(express.static(ROOT, { extensions: ["html"] }));

function readApps() {
  try { return JSON.parse(fs.readFileSync(DATA, "utf8")); }
  catch { return []; }
}
function saveApps(items) {
  fs.writeFileSync(DATA, JSON.stringify(items, null, 2));
}
function clean(v) {
  return typeof v === "string" ? v.trim() : "";
}

app.get("/", (_, res) => res.sendFile(path.join(ROOT, "index.html")));
app.get("/admin", (_, res) => res.sendFile(path.join(ROOT, "admin.html")));

app.get("/api/apps", (_, res) => res.json(readApps()));

app.post("/api/apps", upload.single("file"), (req, res) => {
  const body = req.body || {};
  const name = clean(body.name);
  const category = clean(body.category) || "Other";
  if (!name) return res.status(400).json({ error: "App name is required." });

  const item = {
    id: Date.now().toString(),
    name,
    category,
    version: clean(body.version) || "1.0.0",
    size: clean(body.size) || (req.file ? `${(req.file.size / 1048576).toFixed(1)} MB` : ""),
    icon: clean(body.icon),
    download: req.file ? `/uploads/${req.file.filename}` : clean(body.download),
    description: clean(body.description),
    featured: body.featured === "true" || body.featured === "on",
    downloads: Number(body.downloads || 0),
    rating: Number(body.rating || 5),
    createdAt: new Date().toISOString()
  };

  const apps = readApps();
  apps.unshift(item);
  saveApps(apps);
  res.status(201).json(item);
});

app.put("/api/apps/:id", upload.single("file"), (req, res) => {
  const apps = readApps();
  const i = apps.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "App not found." });

  const b = req.body || {};
  const old = apps[i];
  const updated = {
    ...old,
    name: clean(b.name) || old.name,
    category: clean(b.category) || old.category,
    version: clean(b.version) || old.version,
    size: clean(b.size) || old.size,
    icon: clean(b.icon),
    download: req.file ? `/uploads/${req.file.filename}` : clean(b.download),
    description: clean(b.description),
    featured: b.featured === "true" || b.featured === "on",
    rating: Number(b.rating || old.rating || 5)
  };
  apps[i] = updated;
  saveApps(apps);
  res.json(updated);
});

app.delete("/api/apps/:id", (req, res) => {
  const apps = readApps();
  const next = apps.filter(x => x.id !== req.params.id);
  if (next.length === apps.length) return res.status(404).json({ error: "App not found." });
  saveApps(next);
  res.json({ success: true });
});

app.get("/api/health", (_, res) => res.json({ status: "online", store: "KIRUU STORE" }));

app.listen(PORT, () => console.log(`KIRUU STORE running on ${PORT}`));
