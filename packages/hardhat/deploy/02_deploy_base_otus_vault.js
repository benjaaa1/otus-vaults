// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const vault = await ethers.getContract("Vault", deployer);
  const vaultLifeCycle = await ethers.getContract("VaultLifeCycle", deployer);
  const baseVault = await ethers.getContract("BaseVault", deployer);

  await deploy("ArtemisVault", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      _keeper, // address,
      _optionMarket, // address, 
      _futuresMarket, // address, 
      _susd, // address,
      _feeRecipient, // address,
      _synthetix, // address, 
      _roundDuration, // uint, 
      _tokenName, // string, 
      _tokenSymbol, // string
      { decimals: 6, cap: 1, asset: sUSD } // _vaultParams
    ],
    log: true,
    waitConfirmations: 5,
    libraries: {
      Vault: vault.address,
      VaultLifeCycle: vaultLifeCycle.address
    }
  });

  // Getting a previously deployed contract
  const YourContract = await ethers.getContract("YourContract", deployer);
  /*  await YourContract.setPurpose("Hello");
  
    To take ownership of yourContract using the ownable library uncomment next line and add the 
    address you want to be the owner. 
    // await yourContract.transferOwnership(YOUR_ADDRESS_HERE);

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

};

module.exports.tags = ["ArtemisVault"];
