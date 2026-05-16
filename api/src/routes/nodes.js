const express = require("express");
const { getActiveNodes, getNodeInfo } = require("../lib/chain");
const router = express.Router();

// GET /api/v1/nodes
router.get("/", async (req, res, next) => {
  try {
    const addresses = await getActiveNodes();
    const nodes = await Promise.all(
      addresses.map(async (addr) => {
        const info = await getNodeInfo(addr);
        return {
          address:            addr,
          stakedAmount:       info[0].toString(),
          slashCount:         Number(info[1]),
          totalVerifications: Number(info[2]),
          active:             info[5],
          endpoint:           info[6],
          reputationScore:    computeReputation(Number(info[2]), Number(info[1])),
        };
      })
    );
    res.json({ count: nodes.length, nodes });
  } catch (err) {
    next(err);
  }
});

function computeReputation(verifications, slashes) {
  if (verifications === 0) return 100;
  return Math.max(0, Math.round(100 - (slashes / verifications) * 100));
}

module.exports = router;
