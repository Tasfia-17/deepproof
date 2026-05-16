/**
 * 0G Storage integration
 * Wraps @0gfoundation/0g-storage-ts-sdk for upload/download/hash operations.
 * Docs: https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
 */
const { ZgFile, Indexer, MemData } = require("@0gfoundation/0g-storage-ts-sdk");
const { ethers } = require("ethers");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const RPC_URL      = process.env.ZG_RPC_URL      || "https://evmrpc-testnet.0g.ai";
const INDEXER_RPC  = process.env.ZG_INDEXER_RPC  || "https://indexer-storage-testnet-turbo.0g.ai";
const PRIVATE_KEY  = process.env.ZG_PRIVATE_KEY;

function getSigner() {
  if (!PRIVATE_KEY) throw new Error("ZG_PRIVATE_KEY not set");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(PRIVATE_KEY, provider);
}

/**
 * Upload a file to 0G Storage.
 * @returns {{ rootHash: string, txHash: string }}
 */
async function uploadFile(filePath) {
  const signer  = getSigner();
  const indexer = new Indexer(INDEXER_RPC);
  const file    = await ZgFile.fromFilePath(filePath);

  const [tree, treeErr] = await file.merkleTree();
  if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

  const rootHash = tree.rootHash();
  logger.info("Uploading to 0G Storage", { rootHash, filePath });

  const [tx, uploadErr] = await indexer.upload(file, RPC_URL, signer);
  await file.close();
  if (uploadErr) throw new Error(`0G upload error: ${uploadErr}`);

  const result = "rootHash" in tx
    ? { rootHash: tx.rootHash, txHash: tx.txHash }
    : { rootHash: tx.rootHashes[0], txHash: tx.txHashes[0] };

  logger.info("0G Storage upload complete", result);
  return result;
}

/**
 * Upload raw Buffer/string to 0G Storage (no temp file needed).
 * @returns {{ rootHash: string, txHash: string }}
 */
async function uploadBuffer(buffer) {
  const signer  = getSigner();
  const indexer = new Indexer(INDEXER_RPC);
  const data    = typeof buffer === "string" ? Buffer.from(buffer) : buffer;
  const mem     = new MemData(data);

  const [tree, treeErr] = await mem.merkleTree();
  if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

  const [tx, uploadErr] = await indexer.upload(mem, RPC_URL, signer);
  if (uploadErr) throw new Error(`0G upload error: ${uploadErr}`);

  return "rootHash" in tx
    ? { rootHash: tx.rootHash, txHash: tx.txHash }
    : { rootHash: tx.rootHashes[0], txHash: tx.txHashes[0] };
}

/**
 * Download a file from 0G Storage by root hash.
 */
async function downloadFile(rootHash, outputPath) {
  const indexer = new Indexer(INDEXER_RPC);
  const err = await indexer.download(rootHash, outputPath, true);
  if (err) throw new Error(`0G download error: ${err}`);
}

/**
 * Compute SHA-256 of a file (hex string, no 0x prefix).
 */
function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/**
 * Compute SHA-256 of a buffer.
 */
function sha256Buffer(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

module.exports = { uploadFile, uploadBuffer, downloadFile, sha256File, sha256Buffer };
