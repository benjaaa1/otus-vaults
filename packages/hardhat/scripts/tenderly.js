const hre = require('hardhat');

const {getNamedAccounts} = hre;

const verify = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    
    // const decimalMath = await ethers.getContract("DecimalMath");
    const safeMath = await ethers.getContract("SafeMath");
    const safeDecimalMath = await ethers.getContract("SafeDecimalMath");
    const signedSafeDecimalMath = await ethers.getContract("SignedSafeDecimalMath");
    const signedSafeMath = await ethers.getContract("SignedSafeMath");
    const vault = await ethers.getContract("Vault");
    const vaultLifeCycle = await ethers.getContract("VaultLifeCycle");
    const otusVault = await ethers.getContract("OtusVault");
    const strategy = await ethers.getContract("Strategy");
    const otusCloneFactory = await ethers.getContract("OtusCloneFactory");
    const otusController = await ethers.getContract("OtusController");
    const lyraBase = await ethers.getContract("LyraBase"); 

    const contracts = [
        // {
        //   name: "DecimalMath",
        //   address: decimalMath.address
        // },
        // {
        //   name: "SafeMath",
        //   address: safeMath.address
        // },
        // {
        //   name: "SafeDecimalMath",
        //   address: safeDecimalMath.address
        // },
        // {
        //   name: "SignedSafeDecimalMath",
        //   address: signedSafeDecimalMath.address
        // },
        // {
        //   name: "SignedSafeMath",
        //   address: signedSafeMath.address
        // },
        // {
        //   name: "Vault",
        //   address: vault.address
        // },
        // {
        //   name: "VaultLifeCycle",
        //   address: vaultLifeCycle.address
        // },
        // {
        //   name: "OtusVault",
        //   address: otusVault.address
        // },
        // {
        //   name: "Strategy",
        //   address: strategy.address
        // },
        // {
        //   name: "OtusCloneFactory",
        //   address: otusCloneFactory.address
        // },
        {
          name: "OtusController",
          address: otusController.address
        },
        // {
        //   name: "LyraBase",
        //   address: lyraBase.address
        // }
    ]
  
    // await hre.tenderly.persistArtifacts(...contracts);
    await hre.tenderly.verify(...contracts);
    
    return true;
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  await verify();
  console.log("✅  Verified contracts through tenderly.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
