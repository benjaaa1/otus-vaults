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
    const futures = await outsController.setFuturesMarkets("0xD7C80fC4A5B05B5bE7B5b762e32127B54Fea385A", "0x7345544800000000000000000000000000000000000000000000000000000000")
    const futuresReceipt = futures.wait(); 

    const futures1 = await outsController.getFuturesMarket("0x7345544800000000000000000000000000000000000000000000000000000000")
    console.log({ futures1 })

    // get optionmarkets 

    
    const optionMarkets = await outsController.setOptionMarketDetails("0xDc06D81A68948544A6B453Df55CcD172061c6d6e"); 
    const optionMarketsReceipt = optionMarkets.wait(); 

    const market = await outsController.getOptionMarketDetails("0xDc06D81A68948544A6B453Df55CcD172061c6d6e"); 
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
