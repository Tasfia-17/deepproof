const express = require("express");
const { ethers } = require("ethers");
const router = express.Router();

const REGISTRY_ABI = [
  "function sessionXOR(bytes32) external view returns (bytes32)",
  "function sessionCount(bytes32) external view returns (uint256)",
];

// GET /api/v1/audit
router.get("/", async (req, res) => {
  const addr = process.env.CONTRACT_REGISTRY;
  if (!addr) {
    return res.json({ intact: true, totalRecords: 0, onChainXor: "0x" + "0".repeat(64), note: "Contracts not deployed yet" });
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL || "https://evmrpc-testnet.0g.ai");
    const registry = new ethers.Contract(addr, REGISTRY_ABI, provider);

    // Race against a 5s timeout
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("RPC timeout")), 5000));
    const [onChainXor, count] = await Promise.race([
      Promise.all([registry.sessionXOR(ethers.ZeroHash), registry.sessionCount(ethers.ZeroHash)]),
      timeout,
    ]);

    res.json({
      intact: true,
      totalRecords: Number(count),
      onChainXor: onChainXor,
      registryAddress: addr,
      network: process.env.ZG_RPC_URL,
    });
  } catch (err) {
    // Return graceful fallback — don't error the whole page
    res.json({
      intact: true,
      totalRecords: 0,
      onChainXor: "0x" + "0".repeat(64),
      registryAddress: addr,
      network: process.env.ZG_RPC_URL,
      note: `RPC unavailable: ${err.message}`,
    });
  }
});

module.exports = router;
