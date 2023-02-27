const hre = require('hardhat');

const {getChainId} = hre;

const registerMarkets = async () => {
  try {

    const chainId = await getChainId(); 

    console.log({ chainId })

    const otusCloneFactory = await ethers.getContract("OtusCloneFactory");
    const outsController = await ethers.getContract("OtusController");

    // // need to set clone factory address on controller
    const txSetFactory = await outsController.setOtusCloneFactory(otusCloneFactory.address); 
    txSetFactory.wait(); 

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
