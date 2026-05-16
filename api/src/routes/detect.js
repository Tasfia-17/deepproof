const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { v4: uuidv4 } = require("uuid");
const Queue   = require("bull");
const { sha256File, uploadFile, uploadBuffer } = require("../lib/storage");
const { detect } = require("../lib/detection");
const { registerOnChain } = require("../lib/chain");
const logger = require("../lib/logger");

const router  = express.Router();
const UPLOADS = path.join(__dirname, "../../uploads");
fs.mkdirSync(UPLOADS, { recursive: true });

// In-memory job store (replace with Redis-backed Bull in production)
const jobs = new Map();

const storage = multer.diskStorage({
  destination: UPLOADS,
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// POST /api/v1/detect  — submit file for detection
router.post("/", upload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "NO_FILE" });

  const jobId = uuidv4();
  const sha256 = sha256File(req.file.path);

  jobs.set(jobId, { status: "queued", sha256, createdAt: Date.now() });
  res.status(202).json({ jobId, sha256, status: "queued" });

  // Process asynchronously
  processDetection(jobId, req.file.path, req.file.mimetype, sha256, req.body.recipientAddress).catch(
    (err) => logger.error("Detection job failed", { jobId, err: err.message })
  );
});

// GET /api/v1/detect/:jobId  — poll status
router.get("/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "JOB_NOT_FOUND" });
  res.json(job);
});

async function processDetection(jobId, filePath, mimeType, sha256, recipientAddress) {
  try {
    jobs.set(jobId, { ...jobs.get(jobId), status: "detecting" });

    // 1. Run TEE detection
    const result = await detect(filePath, mimeType, sha256);
    jobs.set(jobId, { ...jobs.get(jobId), status: "uploading_evidence", result });

    // 2. Upload evidence (detection result JSON) to 0G Storage
    const evidenceJson = JSON.stringify({ sha256, result, timestamp: Date.now() });
    const { rootHash: evidenceRootHash } = await uploadBuffer(Buffer.from(evidenceJson));

    // 3. Register on 0G Chain + mint SPT
    jobs.set(jobId, { ...jobs.get(jobId), status: "anchoring" });
    const { registryTx, mintTx } = await registerOnChain({
      sha256Hex:        sha256,
      pHashHex:         result.pHash,
      aiEmbedding:      result.aiEmbedding,
      verdict:          result.verdict,
      confidence:       result.confidence,
      modelVersion:     result.modelVersion,
      enclaveSignature: result.enclaveSignature,
      storageRootHash:  evidenceRootHash,
      recipientAddress,
    });

    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: "complete",
      result,
      evidenceRootHash,
      registryTx,
      mintTx,
      completedAt: Date.now(),
    });

    logger.info("Detection complete", { jobId, verdict: result.verdictLabel, confidence: result.confidence });
  } catch (err) {
    jobs.set(jobId, { ...jobs.get(jobId), status: "error", error: err.message });
    logger.error("Detection failed", { jobId, err: err.message });
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

module.exports = router;
