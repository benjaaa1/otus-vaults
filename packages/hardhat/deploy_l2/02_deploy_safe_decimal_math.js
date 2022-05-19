module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("SafeDecimalMath", {
    from: deployer,
    log: true,
  });

};

module.exports.tags = ["SafeDecimalMath"];
