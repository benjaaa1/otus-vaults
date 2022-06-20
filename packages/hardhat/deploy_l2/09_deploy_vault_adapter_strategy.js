// deploy/00_deploy_your_contract.js
const { ethers } = require("hardhat");
const { getGlobalDeploys, getMarketDeploys } = require('@lyrafinance/protocol');

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
      BlackScholes: '0x60B99483Cf4DbE25Bad03f329446435c0Ffe1a21' // lyraGlobal.BlackScholes.address
    }
  });

};
module.exports.tags = ["Strategy"];
