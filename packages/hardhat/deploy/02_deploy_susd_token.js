const { ethers } = require("hardhat");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("sUSD", {
    from: deployer,
    args: [ 
      ethers.BigNumber.from(1000)
    ],
    log: true,
  });

};

module.exports.tags = ["sUSD"];
