const { ethers } = require("hardhat");
const { getGlobalDeploys, getMarketDeploys } = require('@lyrafinance/protocol');

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraGlobal = await getGlobalDeploys('kovan-ovm');

  await deploy("GWAVOracle", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    log: true,
    libraries: {
      BlackScholes: lyraGlobal.BlackScholes.address
    }
  });

};

module.exports.tags = ["GWAVOracle"];
