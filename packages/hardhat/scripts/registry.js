const hre = require('hardhat');
const { getMarketDeploys, getGlobalDeploys } = require("@lyrafinance/protocol")

const {getNamedAccounts, getChainId} = hre;

const localChainId = "31337";
const testNetChainId = "420";
const mainnetChainId = "10";

const ETH_MARKET_BYTES = '0x7345544800000000000000000000000000000000000000000000000000000000'
const GOERLI_ETH_FUTURES_MARKET = '0x0D10c032ad006C98C33A95e59ab3BA2b0849bD59'; 

const getFuturesMarketETH = async (chainId) => {
  if(chainId == localChainId) {
    const mockFuturesMarket = await ethers.getContract("MockFuturesMarket");
    return mockFuturesMarket.address; 
  } else if(chainId == testNetChainId) {
    return GOERLI_ETH_FUTURES_MARKET; 
  } else {
    return ''; 
  }
}

const NetworkNameByChainId = {
  31337: 'local',
  420: 'goerli-ovm',
  10: 'mainnet'
}

const lyraMarketDeploys = () => {

}

const lyraGlobalDeploys = () => {

}

const registerMarkets = async () => {
  try {

    const chainId = await getChainId(); 
    console.log({ chainId })
    const networkName = NetworkNameByChainId[chainId]; 

    const lyraMarket = getMarketDeploys(networkName, 'sETH');
    const lyraGlobal = await getGlobalDeploys(networkName);

    const otusCloneFactory = await ethers.getContract("OtusCloneFactory");
    const outsController = await ethers.getContract("OtusController");
    const lyraBase = await ethers.getContract("LyraBase");

    // // need to set clone factory address on controller
    const txSetFactory = await outsController.setOtusCloneFactory(otusCloneFactory.address); 
    txSetFactory.wait(); 

    const futuresMarketETH = getFuturesMarketETH(chainId);

    // set futures market for supported markets (for local just eth / for mainnet btc and eth)
    const setFuturesMarket = await outsController.setFuturesMarkets(futuresMarketETH, ETH_MARKET_BYTES)
    setFuturesMarket.wait(); 

    const lyraBaseETH = await outsController.setLyraAdapter(lyraBase.address, lyraMarket.OptionMarket.address, ETH_MARKET_BYTES);
    lyraBaseETH.wait(); 

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
