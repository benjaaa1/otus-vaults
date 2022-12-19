const { getGlobalDeploys, getMarketDeploys } = require("@lyrafinance/protocol");
const { ethers } = require("hardhat");
const markets = require("../constants/synthetix/markets.json");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraGlobal = await getGlobalDeploys('local');

  const quoteAsset = lyraGlobal.QuoteAsset.address;
  const blackScholes = lyraGlobal.BlackScholes.address;

  const otusController = await ethers.getContract("OtusController");

  await deploy("Strategy", {
    from: deployer,
    args: [ 
      quoteAsset,
      otusController.address
    ],
    log: true,
    libraries: {
      BlackScholes: blackScholes
    }
  });

};
module.exports.tags = ["Strategy"];
