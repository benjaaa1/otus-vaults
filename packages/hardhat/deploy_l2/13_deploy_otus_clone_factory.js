// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const otusVault = await ethers.getContract("OtusVault");
  const strategy = await ethers.getContract("Strategy");
  const supervisor = await ethers.getContract("Supervisor");
  const l2DepositMover = await ethers.getContract("L2DepositMover");

  const lyraMarketRegistery = {
    address: "0xaff8ee51bbe42a1b2666aba062c428c570e0b1fd"
  }

  const futuresMarketManager = {
    address: "0xA3e4c049dA5Fe1c5e046fb3dCe270297D9b2c6a9"
  }

  await deploy("OtusCloneFactory", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      supervisor.address, 
      otusVault.address, 
      strategy.address, 
      l2DepositMover.address,
      lyraMarketRegistery.address, // lyra market
      futuresMarketManager.address
    ],
    log: true,
  });

};
module.exports.tags = ["OtusCloneFactory"];
