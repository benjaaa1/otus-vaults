// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraGlobal = getGlobalDeploys('local');
  const lyraMarket = getMarketDeploys('local', 'sETH');
  await deploy("Strategy", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      lyraGlobal.GWAVOracle.address,
      lyraMarket.optionToken.address,
      lyraGlobal.optionMarket.address,
      lyraMarket.liquidityPool.address,
      lyraMarket.shortCollateral.address,
      lyraGlobal.synthetixAdapter.address,
      lyraGlobal.optionMarketPricer.address,
      lyraGlobal.optionGreekCache.address,
      lyraGlobal.basicFeeCounter.address
    ],
    log: true,
    waitConfirmations: 5,
  });

};
module.exports.tags = ["Strategy"];
