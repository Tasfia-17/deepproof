// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SoulboundProvenanceToken
 * @notice Non-transferable ERC-721. One token per verified content hash.
 *         Minted by the ProvenanceRegistry after successful TEE detection.
 *         Burns are allowed (owner can revoke if fraud detected).
 */
contract SoulboundProvenanceToken is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    // tokenId => content sha256 hash
    mapping(uint256 => bytes32) public tokenContentHash;
    // sha256 hash => tokenId (for reverse lookup)
    mapping(bytes32 => uint256) public contentHashToToken;
    // tokenId => verdict (1=authentic, 2=synthetic)
    mapping(uint256 => uint8) public tokenVerdict;
    // tokenId => on-chain certificate URI (points to 0G Storage)
    mapping(uint256 => string) public tokenCertURI;

    address public minter; // ProvenanceRegistry or authorized backend

    event SPTMinted(uint256 indexed tokenId, bytes32 indexed contentHash, uint8 verdict, address recipient);
    event SPTRevoked(uint256 indexed tokenId, bytes32 indexed contentHash);

    modifier onlyMinter() {
        require(msg.sender == minter || msg.sender == owner(), "Not minter");
        _;
    }

    constructor() ERC721("DeepProof Soulbound Provenance Token", "SPT") Ownable(msg.sender) {}

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function mint(
        address recipient,
        bytes32 contentHash,
        uint8 verdict,
        string calldata certURI
    ) external onlyMinter returns (uint256 tokenId) {
        require(contentHashToToken[contentHash] == 0, "Already minted for this content");
        _tokenIdCounter++;
        tokenId = _tokenIdCounter;

        _safeMint(recipient, tokenId);
        tokenContentHash[tokenId] = contentHash;
        contentHashToToken[contentHash] = tokenId;
        tokenVerdict[tokenId] = verdict;
        tokenCertURI[tokenId] = certURI;

        emit SPTMinted(tokenId, contentHash, verdict, recipient);
    }

    function revoke(uint256 tokenId) external onlyOwner {
        bytes32 contentHash = tokenContentHash[tokenId];
        delete contentHashToToken[contentHash];
        delete tokenContentHash[tokenId];
        _burn(tokenId);
        emit SPTRevoked(tokenId, contentHash);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return tokenCertURI[tokenId];
    }

    // Soulbound: block all transfers except mint (from=0) and burn (to=0)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "SPT: non-transferable");
        return super._update(to, tokenId, auth);
    }
}
