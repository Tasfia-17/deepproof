/**
 * 0G Chain contract interaction layer.
 * Reads deployments.json for addresses; uses ethers v6.
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const DEPLOYMENTS_PATH = path.join(__dirname, "../../../deployments.json");

// Minimal ABIs — only what the API needs
const REGISTRY_ABI = [
  "function register(bytes32,bytes32,bytes,uint8,uint8,string,bytes,string) external",
  "function getRecord(bytes32) external view returns (tuple(bytes32,bytes32,bytes,uint8,uint8,string,bytes,address,uint256,string))",
  "function lookupByPHash(bytes32) external view returns (tuple(bytes32,bytes32,bytes,uint8,uint8,string,bytes,address,uint256,string))",
  "function addToSession(bytes32,bytes32) external",
  "function verifySession(bytes32,bytes32[]) external view returns (bool,bytes32)",
];

const SPT_ABI = [
  "function mint(address,bytes32,uint8,string) external returns (uint256)",
  "function contentHashToToken(bytes32) external view returns (uint256)",
  "function tokenVerdict(uint256) external view returns (uint8)",
  "function tokenCertURI(uint256) external view returns (string)",
];

const LINEAGE_ABI = [
  "function registerDerivative(bytes32,bytes32,string) external",
  "function getLineage(bytes32) external view returns (tuple(bytes32,bytes32[],string,address,uint256))",
  "function getRoot(bytes32) external view returns (bytes32)",
];

const STAKING_ABI = [
  "function getActiveNodes() external view returns (address[])",
  "function getNodeInfo(address) external view returns (tuple(uint256,uint256,uint256,uint256,uint256,bool,string))",
];

function getProvider() {
  const rpc = process.env.ZG_RPC_URL || "https://evmrpc-testnet.0g.ai";
  return new ethers.JsonRpcProvider(rpc);
}

function getSigner() {
  const key = process.env.ZG_PRIVATE_KEY;
  if (!key) throw new Error("ZG_PRIVATE_KEY not set");
  return new ethers.Wallet(key, getProvider());
}

function getAddresses() {
  if (!fs.existsSync(DEPLOYMENTS_PATH)) {
    // Return env-based addresses as fallback
    return {
      provenanceRegistry: process.env.CONTRACT_REGISTRY,
      soulboundToken:     process.env.CONTRACT_SPT,
      nodeStaking:        process.env.CONTRACT_STAKING,
      derivativeLineage:  process.env.CONTRACT_LINEAGE,
    };
  }
  return JSON.parse(fs.readFileSync(DEPLOYMENTS_PATH, "utf8"));
}

function registry(write = false) {
  const addr = getAddresses().provenanceRegistry;
  if (!addr) throw new Error("ProvenanceRegistry address not configured");
  return new ethers.Contract(addr, REGISTRY_ABI, write ? getSigner() : getProvider());
}

function spt(write = false) {
  const addr = getAddresses().soulboundToken;
  if (!addr) throw new Error("SPT address not configured");
  return new ethers.Contract(addr, SPT_ABI, write ? getSigner() : getProvider());
}

function lineage(write = false) {
  const addr = getAddresses().derivativeLineage;
  if (!addr) throw new Error("DerivativeLineage address not configured");
  return new ethers.Contract(addr, LINEAGE_ABI, write ? getSigner() : getProvider());
}

function staking() {
  const addr = getAddresses().nodeStaking;
  if (!addr) throw new Error("NodeStaking address not configured");
  return new ethers.Contract(addr, STAKING_ABI, getProvider());
}

/**
 * Register a detection result on-chain and mint an SPT.
 */
async function registerOnChain({ sha256Hex, pHashHex, aiEmbedding, verdict, confidence, modelVersion, enclaveSignature, storageRootHash, recipientAddress }) {
  const sha256Bytes = ethers.zeroPadValue("0x" + sha256Hex, 32);
  const pHashBytes  = ethers.zeroPadValue("0x" + pHashHex.padStart(64, "0"), 32);
  const embBytes    = ethers.toUtf8Bytes(JSON.stringify(aiEmbedding)); // compressed JSON
  const sigBytes    = ethers.toUtf8Bytes(enclaveSignature || "simulated-tee-sig");

  logger.info("Registering on 0G Chain", { sha256Hex, verdict, confidence });

  const reg = registry(true);
  const tx  = await reg.register(
    sha256Bytes, pHashBytes, embBytes,
    verdict, confidence,
    modelVersion, sigBytes, storageRootHash
  );
  await tx.wait();
  logger.info("Registry tx confirmed", { hash: tx.hash });

  // Mint SPT
  const certURI = `https://storagescan.0g.ai/tx/${storageRootHash}`;
  const sptContract = spt(true);
  const mintTx = await sptContract.mint(
    recipientAddress || (await getSigner()).address,
    sha256Bytes, verdict, certURI
  );
  await mintTx.wait();
  logger.info("SPT minted", { hash: mintTx.hash });

  return { registryTx: tx.hash, mintTx: mintTx.hash };
}

async function getRecord(sha256Hex) {
  const sha256Bytes = ethers.zeroPadValue("0x" + sha256Hex, 32);
  return registry().getRecord(sha256Bytes);
}

async function getActiveNodes() {
  return staking().getActiveNodes();
}

async function getNodeInfo(address) {
  return staking().getNodeInfo(address);
}

async function registerDerivative(childHashHex, parentHashHex, editType) {
  const child  = ethers.zeroPadValue("0x" + childHashHex, 32);
  const parent = parentHashHex
    ? ethers.zeroPadValue("0x" + parentHashHex, 32)
    : ethers.ZeroHash;
  const lin = lineage(true);
  const tx  = await lin.registerDerivative(child, parent, editType);
  await tx.wait();
  return tx.hash;
}

async function getLineage(sha256Hex) {
  const hash = ethers.zeroPadValue("0x" + sha256Hex, 32);
  return lineage().getLineage(hash);
}

module.exports = { registerOnChain, getRecord, getActiveNodes, getNodeInfo, registerDerivative, getLineage };
