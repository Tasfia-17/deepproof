const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "0G");

  // 1. Deploy mock 0G token for testnet (on mainnet use real 0G token address)
  let tokenAddress = process.env.ZG_TOKEN_ADDRESS;
  if (!tokenAddress) {
    const MockToken = await ethers.getContractFactory("MockERC20");
    const token = await MockToken.deploy("0G Token", "0G", ethers.parseEther("1000000"));
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
    console.log("MockToken deployed:", tokenAddress);
  }

  // 2. ProvenanceRegistry
  const Registry = await ethers.getContractFactory("ProvenanceRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("ProvenanceRegistry:", registryAddr);

  // 3. SoulboundProvenanceToken
  const SPT = await ethers.getContractFactory("SoulboundProvenanceToken");
  const spt = await SPT.deploy();
  await spt.waitForDeployment();
  const sptAddr = await spt.getAddress();
  console.log("SoulboundProvenanceToken:", sptAddr);

  // 4. NodeStaking
  const Staking = await ethers.getContractFactory("NodeStaking");
  const staking = await Staking.deploy(tokenAddress);
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log("NodeStaking:", stakingAddr);

  // 5. PaymentRouter
  const Payment = await ethers.getContractFactory("PaymentRouter");
  const payment = await Payment.deploy(tokenAddress);
  await payment.waitForDeployment();
  const paymentAddr = await payment.getAddress();
  console.log("PaymentRouter:", paymentAddr);

  // 6. DerivativeLineage
  const Lineage = await ethers.getContractFactory("DerivativeLineage");
  const lineage = await Lineage.deploy();
  await lineage.waitForDeployment();
  const lineageAddr = await lineage.getAddress();
  console.log("DerivativeLineage:", lineageAddr);

  // Wire up: set minter on SPT, set registrar on Registry
  await spt.setMinter(registryAddr);
  await registry.setRegistrar(deployer.address, true);
  await lineage.setRegistrar(deployer.address, true);
  console.log("Permissions configured.");

  // Save addresses
  const addresses = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    token: tokenAddress,
    provenanceRegistry: registryAddr,
    soulboundToken: sptAddr,
    nodeStaking: stakingAddr,
    paymentRouter: paymentAddr,
    derivativeLineage: lineageAddr,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\nDeployment saved to deployments.json");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
