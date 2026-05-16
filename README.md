# DeepProof Nexus

Decentralized deepfake detection and perceptual provenance network built on 0G infrastructure.

Built for the 0G APAC Hackathon 2026.

---

## The Problem

Deepfake media is accelerating faster than detection can keep up. Existing detection tools share three critical failures:

**Centralized trust.** Tools like Microsoft Azure Content Safety and Hive Moderation return a JSON verdict from a black-box server. There is no way to verify the model ran correctly, that the operator did not alter the result, or that the evidence was not deleted after the fact. You are trusting a company's terms of service.

**Metadata fragility.** The C2PA standard embeds provenance in file metadata. Every major social platform strips this metadata on upload. A screenshot destroys it entirely. The provenance chain breaks the moment content leaves its origin.

**No tamper evidence.** If a government or adversary forces a detection provider to delete evidence of a deepfake verdict, there is no cryptographic record that the evidence ever existed. The proof disappears with the data.

These failures matter because deepfake media is being used in political disinformation, financial fraud, non-consensual intimate imagery, and courtroom evidence tampering. A detection system that can be silenced or manipulated is worse than no system at all.

---

## The Solution

DeepProof Nexus makes deepfake detection verifiable, permanent, and tamper-evident by using 0G's full infrastructure stack.

**Verifiable inference via 0G Compute (TEE).** Detection runs inside Intel TDX hardware enclaves through the 0G Compute Router. The enclave signs every verdict with enclave-born keys. The node operator cannot see the content, cannot alter the result, and cannot forge the signature. The TEE attestation is stored on-chain alongside the verdict.

**Permanent evidence via 0G Storage.** Every detection job uploads its full evidence package to 0G Storage: the content hash, detection scores, confidence breakdown, and TEE attestation report. The storage root hash is anchored on-chain. Evidence cannot be silently deleted because the on-chain record points to it permanently.

**On-chain provenance via 0G Chain.** A Solidity registry stores the SHA-256 hash, perceptual hash, verdict, confidence, model version, TEE signature, and 0G Storage root hash for every verified piece of content. A non-transferable ERC-721 Soulbound Provenance Token is minted to the content owner as a portable certificate.

**Tamper detection via XOR invariant.** Every evidence upload XORs its root hash into a global accumulator stored in the ProvenanceRegistry contract. Anyone can recompute this accumulator by fetching all evidence from 0G Storage and XORing the hashes. If the recomputed value does not match the on-chain value, evidence has been deleted or tampered with. This is the omission detection mechanism -- no competitor offers this.

**Perceptual hashing that survives compression.** A DCT-based perceptual hash is computed from the content and stored on-chain. Unlike SHA-256, a perceptual hash matches visually identical content even after JPEG compression, resizing, or screenshot. Content can be identified across social platforms even after metadata stripping.

**Derivative lineage.** Every edit, crop, or re-registration links the child content hash to its parent on-chain. This creates an auditable family tree of content derivatives. Deepfake injection attempts are flagged and stored in the immutable lineage graph.

**Economic enforcement via node staking.** Detection nodes stake 0G tokens to join the network. Nodes that submit verdicts deviating from consensus are slashed. Honest detection is enforced by economic incentive, not policy.

---

## Architecture

```
User uploads file
      |
      v
Express API (Node.js)
      |
      +---> 0G Storage (evidence upload, root hash returned)
      |
      +---> 0G Compute Router (TEE inference, enclave signature returned)
      |
      +---> 0G Chain
              |
              +---> ProvenanceRegistry.register() (hash + verdict + TEE sig + storage root)
              |
              +---> SoulboundProvenanceToken.mint() (non-transferable ERC-721 certificate)
```

---

## 0G Integration

| Component | Usage |
|---|---|
| 0G Chain (chainId 16602) | ProvenanceRegistry, SoulboundProvenanceToken, NodeStaking, PaymentRouter, DerivativeLineage |
| 0G Storage | Evidence packages (detection scores, TEE attestation, content hashes) |
| 0G Compute Router | TEE-sealed deepfake inference via OpenAI-compatible API |

---

## Deployed Contracts (0G Testnet -- Galileo, chainId 16602)

| Contract | Address |
|---|---|
| ProvenanceRegistry | 0xdA9AEe3C30520515f33E5311Cb8D646B6cf8cB08 |
| SoulboundProvenanceToken | 0x97A09b2b6a531d5eC1481E29995f0c93D3433484 |
| NodeStaking | 0xea67B497e7d7AB844ae6FA5aEB312d866A3F26EB |
| PaymentRouter | 0xB0d0c5107380390493138A0Eb64e1De0FF933903 |
| DerivativeLineage | 0xe75c5F99e0De613A413593058D64C8792D769889 |

Block explorer: https://chainscan-galileo.0g.ai

---

## Live On-Chain Activity

| Event | Transaction |
|---|---|
| First detection registered | 0xbe059f2544df6c18ee2e82f2723849ead3d3bb88e98c9a90d3e90a50ae77cd4b |
| First SPT minted | 0x8fcda8e8620aa50cd22a27570d658d53208e340d7b307e194e7a9c1e8cff8bc4 |
| Evidence on 0G Storage | 0x21c8c238d2f50789955d7a4f7bab5e965d2ab6b107e394385c30b262a25f75d9 |

Explorer links:
- https://chainscan-galileo.0g.ai/tx/0xbe059f2544df6c18ee2e82f2723849ead3d3bb88e98c9a90d3e90a50ae77cd4b
- https://chainscan-galileo.0g.ai/tx/0x8fcda8e8620aa50cd22a27570d658d53208e340d7b307e194e7a9c1e8cff8bc4
- https://storagescan-galileo.0g.ai/tx/0x21c8c238d2f50789955d7a4f7bab5e965d2ab6b107e394385c30b262a25f75d9

---

## Project Structure

```
deepproof/
  contracts/          Solidity contracts (Hardhat)
    contracts/
      ProvenanceRegistry.sol
      SoulboundProvenanceToken.sol
      NodeStaking.sol
      PaymentRouter.sol
      DerivativeLineage.sol
    scripts/deploy.js
    hardhat.config.js
  api/                Express backend
    src/
      lib/
        storage.js    0G Storage SDK integration
        chain.js      0G Chain contract calls
        detection.js  TEE inference + simulation
      routes/
        detect.js     POST /detect, GET /detect/:jobId
        upload.js     POST /upload
        verify.js     GET /verify/:hash
        certificate.js GET /certificate/:hash (PDF)
        lineage.js    GET /lineage/:hash
        audit.js      GET /audit (XOR completeness)
        nodes.js      GET /nodes
        health.js     GET /health
    tests/api.test.js
  frontend/           React + Vite
    src/
      pages/
        Landing.jsx   Hero, stats, feature grid
        Detect.jsx    Live detection dashboard
        Upload.jsx    0G Storage upload
        Verify.jsx    On-chain hash lookup
        Lineage.jsx   Derivative tree
        Audit.jsx     XOR completeness audit
        Nodes.jsx     Active node list
        Certificate.jsx PDF certificate download
  agents/             Python EfficientNet-B4 detection pipeline
  cli/                Node.js CLI tool
  docker-compose.yml
```

---

## Smart Contracts

**ProvenanceRegistry**

Stores SHA-256 hash, perceptual hash, 512-dim AI embedding, verdict, confidence, model version, TEE enclave signature, registrar address, timestamp, and 0G Storage root hash for every verified piece of content. Immutable once written. Includes XOR session accumulator for omission detection.

**SoulboundProvenanceToken**

Non-transferable ERC-721. One token per verified content hash. Transfer is blocked at the contract level -- only mint (from zero address) and burn (to zero address) are permitted. Burns are allowed for fraud revocation. Token URI points to the evidence package on 0G Storage.

**NodeStaking**

Detection nodes stake a minimum of 1000 0G tokens to register. Nodes are slashed 10% of stake per dishonest verdict. Stake below minimum triggers automatic deactivation. Seven-day unbonding period on withdrawal.

**PaymentRouter**

Escrow contract. Users deposit 0G tokens. Each detection job costs 0.05 0G. Upon receiving a TEE-signed result verified by the settlement authority, funds release to the node operator minus a 10% protocol fee.

**DerivativeLineage**

Links child content hash to parent content hash on-chain. Stores edit type (crop, color-adjust, news-edit, deepfake-attempt). Provides tree traversal to find the original content root.

---

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.9+ (optional, for real model inference)

### 1. Clone and configure

```bash
git clone https://github.com/Tasfia-17/deepproof.git
cd deepproof
cp .env.example .env
```

The `.env.example` contains all required variables. The deployed contract addresses are pre-filled.

### 2. Start the API

```bash
cd api
npm install
npm start
```

API runs on http://localhost:3001

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### 4. Install the CLI (optional)

```bash
cd cli
npm install
npm link
deepproof --help
```

### 5. Python detection agent (optional)

Required only when `USE_REAL_TEE=false` and you want local EfficientNet-B4 inference instead of simulation.

```bash
cd agents
pip install -r requirements.txt
python detect.py test.jpg
```

---

## Environment Variables

```
ZG_RPC_URL                  0G Chain RPC endpoint
ZG_INDEXER_RPC              0G Storage indexer URL
ZG_ROUTER_URL               0G Compute Router URL
ZG_PRIVATE_KEY              Wallet private key for signing transactions
CONTRACT_REGISTRY           ProvenanceRegistry contract address
CONTRACT_SPT                SoulboundProvenanceToken contract address
CONTRACT_STAKING            NodeStaking contract address
CONTRACT_LINEAGE            DerivativeLineage contract address
CONTRACT_PAYMENT            PaymentRouter contract address
USE_REAL_TEE                Set to true to use 0G Compute Router for inference
ZG_ROUTER_API_KEY           API key for 0G Compute Router (required if USE_REAL_TEE=true)
TEE_MODE                    simulation or production
PORT                        API port (default 3001)
```

---

## API Reference

```
POST   /api/v1/detect              Submit file for detection (multipart/form-data)
GET    /api/v1/detect/:jobId       Poll detection job status
POST   /api/v1/upload              Upload file to 0G Storage
GET    /api/v1/verify/:hash        Look up on-chain record by SHA-256
GET    /api/v1/certificate/:hash   Download PDF authenticity certificate
GET    /api/v1/lineage/:hash       Get derivative lineage tree
GET    /api/v1/audit               XOR completeness audit
GET    /api/v1/nodes               List active detection nodes
GET    /api/v1/health              Service health check
```

Detection job lifecycle: queued -> detecting -> uploading_evidence -> anchoring -> complete

---

## CLI Reference

```bash
deepproof verify <file> [--address <wallet>] [--wait]
deepproof batch <directory> [--address <wallet>]
deepproof query <sha256-hash>
deepproof node --list
deepproof audit
```

---

## Deploying Contracts

```bash
cd contracts
npm install
cp ../.env.example ../.env
# Add DEPLOYER_PRIVATE_KEY to .env

# Testnet
npm run deploy:testnet

# Mainnet
npm run deploy:mainnet
```

Deployment saves addresses to `contracts/deployments.json` and the API reads from it automatically.

---

## Running Tests

```bash
cd api
npm test
```

---

## Vercel Deployment

The frontend is a standard Vite React app and deploys to Vercel without configuration.

1. Import the repository into Vercel
2. Set root directory to `frontend`
3. Framework preset: Vite
4. Add environment variable: `VITE_API_URL=https://your-api-domain.com/api/v1`
5. Deploy

The API can be deployed separately to Railway, Render, or any Node.js host. Set all environment variables from `.env.example` in the host dashboard.

---

## 0G Network Details

| Network | Chain ID | RPC | Explorer |
|---|---|---|---|
| Testnet (Galileo) | 16602 | https://evmrpc-testnet.0g.ai | https://chainscan-galileo.0g.ai |
| Mainnet | 16661 | https://evmrpc.0g.ai | https://chainscan.0g.ai |

Storage indexer (testnet): https://indexer-storage-testnet-turbo.0g.ai
Compute Router: https://router-api.0g.ai/v1

---

## License

MIT
