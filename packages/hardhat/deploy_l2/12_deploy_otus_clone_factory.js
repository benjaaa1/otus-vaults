// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

const localChainId = "31337";
const kovanOptimism = "69"; 
const mainnetOptimism = "10";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const otusVault = await ethers.getContract("OtusVault");
  const strategy = await ethers.getContract("Strategy");
  const otusController = await ethers.getContract("OtusController");

  await deploy("OtusCloneFactory", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      otusVault.address, 
      strategy.address, 
      otusController.address
    ],
    log: true,
  });

};
module.exports.tags = ["OtusCloneFactory"];
