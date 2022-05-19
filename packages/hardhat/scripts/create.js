const hre = require('hardhat');

const {getNamedAccounts, ethers} = hre;

const create = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    
    const registry = await ethers.getContract("OtusCloneFactory");

    await registry.cloneSupervisor();

    const cap = ethers.utils.parseEther('5000000'); // 5m USD as cap
    const decimals = 18;

    await registry.cloneVaultWithStrategy(
      "0x4A3f1D1bdb5eD10a813f032FE906C73BAF0bc5A2",
      "0x13414675E6E4e74Ef62eAa9AC81926A3C1C7794D",
      "OTUS-sETH",
      "OTVsETH",
      true, 
      0,
      {
        decimals,
        cap, 
        asset: "0xD30a35282c2E2db07d9dAC69Bf3D45a975Bc85D1"
      }
    );

    // managersVault = await ethers.getContractAt(OtusVault__factory.abi, vaultCloneAddress) as OtusVault; 

    // await otusVault.setNextBoardStrikeId(4, 42)

    return true;
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  await create();
  console.log("✅  create.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
