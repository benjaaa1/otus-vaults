// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const futuresMarketManager = {
    address: "0x95d6B120862986Fb605B0ccD1f0E8a71f5f4fB2c" // optimism mainnet 0xc704c9AA89d1ca60F67B3075d05fBb92b3B00B3B
  }
  // 0x95d6B120862986Fb605B0ccD1f0E8a71f5f4fB2c goerlie
  await deploy("OtusController", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      futuresMarketManager.address,
      deployer // keeper 
    ],
    log: true,
  });

};
module.exports.tags = ["OtusController"];
