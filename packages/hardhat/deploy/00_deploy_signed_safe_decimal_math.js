const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("SignedSafeDecimalMath", {
    from: deployer,
  });

};

module.exports.tags = ["SignedSafeDecimalMath"];
