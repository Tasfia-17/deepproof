// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title NodeStaking
 * @notice Detection nodes stake 0G tokens to join the network.
 *         Nodes are slashed if their verdicts consistently deviate from consensus.
 *         Honest nodes earn fees from the PaymentRouter.
 */
contract NodeStaking is Ownable, ReentrancyGuard {
    IERC20 public stakingToken; // 0G token

    uint256 public constant MIN_STAKE = 1000 ether; // 1000 0G tokens
    uint256 public constant SLASH_PERCENT = 10;     // 10% slash per violation
    uint256 public constant UNBONDING_PERIOD = 7 days;

    struct NodeInfo {
        uint256 stakedAmount;
        uint256 slashCount;
        uint256 totalVerifications;
        uint256 unbondingAmount;
        uint256 unbondingUnlockTime;
        bool active;
        string endpoint; // HTTPS endpoint for job routing
    }

    mapping(address => NodeInfo) public nodes;
    address[] public activeNodes;

    address public slashAuthority; // ProvenanceRegistry or governance

    event NodeRegistered(address indexed node, uint256 amount, string endpoint);
    event NodeSlashed(address indexed node, uint256 slashAmount, string reason);
    event NodeUnbonding(address indexed node, uint256 amount, uint256 unlockTime);
    event NodeWithdrew(address indexed node, uint256 amount);
    event VerificationCredited(address indexed node, uint256 total);

    modifier onlySlashAuthority() {
        require(msg.sender == slashAuthority || msg.sender == owner(), "Not slash authority");
        _;
    }

    constructor(address _stakingToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        slashAuthority = msg.sender;
    }

    function setSlashAuthority(address authority) external onlyOwner {
        slashAuthority = authority;
    }

    function register(uint256 amount, string calldata endpoint) external nonReentrant {
        require(amount >= MIN_STAKE, "Below minimum stake");
        require(!nodes[msg.sender].active, "Already registered");
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        nodes[msg.sender] = NodeInfo({
            stakedAmount: amount,
            slashCount: 0,
            totalVerifications: 0,
            unbondingAmount: 0,
            unbondingUnlockTime: 0,
            active: true,
            endpoint: endpoint
        });
        activeNodes.push(msg.sender);

        emit NodeRegistered(msg.sender, amount, endpoint);
    }

    function slash(address node, string calldata reason) external onlySlashAuthority nonReentrant {
        NodeInfo storage info = nodes[node];
        require(info.active, "Node not active");

        uint256 slashAmount = (info.stakedAmount * SLASH_PERCENT) / 100;
        info.stakedAmount -= slashAmount;
        info.slashCount++;

        // Deactivate if stake falls below minimum
        if (info.stakedAmount < MIN_STAKE) {
            info.active = false;
            _removeFromActive(node);
        }

        // Slashed tokens go to treasury (owner)
        stakingToken.transfer(owner(), slashAmount);

        emit NodeSlashed(node, slashAmount, reason);
    }

    function creditVerification(address node) external onlySlashAuthority {
        nodes[node].totalVerifications++;
        emit VerificationCredited(node, nodes[node].totalVerifications);
    }

    function initiateUnbonding() external nonReentrant {
        NodeInfo storage info = nodes[msg.sender];
        require(info.active, "Not active");
        require(info.stakedAmount > 0, "Nothing to unbond");

        info.unbondingAmount = info.stakedAmount;
        info.unbondingUnlockTime = block.timestamp + UNBONDING_PERIOD;
        info.stakedAmount = 0;
        info.active = false;
        _removeFromActive(msg.sender);

        emit NodeUnbonding(msg.sender, info.unbondingAmount, info.unbondingUnlockTime);
    }

    function withdraw() external nonReentrant {
        NodeInfo storage info = nodes[msg.sender];
        require(info.unbondingAmount > 0, "Nothing to withdraw");
        require(block.timestamp >= info.unbondingUnlockTime, "Still unbonding");

        uint256 amount = info.unbondingAmount;
        info.unbondingAmount = 0;
        stakingToken.transfer(msg.sender, amount);

        emit NodeWithdrew(msg.sender, amount);
    }

    function getActiveNodes() external view returns (address[] memory) {
        return activeNodes;
    }

    function getNodeInfo(address node) external view returns (NodeInfo memory) {
        return nodes[node];
    }

    function _removeFromActive(address node) internal {
        for (uint i = 0; i < activeNodes.length; i++) {
            if (activeNodes[i] == node) {
                activeNodes[i] = activeNodes[activeNodes.length - 1];
                activeNodes.pop();
                break;
            }
        }
    }
}
