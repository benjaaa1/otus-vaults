const localChainId = "31337";
const kovanOptimism = "69"; 
const mainnetOptimism = "10";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // const lyraGlobal = await getGlobalDeploys('kovan-ovm');
  // console.log({ lyraGlobal })
  await deploy("GWAVOracle", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    log: true,
    libraries: {
      BlackScholes: '0xaB3390FBA66C75d125be94BBcc5b63088585146F'// lyraGlobal.BlackScholes.address
    }
  });

};

module.exports.tags = ["GWAVOracle"];
