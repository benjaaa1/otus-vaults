// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

const localChainId = "31337";
const kovanOptimism = "69"; 
const mainnetOptimism = "10";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const vault = await ethers.getContract("Vault");
  const vaultLifeCycle = await ethers.getContract("VaultLifeCycle");
  const _roundDuration = 86400 * 7; 

  await deploy("OtusVault", {
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
