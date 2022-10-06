const hre = require('hardhat');

const {getNamedAccounts, getChainId} = hre;

const localChainId = "31337";

const registerMarkets = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId(); 
    
    const mockFuturesMarketManager = await ethers.getContract("MockFuturesMarketManager");

    const mockFuturesMarket = await ethers.getContract("MockFuturesMarket");

    const txSetMarket = await mockFuturesMarketManager.addMarket("0x7345544800000000000000000000000000000000000000000000000000000000", mockFuturesMarket.address); 
    const txSetMarketReceipt = txSetMarket.wait(); 

    return true;
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  await registerMarkets();
  console.log("✅  Register market in futures market - mock");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
