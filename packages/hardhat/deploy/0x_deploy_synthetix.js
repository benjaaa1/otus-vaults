const { ethers } = require("hardhat");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("SafeDecimalMath", {
    from: deployer,
  });

  await deploy("SignedSafeDecimalMath", {
    from: deployer,
  });

};

module.exports.tags = ["SynthetixLibraries"];
