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
    const futures = await outsController.setFuturesMarkets("0x0D10c032ad006C98C33A95e59ab3BA2b0849bD59", "0x7345544800000000000000000000000000000000000000000000000000000000")
    const futuresReceipt = futures.wait(); 

    const futures1 = await outsController.getFuturesMarket("0x7345544800000000000000000000000000000000000000000000000000000000")
    console.log({ futures1 })

    // get optionmarkets 
    const optionMarkets = await outsController.setOptionMarketDetails("0xDc06D81A68948544A6B453Df55CcD172061c6d6e"); 
    const optionMarketsReceipt = optionMarkets.wait(); 

    //set lyra base 
    const lyraBaseETH = await outsController.setLyraAdapter("0xF5272B18eee0C04E054AC9ad64023CdD60ffe063", "0xDc06D81A68948544A6B453Df55CcD172061c6d6e", "0x7345544800000000000000000000000000000000000000000000000000000000");
    const lyraBaseETHReceipt = lyraBaseETH.wait(); 

    const lyraBaseETH1 = await outsController.lyraAdapterValues(0)
    console.log({ lyraBaseETH1 })

    const lyraAdapterKeys = await outsController.lyraAdapterKeys(0)
    console.log({ lyraAdapterKeys })

    const lyraOptionMarket = await outsController.lyraOptionMarkets(0)
    console.log({ lyraOptionMarket })

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
