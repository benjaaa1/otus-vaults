// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const sUsd = await ethers.getContract("sUSD", deployer);

  await deploy("Supervisor", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      sUsd.address, 
      sUsd.address, 
    ],
    log: true,
    waitConfirmations: 5
  });

};
module.exports.tags = ["Supervisor"];
