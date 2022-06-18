// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraMarketRegistery = {
    address: "0x8Ac083da00c75d46938abCccAC5E202E6197e022"
  }

  const futuresMarketManager = {
    address: "0xA3e4c049dA5Fe1c5e046fb3dCe270297D9b2c6a9"
  }

  await deploy("OtusController", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      lyraMarketRegistery.address, // lyra market
      futuresMarketManager.address
    ],
    log: true,
  });

};
module.exports.tags = ["OtusController"];
