// deploy/00_deploy_your_contract.js
const { getGlobalDeploys } = require("@lyrafinance/protocol")

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraGlobal = await  getGlobalDeploys('goerli-ovm');
  const quoteAsset = lyraGlobal.QuoteAsset.address;
  const blackScholes = lyraGlobal.BlackScholes.address;

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
