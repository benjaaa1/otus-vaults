const { targets } = require("@lyrafinance/protocol/dist/deployments/goerli-ovm/synthetix.json");
const { getMarketDeploys } = require("@lyrafinance/protocol");

const markets = require("../constants/synthetix/markets.json");
const futuresMarkets = require("../constants/synthetix/markets.json");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer: keeper } = await getNamedAccounts();

  const lyraBaseETH = await ethers.getContract("LyraBase");
  const lyraMarket = await getMarketDeploys('goerli-ovm', 'sETH');
  // can get contract addresses manually for arbi mainnet

  await deploy("OtusController", {
    from: deployer,
    args: [ 
      keeper,
      [markets.ETH],
      [lyraBaseETH.address],
      [lyraMarket.OptionMarket.address],
      [futuresMarkets.address]
    ],
    log: true,
  });

};
module.exports.tags = ["OtusController"];