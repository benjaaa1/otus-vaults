const { getGlobalDeploys } = require("@lyrafinance/protocol")

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const lyraGlobal = await  getGlobalDeploys('goerli-ovm');
  const quoteAsset = lyraGlobal.QuoteAsset.address;
  const blackScholes = lyraGlobal.BlackScholes.address;

  await deploy("Strategy", {
    from: deployer,
    args: [ 
      quoteAsset,
    ],
    log: true,
    libraries: {
      BlackScholes: blackScholes
    }
  });

};
module.exports.tags = ["Strategy"];
