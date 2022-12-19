const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const otusVault = await ethers.getContract("OtusVault");
  const strategy = await ethers.getContract("Strategy");
  const otusController = await ethers.getContract("OtusController");

  await deploy("OtusCloneFactory", {
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
