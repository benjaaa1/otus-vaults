const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const futuresMarketManager = await ethers.getContract("MockFuturesMarketManager");

  await deploy("OtusController", {
    from: deployer,
    args: [ 
      futuresMarketManager.address,
      deployer
    ],
    log: true,
  });

};
module.exports.tags = ["OtusController"];
