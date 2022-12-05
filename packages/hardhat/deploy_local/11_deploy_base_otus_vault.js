const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
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
