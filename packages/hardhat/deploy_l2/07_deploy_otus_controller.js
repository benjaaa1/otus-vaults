// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraMarketRegistry = { // optionmarketviewer
    address: "0xa5c383cd6C82FDe0fc9A1FEbD2e9c9B2D98F507D"
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
