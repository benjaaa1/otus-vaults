// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const otusVault = await ethers.getContract("OtusVault");
  const strategy = await ethers.getContract("Strategy");
  const l2DepositMover = await ethers.getContract("L2DepositMover");
  const otusController = await ethers.getContract("OtusController");

  await deploy("OtusCloneFactory", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      otusVault.address, 
      strategy.address, 
      l2DepositMover.address,
      otusController.address
    ],
    log: true,
  });

};
module.exports.tags = ["OtusCloneFactory"];
