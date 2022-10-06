// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");
const { getMarketDeploys, getGlobalDeploys } = require("@lyrafinance/protocol")

const localChainId = "31337";
const kovanOptimism = "69"; 
const mainnetOptimism = "10";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraGlobal = await getGlobalDeploys('local');
  const quoteAsset = lyraGlobal.QuoteAsset.address;
  const blackScholes = lyraGlobal.BlackScholes.address;
  console.log({ quoteAsset, blackScholes });
  // console.log({lyraGlobal})
  await deploy("Strategy", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      quoteAsset, // quote asset
    ],
    log: true,
    libraries: {
      BlackScholes: blackScholes
    }
  });

};
module.exports.tags = ["Strategy"];
