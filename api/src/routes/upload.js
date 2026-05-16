const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { v4: uuidv4 } = require("uuid");
const { uploadFile, sha256File } = require("../lib/storage");
const logger = require("../lib/logger");

const router  = express.Router();
const UPLOADS = path.join(__dirname, "../../uploads");
fs.mkdirSync(UPLOADS, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS,
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/webp","video/mp4","video/webm","video/quicktime"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// POST /api/v1/upload
router.post("/", upload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "NO_FILE", message: "No file uploaded or unsupported type" });

  try {
    const sha256 = sha256File(req.file.path);
    logger.info("File received", { sha256, size: req.file.size, mime: req.file.mimetype });

    // Upload to 0G Storage
    const { rootHash, txHash } = await uploadFile(req.file.path);

    // Clean up local temp file
    fs.unlinkSync(req.file.path);

    res.json({
      sha256,
      rootHash,
      txHash,
      mimeType:  req.file.mimetype,
      size:      req.file.size,
      storageUrl: `https://storagescan.0g.ai/tx/${rootHash}`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
