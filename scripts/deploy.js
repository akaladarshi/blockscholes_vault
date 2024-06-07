const { ethers } = require("hardhat");
require("dotenv").config();

const weth_address = process.env.WETH_ADDRESS;

async function main() {
  const [acc] = await ethers.getSigners();

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.connect(acc).deploy(weth_address);

  await vault.waitForDeployment();

  console.log(`Vault deployed to: ${vault.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});