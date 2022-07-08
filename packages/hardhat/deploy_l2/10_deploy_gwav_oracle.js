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
      BlackScholes: '0xEAB60138D1C2160062bbcD881D153961865aA510'// lyraGlobal.BlackScholes.address
    }
  });

};

module.exports.tags = ["GWAVOracle"];
