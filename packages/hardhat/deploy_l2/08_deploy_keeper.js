module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const otusController = await ethers.getContract("OtusController");

  await deploy("Keeper", {
    from: deployer,
    args: [ 
      otusController.address // address,
    ],
    log: true,
  });

};

module.exports.tags = ["Keeper"];
