const { ethers } = require("hardhat");
const markets = require("../constants/synthetix/markets.json");
const { getMarketDeploys } = require("@lyrafinance/protocol");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const futuresMarketManager = await ethers.getContract("MockFuturesMarketManager"); 
  const futuresMarketETH = await ethers.getContract("MockFuturesMarket"); 
  
  const lyraBaseETH = await ethers.getContract("LyraBase");
  const lyraMarket = await getMarketDeploys('local', 'sETH');
  console.log({ futuresMarketETH })
  await deploy("OtusController", {
    from: deployer,
    args: [ 
      deployer,
      [markets.ETH],
      [lyraBaseETH.address],
      [lyraMarket.OptionMarket.address],
      [futuresMarketETH.address]
    ],
    log: true,
  });

};
module.exports.tags = ["OtusController"];
