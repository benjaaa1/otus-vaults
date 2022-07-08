// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // const lyraGlobal = await getGlobalDeploys('kovan-ovm');

  await deploy("Strategy", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      '0x0948BFe6fE3fe90b1211a6549822279e5EcC9b5f' //lyraGlobal.SynthetixAdapter.address
    ],
    log: true,
    libraries: {
      BlackScholes: '0x0f617bffd8ED167BA27a16B5aeC99E286C067db9' // lyraGlobal.BlackScholes.address
    }
  });

};
module.exports.tags = ["Strategy"];
