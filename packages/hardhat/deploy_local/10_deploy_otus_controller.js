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
  const lyraMarketRegistry = lyraGlobal.LyraRegistry.address;

  const futuresMarketManager = await ethers.getContract("MockFuturesMarketManager");

  await deploy("OtusController", {
    from: deployer,
    args: [ 
      lyraMarketRegistry, // lyra market
      futuresMarketManager.address,
      deployer // keeper 
    ],
    log: true,
  });

};
module.exports.tags = ["OtusController"];
