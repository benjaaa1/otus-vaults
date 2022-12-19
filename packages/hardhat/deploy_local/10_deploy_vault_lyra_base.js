const { getMarketDeploys, getGlobalDeploys } = require("@lyrafinance/protocol")
const markets = require("../constants/synthetix/markets.json");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraMarket = getMarketDeploys('local', 'sETH');
  const lyraGlobal = await getGlobalDeploys('local');

  await deploy("LyraBase", {
    from: deployer,
    args: [ 
      markets.ETH,
      lyraGlobal.SynthetixAdapter.address, // synthetix adapter
      lyraMarket.OptionToken.address,
      lyraMarket.OptionMarket.address,
      lyraMarket.LiquidityPool.address,
      lyraMarket.ShortCollateral.address,
      lyraMarket.OptionMarketPricer.address,
      lyraMarket.OptionGreekCache.address,
      lyraMarket.GWAVOracle.address
    ],
    log: true,
    libraries: {
      BlackScholes: lyraGlobal.BlackScholes.address
    }
  });

};
module.exports.tags = ["LyraBase"];
