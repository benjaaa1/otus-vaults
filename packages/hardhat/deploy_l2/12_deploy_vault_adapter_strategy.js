// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // const lyraGlobal = await  getGlobalDeploys('kovan-ovm');
  // console.log({lyraGlobal})
  await deploy("Strategy", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      '0x2400D0469bfdA59FB0233c3027349D83F1a0f4c8', // quote asset
      // '0xD7C80fC4A5B05B5bE7B5b762e32127B54Fea385A' // snx fu;tures
    ],
    log: true,
    libraries: {
      BlackScholes: '0xaB3390FBA66C75d125be94BBcc5b63088585146F' // lyraGlobal.BlackScholes.address
    }
  });

};
module.exports.tags = ["Strategy"];
