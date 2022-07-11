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
      '0xa64a15E39e717663bB6885a536FA9741DEe08daC' //lyraGlobal.SynthetixAdapter.address
    ],
    log: true,
    libraries: {
      BlackScholes: '0xaB3390FBA66C75d125be94BBcc5b63088585146F' // lyraGlobal.BlackScholes.address
    }
  });

};
module.exports.tags = ["Strategy"];
