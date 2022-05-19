const hre = require('hardhat');
const { toBN } = require('@lyrafinance/protocol/dist/scripts/util/web3utils');

const {getNamedAccounts} = hre;

const mintQuoteAndBaseTokens = async () => {
  try {
    const { deployer } = await getNamedAccounts();

    const quote = await ethers.getContract("MockSUSD");
    await quote.mint("0xA9A42881bb44B7137720fb0032De3BF91E00fcA5", toBN('100000'));
    await quote.mint("0xD5afd101Bdcb84F736c7041085f6d97aE0d99478", toBN('100000'));

    const base = await ethers.getContract("MockERC20");

    await base.mint("0xA9A42881bb44B7137720fb0032De3BF91E00fcA5", toBN('100000'));
    await base.mint("0xD5afd101Bdcb84F736c7041085f6d97aE0d99478", toBN('100000'));

    // from here i can update react constants with test quote and base addresses

    return true;
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  await mintQuoteAndBaseTokens();
  console.log("✅  Minted Base and Quote Tokens to User.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
