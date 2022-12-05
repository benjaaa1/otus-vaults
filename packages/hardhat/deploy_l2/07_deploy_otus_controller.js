const { targets } = require("@lyrafinance/protocol/dist/deployments/goerli-ovm/synthetix.json");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer: keeper } = await getNamedAccounts();

  await deploy("OtusController", {
    from: deployer,
    args: [ 
      targets.FuturesMarketManager.address,
      keeper 
    ],
    log: true,
  });

};
module.exports.tags = ["OtusController"];
