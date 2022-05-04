const { ethers } = require("hardhat");
const { getGlobalDeploys, getMarketDeploys } = require('@lyrafinance/core');

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraGlobal = getGlobalDeploys('kovan-ovm');

  const decimalMath = await ethers.getContract("DecimalMath");

  await deploy("GWAVOracle", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    log: true,
    libraries: {
      BlackScholes: lyraGlobal.BlackScholes.address,
      DecimalMath: decimalMath.address
    }
  });

};

module.exports.tags = ["GWAVOracle"];
