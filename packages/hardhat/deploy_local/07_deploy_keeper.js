module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Keeper", {
    from: deployer,
    log: true,
  });

};

module.exports.tags = ["Keeper"];
