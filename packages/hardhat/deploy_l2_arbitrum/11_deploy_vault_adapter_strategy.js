const { getGlobalDeploys } = require("@lyrafinance/protocol")
const markets = require("../constants/synthetix/markets.json");
const futuresMarkets = require("../constants/synthetix/markets.json");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraGlobal = await  getGlobalDeploys('goerli-ovm');
  const lyraMarket = await getMarketDeploys('goerli-ovm');

  const quoteAsset = lyraGlobal.QuoteAsset.address;
  const blackScholes = lyraGlobal.BlackScholes.address;
  
  const lyraBaseETH = await ethers.getContract("LyraBase");

  await deploy("Strategy", {
    from: deployer,
    args: [ 
      quoteAsset,
      [markets.ETH], // bytes32 of string name
      [lyraBaseETH.address], // deploy with lyra base address (eth btc)
      [lyraMarket.OptionMarket.address], // deploy with option markets 
      [futuresMarkets.ETH] // deploy with futures markets 
    ],
    log: true,
    libraries: {
      BlackScholes: blackScholes
    }
  });

};
module.exports.tags = ["Strategy"];
