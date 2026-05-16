// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DerivativeLineage
 * @notice Links child content hash → parent content hash on-chain.
 *         Creates an auditable family tree of content derivatives.
 *         Deepfake injection attempts are flagged and stored in the lineage.
 */
contract DerivativeLineage is Ownable {
    struct LineageNode {
        bytes32 parentHash;    // 0x0 if original
        bytes32[] children;
        string  editType;      // "crop", "color-adjust", "news-edit", "deepfake-attempt"
        address registrar;
        uint256 timestamp;
    }

    mapping(bytes32 => LineageNode) public lineage;
    mapping(address => bool) public authorizedRegistrars;

    event LineageRegistered(bytes32 indexed contentHash, bytes32 indexed parentHash, string editType);

    modifier onlyRegistrar() {
        require(authorizedRegistrars[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setRegistrar(address registrar, bool authorized) external onlyOwner {
        authorizedRegistrars[registrar] = authorized;
    }

    function registerDerivative(
        bytes32 contentHash,
        bytes32 parentHash,
        string calldata editType
    ) external onlyRegistrar {
        require(lineage[contentHash].timestamp == 0, "Already registered");

        lineage[contentHash] = LineageNode({
            parentHash: parentHash,
            children: new bytes32[](0),
            editType: editType,
            registrar: msg.sender,
            timestamp: block.timestamp
        });

        // Add as child of parent
        if (parentHash != bytes32(0)) {
            lineage[parentHash].children.push(contentHash);
        }

        emit LineageRegistered(contentHash, parentHash, editType);
    }

    function getLineage(bytes32 contentHash) external view returns (LineageNode memory) {
        return lineage[contentHash];
    }

    // Walk up the tree to find the original
    function getRoot(bytes32 contentHash) external view returns (bytes32 root) {
        root = contentHash;
        while (lineage[root].parentHash != bytes32(0)) {
            root = lineage[root].parentHash;
        }
    }
}
