// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const vault = await ethers.getContract("Vault", deployer);
  const vaultLifeCycle = await ethers.getContract("VaultLifeCycle", deployer);
  
  const _futuresMarket =  ethers.constants.AddressZero; // address,
  const _roundDuration = 86400 * 7; // uint, 
  const _keeper =  ethers.constants.AddressZero; // address,

  await deploy("OtusVault", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      _futuresMarket, // address, 
      _roundDuration, // address, 
      _keeper
    ],
    log: true,
    waitConfirmations: 5,
    libraries: {
      Vault: vault.address,
      VaultLifeCycle: vaultLifeCycle.address
    }
  });

};

module.exports.tags = ["OtusVault"];
