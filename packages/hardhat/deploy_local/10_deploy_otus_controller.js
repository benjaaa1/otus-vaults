// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const futuresMarketManager = await ethers.getContract("MockFuturesMarketManager");

  await deploy("OtusController", {
    from: deployer,
    args: [ 
      futuresMarketManager.address,
      deployer // keeper 
    ],
    log: true,
  });

};
module.exports.tags = ["OtusController"];
