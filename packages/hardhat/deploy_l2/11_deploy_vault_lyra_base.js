const { getMarketDeploys, getGlobalDeploys } = require("@lyrafinance/protocol")
const markets = require("../constants/synthetix/markets.json");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraMarket = getMarketDeploys('goerli-ovm', 'sETH');
  const lyraGlobal = await getGlobalDeploys('goerli-ovm');

  await deploy("LyraBase", {
    from: deployer,
    args: [ 
      markets.ETH,
      lyraGlobal.SynthetixAdapter.address,
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
