// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProvenanceRegistry
 * @notice Stores perceptual hash + SHA-256 + metadata for every verified piece of content.
 *         Immutable once written. Anyone can query. Core on-chain proof layer.
 */
contract ProvenanceRegistry is Ownable, ReentrancyGuard {
    struct ProvenanceRecord {
        bytes32 sha256Hash;       // SHA-256 of original file
        bytes32 pHash;            // 64-bit classical perceptual hash (padded to 32 bytes)
        bytes   aiEmbedding;      // 512-dim AI perceptual fingerprint (compressed)
        uint8   verdict;          // 0=unregistered, 1=authentic, 2=synthetic
        uint8   confidence;       // 0-100
        string  modelVersion;     // e.g. "efficientnet-b4-v1.2"
        bytes   enclaveSignature; // TEE-signed attestation
        address registrar;        // who submitted this record
        uint256 timestamp;
        string  storageRootHash;  // 0G Storage root hash for evidence files
    }

    // sha256Hash => record
    mapping(bytes32 => ProvenanceRecord) public records;
    // pHash => sha256Hash (for perceptual lookup)
    mapping(bytes32 => bytes32) public pHashIndex;

    // XOR completeness: sessionId => XOR of all capture hashes
    mapping(bytes32 => bytes32) public sessionXOR;
    mapping(bytes32 => uint256) public sessionCount;

    event RecordRegistered(
        bytes32 indexed sha256Hash,
        bytes32 indexed pHash,
        uint8 verdict,
        uint8 confidence,
        address registrar,
        uint256 timestamp
    );
    event SessionUpdated(bytes32 indexed sessionId, bytes32 xorSum, uint256 count);

    // Only authorized registrars (detection nodes) can write
    mapping(address => bool) public authorizedRegistrars;

    modifier onlyRegistrar() {
        require(authorizedRegistrars[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setRegistrar(address registrar, bool authorized) external onlyOwner {
        authorizedRegistrars[registrar] = authorized;
    }

    function register(
        bytes32 sha256Hash,
        bytes32 pHash,
        bytes calldata aiEmbedding,
        uint8 verdict,
        uint8 confidence,
        string calldata modelVersion,
        bytes calldata enclaveSignature,
        string calldata storageRootHash
    ) external onlyRegistrar nonReentrant {
        require(records[sha256Hash].timestamp == 0, "Already registered");
        require(verdict <= 2, "Invalid verdict");
        require(confidence <= 100, "Invalid confidence");

        records[sha256Hash] = ProvenanceRecord({
            sha256Hash: sha256Hash,
            pHash: pHash,
            aiEmbedding: aiEmbedding,
            verdict: verdict,
            confidence: confidence,
            modelVersion: modelVersion,
            enclaveSignature: enclaveSignature,
            registrar: msg.sender,
            timestamp: block.timestamp,
            storageRootHash: storageRootHash
        });

        pHashIndex[pHash] = sha256Hash;

        emit RecordRegistered(sha256Hash, pHash, verdict, confidence, msg.sender, block.timestamp);
    }

    function getRecord(bytes32 sha256Hash) external view returns (ProvenanceRecord memory) {
        return records[sha256Hash];
    }

    function lookupByPHash(bytes32 pHash) external view returns (ProvenanceRecord memory) {
        bytes32 sha256Hash = pHashIndex[pHash];
        return records[sha256Hash];
    }

    // XOR completeness: add a capture to a session
    function addToSession(bytes32 sessionId, bytes32 captureHash) external onlyRegistrar {
        sessionXOR[sessionId] ^= captureHash;
        sessionCount[sessionId]++;
        emit SessionUpdated(sessionId, sessionXOR[sessionId], sessionCount[sessionId]);
    }

    // Verify session completeness: caller provides remaining hashes, contract checks XOR
    function verifySession(bytes32 sessionId, bytes32[] calldata remainingHashes)
        external view returns (bool complete, bytes32 missingXOR)
    {
        bytes32 remaining = bytes32(0);
        for (uint i = 0; i < remainingHashes.length; i++) {
            remaining ^= remainingHashes[i];
        }
        complete = (remaining == sessionXOR[sessionId]);
        missingXOR = sessionXOR[sessionId] ^ remaining;
    }
}
