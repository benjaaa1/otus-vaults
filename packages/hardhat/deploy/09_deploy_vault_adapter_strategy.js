// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");
const { getGlobalDeploys, getMarketDeploys } = require('@lyrafinance/core');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraGlobal = getGlobalDeploys('kovan-ovm');

  const lyraMarket = getMarketDeploys('kovan-ovm', 'sETH');

  const gwavOracle = await ethers.getContract("GWAVOracle");

  await gwavOracle.init(
    lyraMarket.OptionMarket.address, 
    lyraMarket.OptionGreekCache.address, 
    lyraGlobal.SynthetixAdapter.address
  );

  await deploy("Strategy", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      gwavOracle.address,
      lyraGlobal.SynthetixAdapter.address,
      lyraMarket.OptionMarketPricer.address,
      lyraMarket.OptionGreekCache.address
      // lyraGlobal.BasicFeeCounter.address
    ],
    log: true,
    libraries: {
      BlackScholes: lyraGlobal.BlackScholes.address
    }
  });

};
module.exports.tags = ["Strategy"];
