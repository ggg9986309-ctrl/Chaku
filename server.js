const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// ADMIN KEY
// ===============================
const ADMIN_KEY = "90190482989535573493";

// ===============================
// PATHS
// ===============================
const DATA_FILE = path.join(__dirname, "apps.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");

// Create folders/files
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]");
}

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static website
app.use(express.static(__dirname));

// Uploaded files
app.use("/uploads", express.static(UPLOAD_DIR));

// Admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// ===============================
// MULTER STORAGE
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .toLowerCase();

    cb(
      null,
      `${Date.now()}-${base}${ext}`
    );
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 300 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedImages = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/jpg"
    ];

    const allowedApps = [
      "application/vnd.android.package-archive",
      "application/octet-stream",
      "application/zip",
      "application/x-zip-compressed"
    ];

    if (
      file.fieldname === "icon" &&
      allowedImages.includes(file.mimetype)
    ) {
      return cb(null, true);
    }

    if (
      file.fieldname === "file" &&
      allowedApps.includes(file.mimetype)
    ) {
      return cb(null, true);
    }

    // Allow APK even if browser sends octet-stream
    if (
      file.fieldname === "file" &&
      path.extname(file.originalname).toLowerCase() === ".apk"
    ) {
      return cb(null, true);
    }

    cb(
      new Error(
        "Only PNG/JPG/WEBP icons and APK files are allowed."
      )
    );
  }
});

// ===============================
// HELPERS
// ===============================
function readApps() {
  try {
    return JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );
  } catch {
    return [];
  }
}

function saveApps(apps) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(apps, null, 2)
  );
}

function adminAuth(req, res, next) {
  const key = req.headers["x-admin-key"];

  if (key !== ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin key"
    });
  }

  next();
}

// ===============================
// PUBLIC API
// ===============================
app.get("/api/apps", (req, res) => {
  const apps = readApps();

  res.json(apps);
});

// ===============================
// ADD APP
// ===============================
app.post(
  "/api/apps",
  adminAuth,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "icon", maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const apps = readApps();

      const apk = req.files?.file?.[0];
      const icon = req.files?.icon?.[0];

      if (!apk) {
        return res.status(400).json({
          success: false,
          message: "APK file select karo."
        });
      }

      const id =
        Date.now().toString() +
        Math.random().toString(36).slice(2, 7);

      const newApp = {
        id,

        name: req.body.name || "Untitled App",

        category:
          req.body.category || "Other",

        version:
          req.body.version || "1.0.0",

        size:
          req.body.size || "Unknown",

        description:
          req.body.description ||
          "No description available.",

        rating:
          Number(req.body.rating) || 5,

        downloads:
          Number(req.body.downloads) || 0,

        featured:
          req.body.featured === "true",

        icon: icon
          ? `/uploads/${icon.filename}`
          : "",

        download:
          `/uploads/${apk.filename}`,

        apkFile:
          apk.filename,

        iconFile:
          icon ? icon.filename : "",

        createdAt:
          new Date().toISOString()
      };

      apps.unshift(newApp);

      saveApps(apps);

      res.json({
        success: true,
        message: "App published successfully!",
        app: newApp
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ===============================
// EDIT APP
// ===============================
app.put(
  "/api/apps/:id",
  adminAuth,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "icon", maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const apps = readApps();

      const index = apps.findIndex(
        item => item.id === req.params.id
      );

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "App not found."
        });
      }

      const old = apps[index];

      const apk = req.files?.file?.[0];
      const icon = req.files?.icon?.[0];

      const updated = {
        ...old,

        name:
          req.body.name ?? old.name,

        category:
          req.body.category ?? old.category,

        version:
          req.body.version ?? old.version,

        size:
          req.body.size ?? old.size,

        description:
          req.body.description ?? old.description,

        rating:
          req.body.rating !== undefined
            ? Number(req.body.rating)
            : old.rating,

        downloads:
          req.body.downloads !== undefined
            ? Number(req.body.downloads)
            : old.downloads,

        featured:
          req.body.featured !== undefined
            ? req.body.featured === "true"
            : old.featured
      };

      if (apk) {
        updated.download =
          `/uploads/${apk.filename}`;

        updated.apkFile =
          apk.filename;
      }

      if (icon) {
        updated.icon =
          `/uploads/${icon.filename}`;

        updated.iconFile =
          icon.filename;
      }

      apps[index] = updated;

      saveApps(apps);

      res.json({
        success: true,
        message: "App updated successfully!",
        app: updated
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ===============================
// DELETE APP
// ===============================
app.delete(
  "/api/apps/:id",
  adminAuth,
  (req, res) => {
    try {
      const apps = readApps();

      const index = apps.findIndex(
        item => item.id === req.params.id
      );

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "App not found."
        });
      }

      const item = apps[index];

      // Delete APK
      if (item.apkFile) {
        const apkPath =
          path.join(UPLOAD_DIR, item.apkFile);

        if (fs.existsSync(apkPath)) {
          fs.unlinkSync(apkPath);
        }
      }

      // Delete icon
      if (item.iconFile) {
        const iconPath =
          path.join(UPLOAD_DIR, item.iconFile);

        if (fs.existsSync(iconPath)) {
          fs.unlinkSync(iconPath);
        }
      }

      apps.splice(index, 1);

      saveApps(apps);

      res.json({
        success: true,
        message: "App deleted successfully."
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ===============================
// HEALTH
// ===============================
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    store: "KIRUU STORE"
  });
});

// ===============================
// ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error(err);

  res.status(400).json({
    success: false,
    message: err.message
  });
});

// ===============================
// START
// ===============================
app.listen(PORT, () => {
  console.log(
    `KIRUU STORE running on port ${PORT}`
  );
});
