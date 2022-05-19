const hre = require('hardhat');

const {getNamedAccounts} = hre;

const registerMarkets = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    
    const registry = await ethers.getContract("OtusCloneFactory");

    await registry.setFuturesMarkets("0x13414675E6E4e74Ef62eAa9AC81926A3C1C7794D", "0x7345544800000000000000000000000000000000000000000000000000000000")

    await registry.setOptionMarketDetails("0x4A3f1D1bdb5eD10a813f032FE906C73BAF0bc5A2"); 

    const market = await registry.getOptionMarketDetails("0x4A3f1D1bdb5eD10a813f032FE906C73BAF0bc5A2"); 
    console.log({ market })

    // const market1 = await registry.marketAddress("0x4A3f1D1bdb5eD10a813f032FE906C73BAF0bc5A2", 0); 
    // console.log({ market1 })

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
