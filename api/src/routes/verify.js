const express = require("express");
const { getRecord } = require("../lib/chain");
const router = express.Router();

// GET /api/v1/verify/:hash
router.get("/:hash", async (req, res, next) => {
  try {
    const record = await getRecord(req.params.hash);
    if (!record || record.timestamp === 0n) {
      return res.status(404).json({ error: "NOT_FOUND", message: "No provenance record for this hash" });
    }
    res.json({
      sha256:           req.params.hash,
      verdict:          Number(record[3]) === 1 ? "authentic" : "synthetic",
      verdictCode:      Number(record[3]),
      confidence:       Number(record[4]),
      modelVersion:     record[5],
      registrar:        record[7],
      timestamp:        Number(record[8]),
      storageRootHash:  record[9],
      storageUrl:       `https://storagescan.0g.ai/tx/${record[9]}`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
