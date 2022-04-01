// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const _futuresMarket = 0x698e403aac625345c6e5fc2d0042274350bedf78; 
  const _optionMarket = 0xb43285b5af7cad80409e1267ea21ecb44eef4a0e;

  const safeDecimalMath = await ethers.getContract("SafeDecimalMath", deployer);
  const signedSafeDecimalMath = await ethers.getContract("SignedSafeDecimalMath", deployer);

  await deploy("Strategy", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ _vault, _optionMarket, _futuresMarket],
    log: true,
    waitConfirmations: 5,
    libraries: {
      SafeDecimalMath: safeDecimalMath.address,
      SignedSafeDecimalMath: signedSafeDecimalMath.address
    }
  });

  const Strategy = await ethers.getContract("Strategy", deployer);
  await Strategy.setStrategy({
    strategyName: 'string', // should be token name that represents vault - share + uinique id
    minTimeToExpiry: 'uint', // should be after current vault by 12 hours
    maxTimeToExpiry: 'uint', // after current vault by 7 days
    targetDelta: 'int', // depending on risk tolerance ~ .3
    maxDeltaGap: 'int', // .1
    minIv: 'uint', // if iv 80% rule of thumb 80/20 = 4% average move per day up or down
    maxIv: 'uint', // if iv 100% rule of thumb 80/20 = 5% average move per day up or down
    size: 'uint', //
    minInterval: 'uint', // 1 week 
    requiredLeveragedHedge: 'uint', // 
    maxHedgeAttempts: 'int', // 5 attempts throughout the week to short or long with stop losses
    hedgeStopLossLimit: 'uint', // can be -1% or -.001% 
    currentListingId: 'uint256', // hardcoded for now but should be calculated based on above criteria
    tradeType: 'SHORT_PUT', // can allow short put and short call
  });
  /*
    To take ownership of yourContract using the ownable library uncomment next line and add the 
    address you want to be the owner. 
    // await yourContract.transferOwnership(YOUR_ADDRESS_HERE);

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

  // const deployerWallet = ethers.provider.getSigner()
  // await deployerWallet.sendTransaction({
  //   to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  //   value: ethers.utils.parseEther("1")
  // })

};
module.exports.tags = ["Strategy"];
