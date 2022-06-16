// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("L2DepositMover", {
    from: deployer,
    log: true,
  });

};
module.exports.tags = ["L2DepositMover"];
