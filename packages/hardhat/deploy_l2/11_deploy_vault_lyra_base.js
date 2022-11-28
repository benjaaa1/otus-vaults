// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");
const { getMarketDeploys, getGlobalDeploys } = require("@lyrafinance/protocol")

const localChainId = "31337";
const kovanOptimism = "69"; 
const mainnetOptimism = "10";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraMarket = getMarketDeploys('goerli-ovm', 'sETH');
  const lyraGlobal = await getGlobalDeploys('goerli-ovm');

  await deploy("LyraBase", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      "0x7345544800000000000000000000000000000000000000000000000000000000",
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
      BlackScholes: '0xaB3390FBA66C75d125be94BBcc5b63088585146F'
    }
  });

};
module.exports.tags = ["LyraBase"];
