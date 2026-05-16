const express = require("express");
const { ethers } = require("ethers");
const router = express.Router();

// GET /api/v1/health
router.get("/", async (req, res) => {
  const health = { status: "ok", timestamp: Date.now(), services: {} };

  try {
    const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL || "https://evmrpc-testnet.0g.ai");
    const blockNumber = await provider.getBlockNumber();
    health.services.zgChain = { status: "ok", blockNumber };
  } catch (err) {
    health.services.zgChain = { status: "error", error: err.message };
    health.status = "degraded";
  }

  try {
    const { Indexer } = require("@0gfoundation/0g-storage-ts-sdk");
    const indexer = new Indexer(process.env.ZG_INDEXER_RPC || "https://indexer-storage-testnet-turbo.0g.ai");
    health.services.zgStorage = { status: "ok" };
  } catch (err) {
    health.services.zgStorage = { status: "error", error: err.message };
    health.status = "degraded";
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
});

module.exports = router;
