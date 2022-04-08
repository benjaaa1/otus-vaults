// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const vault = await ethers.getContract("Vault", deployer);
  const vaultLifeCycle = await ethers.getContract("VaultLifeCycle", deployer);
  // const sUSDToken = await ethers.getContract("sUSD", deployer);
  const sUSDToken = ethers.utils.getAddress("0x84B6b512E8F416981a27d33E210A1886e29791aB"); // Lyra sUSD Instance
  console.log({ address: ethers.utils.getAddress("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9") })

  // const _optionMarket = await ethers.getContractAt('IOptionMarket');
  // console.log({_optionMarket})
  // const optionMarket = _optionMarket.address; // address, 

  // const _futuresMarket = await ethers.getContractAt('IFuturesMarket');// address, 
  // console.log({_futuresMarket})
  // const futuresMarket = _futuresMarket.address;// address, 

  const _feeRecipient =  ethers.constants.AddressZero; // address,
  const _roundDuration = 1; // uint, 
  const _tokenName = "OtusPutVault"; // string, 
  const _tokenSymbol = "OVP"; // string
  const _vaultParams = {
    decimals: 18, 
    cap: 10,
    asset: sUSDToken
  };

  await deploy("OtusVault", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ 
      ethers.utils.getAddress("0xb43285B5aF7cad80409e1267Ea21ECB44eEF4a0E"), // address, 
      ethers.utils.getAddress("0x698E403AaC625345C6E5fC2D0042274350bEDf78"), // address, 
      _feeRecipient, // address,
      _roundDuration, // uint, 
      _tokenName, // string, 
      _tokenSymbol, // string
      _vaultParams,
    ],
    log: true,
    waitConfirmations: 5,
    libraries: {
      Vault: vault.address,
      VaultLifeCycle: vaultLifeCycle.address
    }
  });

  // Getting a previously deployed contract
  const OtusVault = await ethers.getContract("OtusVault", deployer);
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

module.exports.tags = ["OtusVault"];
