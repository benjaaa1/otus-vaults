const hre = require('hardhat');

const {getNamedAccounts} = hre;

const registerMarkets = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    console.log({deployer}); 
    
    const registry = await ethers.getContract("OtusCloneFactory");

    await registry.setFuturesMarkets("0x1d9aa51453a29613112e970d74f4831a7d08e691", "0x7345544800000000000000000000000000000000000000000000000000000000")

    return true;
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  await registerMarkets();
  console.log("✅  Set option and futures market in otus registry.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
