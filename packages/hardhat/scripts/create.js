
const hre = require('hardhat');
const {getNamedAccounts, ethers} = hre;

const _Lyra = require ('@lyrafinance/lyra-js');

const ERC20ABI = require('./helpers/abi/ERC20');
const TESTFAUCETABI = require('./helpers/abi/TestFaucet');

const { parseUnits, formatUnits } = require('ethers/lib/utils');

const HOUR_SEC = 60 * 60;
const DAY_SEC = 24 * HOUR_SEC;
const WEEK_SEC = 7 * DAY_SEC;

const rpcUrl = 'https://optimism-kovan.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925';

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

const LyraConfig = {
  provider: provider
};

const privateKeyFunder = '83b0ab1fd1b00eaa17ec88017e5802a66de33de1ae370863c9bb371dca13c99c'; 

const funder = new ethers.Wallet(privateKeyFunder, provider);

const privateKeyDeployer = '83b0ab1fd1b00eaa17ec88017e5802a66de33de1ae370863c9bb371dca13c99c'; 

const deployer = new ethers.Wallet(privateKeyDeployer, provider);

const currentSUSD = '0x2400d0469bfda59fb0233c3027349d83f1a0f4c8';

const _snxSUSD = '0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57'; 

const currentTestFaucet = '0xf0034bd49d548095b7a369bfb456680d3188cf16'; 

const depositSNXSUSDToVault = async (snxSUSDInstance, _vault) => {
  const transfer = await snxSUSDInstance.connect(funder).transfer(_vault, ethers.utils.parseEther("200")); 
  const transferReceipt = await transfer.wait(); 
}

const withdrawSNXSUSD = async (otusVaultInstance, strategyInstance) => {
  const transferVault = await otusVaultInstance.connect(funder).withdrawSUSDSNX(); 
  const transferVaultReceipt = await transferVault.wait(); 

  const transferStrategy = await strategyInstance.connect(funder).withdrawSUSDSNX(); 
  const transferReceipt = await transferStrategy.wait(); 
}

const dripApproveAndDeposit = async (susd, testFaucet, otusVaultInstance, _vault) => {
      
  const signers = [];

  for( let i = 0; i < 4; i++) {
    // Get a new wallet
    let wallet = ethers.Wallet.createRandom();
    // add the provider from Hardhat
    wallet =  wallet.connect(provider);
    // send ETH to the new wallet so it can perform a tx
    await funder.sendTransaction({to: wallet.address, value: ethers.utils.parseEther(".005")}); 

    signers.push(wallet); 
  }

  await Promise.all(signers.map(async (signer) => {

    const drip = await testFaucet.connect(signer).drip(); 
    const dripReceipt = await drip.wait(); 

    const balance = await susd.balanceOf(signer.address); 
    const formattedBalance = ethers.utils.formatEther(balance);
    console.log({ formattedBalance })
    const approve = await susd.connect(signer).approve(_vault, ethers.utils.parseEther(formattedBalance)); 
    const approveReceipt = await approve.wait(); 

    const allowanceStatus = await susd.allowance(signer.address, _vault);

    if(!allowanceStatus.isZero()) {

      const deposit = await otusVaultInstance.connect(signer).deposit(allowanceStatus); 
      const depositReceipt = await deposit.wait(); 

    }

  }))

}

const getLiveBoards = async () => {
  const lyra = new _Lyra.default(LyraConfig);
  const lyraMarket = await lyra.market('eth');
  const liveBoards = await lyraMarket.liveBoards(); 
  return liveBoards.filter(({ timeToExpiry }) => timeToExpiry > 0).map(
    board => {
      const boardStrikes = board.strikes()
        .filter(strike => strike.isDeltaInRange)

      return { ...board, boardStrikes }
    })
}

const buildStrikeStrategies = () => {

  return [
    {
      targetDelta: parseUnits(Math.abs(.5).toString()).mul(-1),
      maxDeltaGap: parseUnits('.5', 18),
      minVol: parseUnits('.1', 18),
      maxVol: parseUnits('1.8', 18),
      maxVolVariance: parseUnits('.9', 18),
      optionType: 4 // sell put
    }
  ]

}

const buildHedgeStrategies = () => {

  return [
    {
      hedgePercentage: parseUnits('.2', 18),
      maxHedgeAttempts: parseUnits('6', 18),
      leverageSize: parseUnits('2', 18),
      stopLossLimit: parseUnits('.001', 18),
      optionType: 4
    }
  ]
}

const buildTrades = async (board, deployer, strategyInstance) => {
  const strikes = board.boardStrikes; 
  // const strike = strikes[0];
  // console.log({ strikeData: strike.__strikeData, board: strike.__board })
  // const test = await strategyInstance.connect(deployer).isValidStrike(19, 4); 
  // console.log({ test });

  // const validStrikes = await Promise.all(strikes.map(async strike => {
  //   const { id, skew, iv, strikePrice, __board } = strike; 
  //   const { expiryTimestamp } = __board;
  //   const formattedStrike = {
  //     id: parseUnits(id.toString(), 18),
  //     expiry: parseUnits(expiryTimestamp.toString(), 18),
  //     strikePrice: strikePrice,
  //     skew: skew, 
  //     boardIv: iv
  //   }
  //   console.log({ id, skew, iv, strikePrice })

  //   const rates = await strategyInstance.connect(deployer).isValidStrikeById(id, 4); 
  //   console.log({ rates })

  //   const currentStrikeStrategy = await strategyInstance.currentStrikeStrategies(4); 
  //   console.log({currentStrikeStrategy}); 

  //   // const isValid = await strategyInstance.isValidStrike(formattedStrike, 4); 
  //   // console.log({ isValid });
  //   return formattedStrike; 
  // }));
  // console.log('here')
  return {
    optionType: 4,
    strikeId: strikes[1].id,
    size: parseUnits('2', 18),
    futuresHedge: true
  }
} 

const create = async () => {
  try {
    // use getSigners to get random ones and test more and faster on kovan by getting drip auto and snx too
    const otusController = await ethers.getContract("OtusController");
    const otusVault = await ethers.getContract("OtusVault");
    const strategy = await ethers.getContract("Strategy");
    const susd = await ethers.getContractAt(ERC20ABI, currentSUSD);
    const snxSUSD = await ethers.getContractAt(ERC20ABI, _snxSUSD);
    const testFaucet = await ethers.getContractAt(TESTFAUCETABI, currentTestFaucet);

    const performanceFee = 0;
    const managementFee = 0;

    const cap = 50000; // 50,000 usd cap

    const collatBuffer = 1.2;
    const collatPercent = .35;

    const formattedVaultInformation = {
      name: 'Test',
      tokenName: 'OT-TEST',
      tokenSymbol: 'OT-TEST',
      description: 'Automated Test',
      isPublic: true,
      managementFee: parseUnits(performanceFee.toString(), 18),
      performanceFee: parseUnits(managementFee.toString(), 18)
    };

    const formattedVaultParams = {
      decimals: 18,
      cap: parseUnits(cap.toString()), 
      asset: currentSUSD // susd 
    };

    const formattedVaultStrategy = {
      collatBuffer: parseUnits(collatBuffer.toString(), 18), 
      collatPercent: parseUnits(collatPercent.toString(), 18),
      minTimeToExpiry: 0 * HOUR_SEC,
      maxTimeToExpiry: 8 * WEEK_SEC,
      minTradeInterval: 60 * 10,
      gwavPeriod: 60 * 10,
    };
    // create options vault
    const createVault = await otusController.connect(deployer).createOptionsVault(
      "0xDc06D81A68948544A6B453Df55CcD172061c6d6e",//optionMarket,
      formattedVaultInformation,
      formattedVaultParams,
      formattedVaultStrategy
    ); 
    const createVaultReceipt = await createVault.wait();
    // get vault information back
    const { userVaults, userStrategies } = await otusController.connect(deployer).getUserManagerDetails();
    const userVaultInformation = userVaults.map((vault, index) => {
      const strategy = userStrategies[index];
      return { vault, strategy }
    });
    console.log({userVaultInformation })
    const len = userVaultInformation.length; 

    const _vault = userVaultInformation[len - 1].vault;
    const _strategy = userVaultInformation[len - 1].strategy;
    const otusVaultInstance = otusVault.attach(_vault); 
    const strategyInstance = strategy.attach(_strategy); 

    // approve and deposit susd 
    await dripApproveAndDeposit(susd, testFaucet, otusVaultInstance, _vault); 

    // in future also deposit susd snx
    // await depositSNXSUSDToVault(snxSUSD, _vault);
    // set strike options strategies 
    const currentStrikeStrategies = buildStrikeStrategies(); 

    const strikeStrategiesSet = await strategyInstance.connect(deployer).setStrikeStrategyDetail(currentStrikeStrategies);
    const strikeStrategiesSetReceipt = strikeStrategiesSet.wait();

    // in future set hedge strategy 
    const hedgeStrategies = buildHedgeStrategies(); 
    const strikeHedgeDetailSet = await strategyInstance.connect(deployer).setHedgeStrategy(hedgeStrategies);
    const strikeHedgeDetailSetReceipt = strikeHedgeDetailSet.wait(); 

    // start round
    const liveBoards = await getLiveBoards(); 
    const selectedBoard = liveBoards[1];

    const startRound = await otusVaultInstance.connect(deployer).startNextRound(selectedBoard.id); 
    const startRoundReceipt = await startRound.wait(); 
    
    // select strikes StrategyBase.StrikeTrade[] and trade
    const trades = await buildTrades(selectedBoard, deployer, strategyInstance); 
    const trade = await otusVaultInstance.connect(deployer).trade([trades]); 
    const tradeReceipt = await trade.wait(); 

    // get positions opened
    const [strikes, optionTypes, positionIds] = await strategyInstance.getStrikeOptionTypes();
    console.log({ strikes, optionTypes, positionIds })

    return true;
  } catch (e) {
    // send back 
    // need to get back my snssusd
    console.log(e);
  }
}

async function main() {
  await create();
  console.log("✅  create.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
