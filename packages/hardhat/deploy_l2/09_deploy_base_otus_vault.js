// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const vault = await ethers.getContract("Vault");
  const vaultLifeCycle = await ethers.getContract("VaultLifeCycle");
  const _roundDuration = 86400 * 7; // uint, 
  // const _keeper = "0x2A48Cea7dEF88436ba90d81eE6f55D416804bD54"; // address,

  await deploy("OtusVault", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      _roundDuration
    ],
    log: true,
    libraries: {
      Vault: vault.address,
      VaultLifeCycle: vaultLifeCycle.address
    }
  });

};

module.exports.tags = ["OtusVault"];
