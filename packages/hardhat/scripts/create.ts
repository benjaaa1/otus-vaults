import { getGlobalDeploys, getMarketDeploys, lyraConstants, TestSystem } from '@lyrafinance/protocol';
import { toBN } from '@lyrafinance/protocol/dist/scripts/util/web3utils';
// import { StrategyBase } from '../typechain-types';
// import { Vault } from '../typechain-types/OtusVault';

// const {
//   LyraBase,
//   MockERC20,
//   MockFuturesMarket,
//   MockFuturesMarketManager,
//   OtusCloneFactory,
//   OtusController,
//   OtusVault,
//   OtusVault__factory,
//   Strategy__factory,
// } = require('../typechain-types');

// const { Strategy, StrategyBase } = require('../typechain-types/Strategy');

const hre = require('hardhat');
const { getNamedAccounts, ethers } = hre;

const _Lyra = require('@lyrafinance/lyra-js');

const ERC20ABI = require('./helpers/abi/ERC20');
const TESTFAUCETABI = require('./helpers/abi/TestFaucet');

const { parseUnits, formatUnits } = require('ethers/lib/utils');

const HOUR_SEC = 60 * 60;
const DAY_SEC = 24 * HOUR_SEC;
const WEEK_SEC = 7 * DAY_SEC;

const rpcUrl = 'https://optimism-kovan.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925';
const localUrl = 'http://localhost:8545';

const provider = new ethers.providers.JsonRpcProvider(localUrl);

const LyraConfig = {
  provider: provider,
};

const privateKeyFunder = '83b0ab1fd1b00eaa17ec88017e5802a66de33de1ae370863c9bb371dca13c99c';
const pkLocalFunder = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const funder = new ethers.Wallet(pkLocalFunder, provider);

const privateKeyDeployer = '83b0ab1fd1b00eaa17ec88017e5802a66de33de1ae370863c9bb371dca13c99c';
const pkLocalDeployer = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const deployer = new ethers.Wallet(pkLocalDeployer, provider); // can use pkLocalFunder and pkLocalDejployer here

const ethMarketKey = '0x7345544800000000000000000000000000000000000000000000000000000000';

const buildTrades = async (strikes) => {
  return {
    market: ethMarketKey,
    optionType: 4,
    strikeId: strikes[1].id,
    size: toBN('2'),
    positionId: toBN('0'),
  };
};

const defaultStrategyDetail = {
  hedgeReserve: toBN('.15'), // limit up to 50%
  collatBuffer: toBN('1.2'),
  collatPercent: toBN('.35'),
  minTimeToExpiry: lyraConstants.DAY_SEC,
  maxTimeToExpiry: lyraConstants.WEEK_SEC * 4,
  minTradeInterval: 600,
  gwavPeriod: 600,
  allowedMarkets: [ethMarketKey],
};

const vaultInfo = {
  name: 'New Vault Test 2',
  tokenName: 'OtusVault Share',
  tokenSymbol: 'Otus VS',
  description: 'Sell ETH Puts',
  isPublic: true,
  performanceFee: toBN('0'),
  managementFee: toBN('0'),
};

const defaultStrikeStrategyDetail = {
  targetDelta: toBN('0.2').mul(-1),
  maxDeltaGap: toBN('0.9'), // accept delta from 0.1~0.3
  minVol: toBN('0.3'), // min vol to sell. (also used to calculate min premium for call selling vault)
  maxVol: toBN('1.9'), // max vol to sell.
  maxVolVariance: toBN('0.6'),
  optionType: 4,
};

const create = async () => {
  try {
    // use getSigners to get random ones and test more and faster on kovan by getting drip auto and snx too
    const otusController = await ethers.getContract('OtusController');
    console.log({ otusController: otusController.address })
    const otusVault = await ethers.getContract('OtusVault');
    const strategy = await ethers.getContract('Strategy');
    const lyraBase = await ethers.getContract('LyraBase');

    const lyraGlobal = getGlobalDeploys('local');
    const lyraMarket = getMarketDeploys('local', 'sETH');

    const susd = lyraGlobal.QuoteAsset;

    const vaultParams = {
      decimals: 18,
      cap: toBN('500000'),
      asset: susd.address,
    };

    const createVault = await otusController
      .connect(deployer)
      .createVault(vaultInfo, vaultParams);

    await createVault.wait();

    const { userVaults } = await otusController.connect(deployer)._getVaults();

    // const userVaultInformation = userVaults.map((vault: string, index: number) => {
    //   const strategy = userStrategies[index];
    //   return { vault, strategy };
    // });

    // const len = userVaultInformation.length;

    // const _vault = userVaultInformation[len - 1].vault;
    // const _strategy = userVaultInformation[len - 1].strategy;

    const otusVaultInstance = otusVault.attach(userVaults[0]);

    const { _strategies } = await otusController.connect(deployer)._getStrategies(userVaults[0]);

    const strategyInstance = strategy.attach(_strategies[0]);

    // approve and deposit susd
    await drip(susd, otusVaultInstance, userVaults[0]);

    // // set strike options strategies
    // const currentStrikeStrategies = buildStrikeStrategies();
    // console.log({ currentStrikeStrategies });

    // type - 0 => options
    const setNextRoundStrategy = await otusVaultInstance.connect(deployer).setNextRoundStrategy(0);
    await setNextRoundStrategy.wait();

    const strikeStrategiesSet = await strategyInstance
      .connect(deployer)
      .setStrikeStrategyDetail([defaultStrikeStrategyDetail]);
    await strikeStrategiesSet.wait();

    await strategyInstance.connect(deployer).setHedgeStrategyType(2);

    // in future set hedge strategy
    const _dynamicStrategy = {
      threshold: toBN('.80'),
      maxLeverageSize: toBN('2'),
      maxHedgeAttempts: toBN('4')
    };

    const strikeHedgeDetailSet = await strategyInstance
      .connect(deployer)
      .setHedgeStrategies(_dynamicStrategy);
    await strikeHedgeDetailSet.wait();

    const startRound = await otusVaultInstance.connect(deployer).startNextRound();
    await startRound.wait();

    const optionMarket = await ethers.getContractAt(lyraMarket.OptionMarket.abi, lyraMarket.OptionMarket.address);

    const boards = await optionMarket.getLiveBoards();

    const strikes = await optionMarket.getBoardStrikes(boards[0]);

    const strikeDetails = await Promise.all(
      strikes.map(async strike => {
        const strikeDetail = await optionMarket.getStrike(strike);
        return strikeDetail;
      }),
    );

    // // select strikes StrategyBase.StrikeTrade[] and trade
    const trades = await buildTrades(strikeDetails);

    const trade = await otusVaultInstance.connect(deployer).trade([], [trades]);
    await trade.wait();
    // console.log({ trade })
    // const _checkDeltaByPositionId = await strategyInstance._checkDeltaByPositionId(ethMarketKey, [strikes[1]]);
    // get positions opened
    // const [strikes, optionTypes, positionIds] = await strategyInstance.getStrikeOptionTypes();
    // console.log({ strikes, optionTypes, positionIds })
    const _activeStrikeTrades = await strategyInstance.activeStrikeTrades(0);
    console.log({ _activeStrikeTrades })
    return true;
  } catch (e) {
    // send back
    // need to get back my snssusd
    console.log(e);
  }
};

async function main() {
  await create();
  console.log('✅  create.');
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

const drip = async (susd, otusVaultInstance, _vault) => {
  const signers = [];

  const susdContract = await ethers.getContractAt(ERC20ABI, susd.address);
  const mint = await susdContract.mint(deployer.address, toBN('5000'));
  await mint.wait();

  for (let i = 0; i < 4; i++) {
    let wallet = ethers.Wallet.createRandom();
    wallet = wallet.connect(provider);
    signers.push(wallet);
  }

  await Promise.all(
    signers.map(async (signer, i) => {
      const nonce = await provider.getTransactionCount(deployer.address);
      const sendETH = await deployer.sendTransaction({ nonce: nonce + i, to: signer.address, value: toBN('.005') });
      await sendETH.wait();
    }),
  );

  await Promise.all(
    signers.map(async signer => {
      const mint = await susdContract.mint(signer.address, toBN('5000'));
      await mint.wait();

      const balance = await susdContract.balanceOf(signer.address);
      const approve = await susdContract.connect(signer).approve(_vault, balance);
      await approve.wait();

      const allowanceStatus = await susdContract.allowance(signer.address, _vault);

      if (!allowanceStatus.isZero()) {
        const deposit = await otusVaultInstance.connect(signer).deposit(allowanceStatus);
        await deposit.wait();
      }
    }),
  );
};
