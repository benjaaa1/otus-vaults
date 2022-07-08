const hre = require('hardhat');

const {getNamedAccounts} = hre;

const registerMarkets = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    
    const otusCloneFactory = await ethers.getContract("OtusCloneFactory");

    const outsController = await ethers.getContract("OtusController");

    const txSetFactory = await outsController.setOtusCloneFactory(otusCloneFactory.address); 
    const txSetFactoryReceipt = txSetFactory.wait(); 


    // need to update base asset 
    const futures = await outsController.setFuturesMarkets("0x531CEf2f7fd6F76aa66e5D8aa03b81AdeCdeaC72", "0x7345544800000000000000000000000000000000000000000000000000000000")
    const futuresReceipt = futures.wait(); 

    const futures1 = await outsController.getFuturesMarket("0x7345544800000000000000000000000000000000000000000000000000000000")
    console.log({ futures1 })

    // get optionmarkets 

    
    const optionMarkets = await outsController.setOptionMarketDetails("0xCdbF610D42873ed09C1ac085D7e64023FeE6692E"); 
    const optionMarketsReceipt = optionMarkets.wait(); 

    const market = await outsController.getOptionMarketDetails("0xCdbF610D42873ed09C1ac085D7e64023FeE6692E"); 
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
