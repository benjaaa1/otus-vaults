// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const otusVault = await ethers.getContract("OtusVault", deployer);
  const strategy = await ethers.getContract("Strategy", deployer);
  const supervisor = await ethers.getContract("Supervisor", deployer);

  await deploy("OtusCloneFactory", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      otusVault.address, 
      strategy.address, 
      supervisor.address, 
    ],
    log: true,
    waitConfirmations: 5
  });

};
module.exports.tags = ["OtusCloneFactory"];
