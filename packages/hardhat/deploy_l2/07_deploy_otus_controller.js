// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraMarketRegistry = { // optionmarketviewer
    address: "0x91a1AB0DDa247CE6D8666c5A49c183f8978a9797"
  }

  const futuresMarketManager = {
    address: "0xA3e4c049dA5Fe1c5e046fb3dCe270297D9b2c6a9"
  }

  await deploy("OtusController", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      lyraMarketRegistry.address, // lyra market
      futuresMarketManager.address
    ],
    log: true,
  });

};
module.exports.tags = ["OtusController"];
