const hre = require('hardhat');

const {getNamedAccounts, getChainId} = hre;

const localChainId = "31337";

const registerMarkets = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId(); 
    
    const otusCloneFactory = await ethers.getContract("OtusCloneFactory");

    const outsController = await ethers.getContract("OtusController");

    const lyraBase = await ethers.getContract("LyraBase");
    const mockFuturesMarket = await ethers.getContract("MockFuturesMarket");

    const txSetFactory = await outsController.setOtusCloneFactory(otusCloneFactory.address); 
    const txSetFactoryReceipt = txSetFactory.wait(); 


    // need to update base asset 
    console.log({ lyraBase: lyraBase.address, mockFuturesMarket: mockFuturesMarket.address })
    const futuresMarketETH = chainId == localChainId ?  "0x7A9Ec1d04904907De0ED7b6839CcdD59c3716AC9" : "0x0D10c032ad006C98C33A95e59ab3BA2b0849bD59";
    const futures = await outsController.setFuturesMarkets(futuresMarketETH, "0x7345544800000000000000000000000000000000000000000000000000000000")
    const futuresReceipt = futures.wait(); 

    const futures1 = await outsController.getFuturesMarket("0x7345544800000000000000000000000000000000000000000000000000000000")
    console.log({ futures1 })

    //set lyra base 
    console.log({ chainId })
    const lyraBaseAddress = chainId == localChainId ? "0xf953b3A269d80e3eB0F2947630Da976B896A8C5b" : "0xF5272B18eee0C04E054AC9ad64023CdD60ffe063";
    const optionMarketAddress = chainId == localChainId ? "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1" : "0xDc06D81A68948544A6B453Df55CcD172061c6d6e";

    const lyraBaseETH = await outsController.setLyraAdapter(lyraBaseAddress, optionMarketAddress, "0x7345544800000000000000000000000000000000000000000000000000000000");
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
