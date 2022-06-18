const hre = require('hardhat');

const {getNamedAccounts} = hre;

const registerMarkets = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    
    const otusCloneFactory = await ethers.getContract("OtusCloneFactory");

    const outsController = await ethers.getContract("OtusController");

    const txSetFactory = await outsController.setOtusCloneFactory(otusCloneFactory.address); 
    const txSetFactoryReceipt = txSetFactory.wait(); 

    const futures = await outsController.setFuturesMarkets("0xae3e748cF9b12720192912EE6c67e42E80b6ba4F", "0x7345544800000000000000000000000000000000000000000000000000000000")
    const futuresReceipt = futures.wait(); 

    const optionMarkets = await outsController.setOptionMarketDetails("0x01DFc64625e121035235a83A0979a6A1831aA93b"); 
    const optionMarketsReceipt = optionMarkets.wait(); 

    const market = await outsController.getOptionMarketDetails("0x01DFc64625e121035235a83A0979a6A1831aA93b"); 
    console.log({ market })

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
