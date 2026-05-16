// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title PaymentRouter
 * @notice Escrow + instant release to detection node operators upon TEE-signed proof.
 *         Users deposit 0G tokens. Each detection job costs PRICE_PER_CHECK.
 *         Upon receiving a valid TEE-signed result, funds release to the node.
 */
contract PaymentRouter is Ownable, ReentrancyGuard {
    IERC20 public paymentToken;

    uint256 public pricePerCheck = 0.05 ether; // 0.05 0G tokens per check
    uint256 public protocolFeePercent = 10;    // 10% to protocol treasury

    struct Job {
        address requester;
        address assignedNode;
        uint256 amount;
        bool settled;
        uint256 createdAt;
        bytes32 contentHash;
    }

    mapping(bytes32 => Job) public jobs; // jobId => Job
    mapping(address => uint256) public balances; // user deposits

    address public settlementAuthority; // backend that verifies TEE signatures

    event Deposited(address indexed user, uint256 amount);
    event JobCreated(bytes32 indexed jobId, address indexed requester, bytes32 contentHash);
    event JobSettled(bytes32 indexed jobId, address indexed node, uint256 nodeAmount, uint256 feeAmount);
    event Withdrawn(address indexed user, uint256 amount);

    modifier onlySettlement() {
        require(msg.sender == settlementAuthority || msg.sender == owner(), "Not settlement authority");
        _;
    }

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        settlementAuthority = msg.sender;
    }

    function setSettlementAuthority(address authority) external onlyOwner {
        settlementAuthority = authority;
    }

    function setPricePerCheck(uint256 price) external onlyOwner {
        pricePerCheck = price;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function createJob(bytes32 contentHash, address assignedNode)
        external nonReentrant returns (bytes32 jobId)
    {
        require(balances[msg.sender] >= pricePerCheck, "Insufficient balance");
        balances[msg.sender] -= pricePerCheck;

        jobId = keccak256(abi.encodePacked(msg.sender, contentHash, block.timestamp, block.prevrandao));

        jobs[jobId] = Job({
            requester: msg.sender,
            assignedNode: assignedNode,
            amount: pricePerCheck,
            settled: false,
            createdAt: block.timestamp,
            contentHash: contentHash
        });

        emit JobCreated(jobId, msg.sender, contentHash);
    }

    // Called by settlement authority after verifying TEE signature off-chain
    function settleJob(bytes32 jobId) external onlySettlement nonReentrant {
        Job storage job = jobs[jobId];
        require(!job.settled, "Already settled");
        require(job.amount > 0, "Job not found");

        job.settled = true;

        uint256 fee = (job.amount * protocolFeePercent) / 100;
        uint256 nodeAmount = job.amount - fee;

        paymentToken.transfer(job.assignedNode, nodeAmount);
        paymentToken.transfer(owner(), fee);

        emit JobSettled(jobId, job.assignedNode, nodeAmount, fee);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        paymentToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
}
