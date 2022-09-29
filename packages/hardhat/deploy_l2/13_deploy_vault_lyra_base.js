// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");
const { getMarketDeploys, getGlobalDeploys } = require("@lyrafinance/protocol")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraMarket = getMarketDeploys('kovan-ovm', 'sETH');
  const lyraGlobal = await getGlobalDeploys('kovan-ovm');
  console.log({marketKey: "0x7345544800000000000000000000000000000000000000000000000000000000" });

  console.log({    
    SynthetixAdapter: lyraGlobal.S.SynthetixAdapter.address,
    OptionToken: lyraMarket.OptionToken.address,
    OptionMarket: lyraMarket.OptionMarket.address,
    LiquidityPool:  lyraMarket.LiquidityPool.address,
    ShortCollateral: lyraMarket.ShortCollateral.address,
    OptionMarketPricer: lyraMarket.OptionMarketPricer.address,
    OptionGreekCache: lyraMarket.OptionGreekCache.address,
    GWAVOracle: lyraMarket.GWAVOracle.address,
    BlackScholes: lyraGlobal.BlackScholes.address
  })
  await deploy("LyraBase", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      "0x7345544800000000000000000000000000000000000000000000000000000000",
      "0xa64a15E39e717663bB6885a536FA9741DEe08daC", // synthetix adapter
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
