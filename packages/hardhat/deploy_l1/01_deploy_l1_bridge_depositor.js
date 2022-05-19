// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const hopAmm = "0xf89E134Ce2e83B535D3Cfa63a902375f993Fc0D2";
  const l1CrossDomainMessenger =  "0x4361d0F75A0186C05f971c566dC6bEa5957483fD";
  const l2DepositMover = await hre.companionNetworks['l2'].deployments.get('L2DepositMover');

  await deploy("L1Bridge", {
    from: deployer,
    args: [ 
      hopAmm, 
      l1CrossDomainMessenger, 
      l2DepositMover.address,
    ],
    log: true,
  });
};

module.exports.tags = ["L1Bridge"];
