const express = require("express");
const { getLineage } = require("../lib/chain");
const router = express.Router();

// GET /api/v1/lineage/:hash
router.get("/:hash", async (req, res, next) => {
  try {
    const node = await getLineage(req.params.hash);
    if (!node || node[4] === 0n) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    res.json({
      contentHash: req.params.hash,
      parentHash:  node[0] === "0x" + "0".repeat(64) ? null : node[0],
      children:    node[1],
      editType:    node[2],
      registrar:   node[3],
      timestamp:   Number(node[4]),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
