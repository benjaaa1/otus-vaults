const hre = require('hardhat');

const {getNamedAccounts} = hre;

const tenderly = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    
    const decimalMath = await ethers.getContract("DecimalMath");
    const safeMath = await ethers.getContract("SafeMath");
    const safeDecimalMath = await ethers.getContract("SafeDecimalMath");
    const signedSafeDecimalMath = await ethers.getContract("SignedSafeDecimalMath");
    const signedSafeMath = await ethers.getContract("SignedSafeMath");
    const vault = await ethers.getContract("Vault");
    const vaultLifeCycle = await ethers.getContract("VaultLifeCycle");
    const otusVault = await ethers.getContract("OtusVault");
    const gWAVOracle = await ethers.getContract("GWAVOracle");
    const strategy = await ethers.getContract("Strategy");
    const supervisor = await ethers.getContract("Supervisor");
    const l2DepositMover = await ethers.getContract("L2DepositMover");
    const otusCloneFactory = await ethers.getContract("OtusCloneFactory");

    const contracts = [
        {
          name: "DecimalMath",
          address: decimalMath.address
        },
        {
          name: "SafeMath",
          address: safeMath.address
        },
        {
          name: "SafeDecimalMath",
          address: safeDecimalMath.address
        },
        {
          name: "SignedSafeDecimalMath",
          address: signedSafeDecimalMath.address
        },
        {
          name: "SignedSafeMath",
          address: signedSafeMath.address
        },
        {
          name: "Vault",
          address: vault.address
        },
        {
          name: "VaultLifeCycle",
          address: vaultLifeCycle.address
        },
        {
          name: "OtusVault",
          address: otusVault.address
        },
        {
          name: "GWAVOracle",
          address: gWAVOracle.address
        },
        {
          name: "Strategy",
          address: strategy.address
        },
        {
        name: "Supervisor",
        address: supervisor.address
        },
        {
        name: "L2DepositMover",
        address: l2DepositMover.address
        },
        {
        name: "OtusCloneFactory",
        address: otusCloneFactory.address
        },
    ]
  
    // await hre.tenderly.persistArtifacts(...contracts);
    await hre.tenderly.verify(...contracts);
    
    return true;
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  await tenderly();
  console.log("✅  Verified contracts through tenderly.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
