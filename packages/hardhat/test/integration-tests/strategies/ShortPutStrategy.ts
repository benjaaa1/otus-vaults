import { lyraConstants, lyraEvm, TestSystem, getMarketDeploys, getGlobalDeploys } from '@lyrafinance/protocol';
import { toBN, ZERO_ADDRESS } from '@lyrafinance/protocol/dist/scripts/util/web3utils';
import { DEFAULT_PRICING_PARAMS } from '@lyrafinance/protocol/dist/test/utils/defaultParams';
import { TestSystemContractsType } from '@lyrafinance/protocol/dist/test/utils/deployTestSystem';
import { PricingParametersStruct } from '@lyrafinance/protocol/dist/typechain-types/OptionMarketViewer';
import { OptionMarket } from '@lyrafinance/protocol/dist/typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { 
  OtusCloneFactory, 
  Supervisor, 
  OtusVault, 
  Strategy, 
  MockOptionToken,
  MockERC20, 
  Supervisor__factory, 
  OtusVault__factory, 
  Strategy__factory,
  MockFuturesMarketManager
} from '../../../typechain-types';
import { LyraMarket } from '@lyrafinance/protocol/dist/test/utils/package/parseFiles';

const defaultStrategyDetail: Strategy.DetailStruct = {
  collatBuffer: toBN('1.2'),
  collatPercent: toBN('1'),
  maxVolVariance: toBN('0.1'),
  gwavPeriod: 600,
  minTimeToExpiry: lyraConstants.DAY_SEC,
  maxTimeToExpiry: lyraConstants.WEEK_SEC * 4,
  targetDelta: toBN('0.2').mul(-1),
  maxDeltaGap: toBN('0.1'), // accept delta from 0.1~0.3
  minVol: toBN('0.8'), // min vol to sell. (also used to calculate min premium for call selling vault)
  maxVol: toBN('1.3'), // max vol to sell.
  size: toBN('15'),
  minTradeInterval: 600,
};

const defaultHedgeDetail: Strategy.HedgeDetailStruct = {
  hedgePercentage: toBN('1.2'), // 20% + collatPercent == 100%
  maxHedgeAttempts: toBN('5'),
  limitStrikePricePercent: toBN('0.2'),  // ex. strike price of 3100 2% ~ 3030 // Maybe change the name to currentPriceLimitPercent 
  leverageSize: toBN('2'), // 150% ~ 1.5x 200% 2x 
  stopLossLimit: toBN('0.001'), // .1 is 10% // can be 0 // can be .01 1% // can be .001 .1% // can be .0001 .01%
};

describe('Strategy integration test', async () => {
  // mocked tokens
  let susd: MockERC20;
  let seth: MockERC20;

  let lyraTestSystem: TestSystemContractsType;
  let lyraMarket: LyraMarket;

  // mocked contract for testing
  let futureMarketManager: MockFuturesMarketManager;
  let optionToken: MockOptionToken;

  // primary contracts
  let otusCloneFactory: OtusCloneFactory;
  let supervisor: Supervisor; 
  let vault: OtusVault;
  let strategy: Strategy;
  // cloned contracts owned by manager
  let managersSupervisor: Supervisor; 
  let managersVault: OtusVault; 
  let managersStrategy: Strategy; 

  // roles
  let deployer: SignerWithAddress;
  let manager: SignerWithAddress; // this is the supervisor
  let treasury: SignerWithAddress; 
  let otusMultiSig: SignerWithAddress; 
  let randomUser: SignerWithAddress;
  let randomUser2: SignerWithAddress;
  let randomUser3: SignerWithAddress;
  let keeper: SignerWithAddress;

  // testing parameters
  const spotPrice = toBN('3000');
  let boardId = BigNumber.from(0);
  const boardParameter = {
    expiresIn: lyraConstants.DAY_SEC * 7,
    baseIV: '0.8',
    strikePrices: ['2500', '2600', '2700', '2800', '2900', '3000', '3100'],
    skews: ['1.3', '1.2', '1.1', '1', '1.1', '1.3', '1.3'],
  };

  const initialPoolDeposit = toBN('1500000'); // 1.5m

  before('assign roles', async () => {
    const addresses = await ethers.getSigners();
    deployer = addresses[0]; 
    manager = addresses[1]; // supervisor
    treasury = addresses[2];
    otusMultiSig = addresses[3];
    randomUser = addresses[4];
    randomUser2 = addresses[5];
    randomUser3 = addresses[6];
    keeper = addresses[7]
  });

  before('deploy lyra core', async () => {
    const pricingParams: PricingParametersStruct = {
      ...DEFAULT_PRICING_PARAMS,
      standardSize: toBN('50'),
      spotPriceFeeCoefficient: toBN('0.001'),
      vegaFeeCoefficient: toBN('60'),
    };

    lyraTestSystem = await TestSystem.deploy(deployer, false, false, { pricingParams });

    await TestSystem.seed(deployer, lyraTestSystem, {
      initialBoard: boardParameter,
      initialBasePrice: spotPrice,
      initialPoolDeposit: initialPoolDeposit,
    });

    // assign test tokens
    seth = lyraTestSystem.snx.baseAsset as MockERC20;
    susd = lyraTestSystem.snx.quoteAsset as MockERC20;

    // set boardId
    // await TestSystem.marketActions.createBoard(lyraTestSystem, boardParameter);
    const boards = await lyraTestSystem.optionMarket.getLiveBoards();
    console.log({ boards }); 
    boardId = boards[0];
    // await lyraTestSystem.optionMarket.addStrikeToBoard(boardId, toBN('1900'), toBN('1.1'));
    const details = await lyraTestSystem.optionMarket.getBoardAndStrikeDetails(boardId);
    console.log({ details })

    await lyraTestSystem.optionGreekCache.updateBoardCachedGreeks(boardId);

    // fast forward do vol gwap can work
    await lyraEvm.fastForward(600);
  });

  before('deploy Mock Futures Market Manager', async () => {
    const MockFuturesMarketManagerFactory = await ethers.getContractFactory('MockFuturesMarketManager');
    futureMarketManager = (await MockFuturesMarketManagerFactory.connect(deployer).deploy()) as MockFuturesMarketManager;
    await futureMarketManager.connect(deployer).addMarket(
      "0x7345544800000000000000000000000000000000000000000000000000000000",
      "0x13414675E6E4e74Ef62eAa9AC81926A3C1C7794D"
    );
  })

  before('deploy Mock Option - Token', async () => {
    const MockOptionTokenFactory = await ethers.getContractFactory('MockOptionToken');
    optionToken = (await MockOptionTokenFactory.connect(deployer).deploy('Lyra Option Token', 'LYRAOT')) as MockOptionToken;
    await optionToken.connect(deployer).init(
      lyraTestSystem.optionMarket.address,
      lyraTestSystem.optionGreekCache.address,
      susd.address,
      lyraTestSystem.synthetixAdapter.address
    );
  })

  before('deploy supervisor, vault, strategy, and clone factory contracts', async () => {
    const SupervisorFactory = await ethers.getContractFactory('Supervisor');
    supervisor = (await SupervisorFactory.connect(otusMultiSig).deploy(
      treasury.address
    )) as Supervisor;

    const OtusVaultFactory = await ethers.getContractFactory('OtusVault');
    vault = (await OtusVaultFactory.connect(otusMultiSig).deploy(
      86400 * 7,
      keeper.address
    )) as OtusVault;

    const StrategyFactory = await ethers.getContractFactory('Strategy', {
      libraries: {
        BlackScholes: lyraTestSystem.blackScholes.address,
      },
    });

    strategy = (await StrategyFactory.connect(otusMultiSig).deploy(lyraTestSystem.synthetixAdapter.address)) as Strategy;

    const OtusCloneFactory = await ethers.getContractFactory('OtusCloneFactory');
    otusCloneFactory = (await OtusCloneFactory.connect(otusMultiSig).deploy(
      supervisor.address,
      vault.address,
      strategy.address,
      lyraTestSystem.lyraRegistry.address,
      futureMarketManager.address // futuresmarketmanager
    )) as OtusCloneFactory;

    await otusCloneFactory.connect(deployer).setFuturesMarkets(seth.address, "0x7345544800000000000000000000000000000000000000000000000000000000");
  });

  before('initialize supervisor with a manager', async () => {
    await otusCloneFactory.connect(manager).cloneSupervisor(); 
    const supervisorCloneAddress = await otusCloneFactory.supervisors(manager.address);
    managersSupervisor = await ethers.getContractAt(Supervisor__factory.abi, supervisorCloneAddress) as Supervisor; 
    expect(managersSupervisor.address).to.not.be.eq(ZERO_ADDRESS);
    expect(managersSupervisor.address).to.not.be.eq(supervisor.address);
  });

  before('set lyra market - eth', async () => {
    lyraMarket = await getMarketDeploys('local', 'sETH');

    await lyraTestSystem.lyraRegistry.addMarket({
      liquidityPool: lyraMarket.LiquidityPool.address,
      liquidityTokens: lyraMarket.LiquidityTokens.address,
      greekCache: lyraMarket.OptionGreekCache.address,
      optionMarket: lyraMarket.OptionMarket.address,
      optionMarketPricer: lyraMarket.OptionMarketPricer.address,
      optionToken: lyraMarket.OptionToken.address,
      poolHedger: lyraMarket.PoolHedger.address,
      shortCollateral: lyraMarket.ShortCollateral.address,
      quoteAsset: susd.address,
      baseAsset: lyraMarket.BaseAsset.address
    })
  })

  before('setup option market details', async () => {
    await otusCloneFactory.connect(deployer).setOptionMarketDetails(lyraMarket.OptionMarket.address);
    const addresses = await otusCloneFactory.getOptionMarketDetails(lyraMarket.OptionMarket.address);
    console.log({addresses});
  })

  before('initialize vault and strategy with supervisor', async () => {
    const cap = ethers.utils.parseEther('5000000'); // 5m USD as cap
    const decimals = 18;

    await otusCloneFactory.connect(manager).cloneVaultWithStrategy(
      lyraMarket.OptionMarket.address,
      'OtusVault Share', 
      'Otus VS', 
      true, 
      4, 
      lyraMarket.GWAVOracle.address,
      {
        decimals,
        cap, 
        asset: susd.address
      }
    ); 

    const vaultCloneAddress = await otusCloneFactory.vaults(managersSupervisor.address);
    managersVault = await ethers.getContractAt(OtusVault__factory.abi, vaultCloneAddress) as OtusVault; 
    expect(managersVault.address).to.not.be.eq(ZERO_ADDRESS);
    const strategyCloneAddress = await otusCloneFactory.connect(manager)._getStrategy(managersVault.address);
    managersStrategy = await ethers.getContractAt(Strategy__factory.abi, strategyCloneAddress) as Strategy; 
    expect(managersStrategy.address).to.not.be.eq(ZERO_ADDRESS);
  });

  before('link strategy to vault', async () => {
    await managersVault.connect(manager).setStrategy(managersStrategy.address)
  });

  describe('check strategy setup', async () => {

    it('it should set the strategy correctly on the vault', async () => {
      const strategy = await managersVault.connect(manager)._strategy(); 
      expect(strategy).to.be.eq(managersStrategy.address);
    })

    it('deploys with correct vault', async () => {
      expect(await managersStrategy.vault()).to.be.eq(managersVault.address);
    });

    it('deploys with correct optionType - default', async () => {
      expect(await managersStrategy.optionType()).to.be.eq(TestSystem.OptionType.SHORT_PUT_QUOTE);
    });

    it('deploys with correct gwavOracle', async () => {
      expect(await managersStrategy.gwavOracle()).to.be.eq(lyraTestSystem.GWAVOracle.address);
    });
  });

  describe('setStrategy', async () => {
    it('setting strategy should correctly update strategy variables', async () => {

      const owner = await managersStrategy.owner();

      await managersStrategy.connect(manager).setStrategy(
        defaultStrategyDetail, 
        defaultHedgeDetail,
      );

      const newStrategy = await managersStrategy.connect(manager).currentStrategy();
      expect(newStrategy.minTimeToExpiry).to.be.eq(defaultStrategyDetail.minTimeToExpiry);
      expect(newStrategy.maxTimeToExpiry).to.be.eq(defaultStrategyDetail.maxTimeToExpiry);
      expect(newStrategy.targetDelta).to.be.eq(defaultStrategyDetail.targetDelta);
      expect(newStrategy.maxDeltaGap).to.be.eq(defaultStrategyDetail.maxDeltaGap);
      expect(newStrategy.minVol).to.be.eq(defaultStrategyDetail.minVol);
      expect(newStrategy.maxVol).to.be.eq(defaultStrategyDetail.maxVol);
      expect(newStrategy.size).to.be.eq(defaultStrategyDetail.size);
      expect(newStrategy.minTradeInterval).to.be.eq(defaultStrategyDetail.minTradeInterval);

      const newHedgeStrategy = await managersStrategy.connect(manager).currentHedgeStrategy();
      expect(newHedgeStrategy.hedgePercentage).to.be.eq(defaultHedgeDetail.hedgePercentage);
      expect(newHedgeStrategy.maxHedgeAttempts).to.be.eq(defaultHedgeDetail.maxHedgeAttempts);
      expect(newHedgeStrategy.limitStrikePricePercent).to.be.eq(defaultHedgeDetail.limitStrikePricePercent);
      expect(newHedgeStrategy.leverageSize).to.be.eq(defaultHedgeDetail.leverageSize);
      expect(newHedgeStrategy.stopLossLimit).to.be.eq(defaultHedgeDetail.stopLossLimit);

    });

    it('should revert if setStrategy is not called by owner', async () => {
      await expect(strategy.connect(randomUser).setStrategy(
          defaultStrategyDetail, 
          defaultHedgeDetail
        )).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });
  });

  describe('start the first round', async () => {

    let strikes: BigNumber[] = [];

    before('create fake susd for users', async () => {
      await susd.mint(randomUser.address, toBN('100000'));
      await susd.mint(randomUser2.address, toBN('100000'));
    });

    before('set strikes array', async () => {
      strikes = await lyraTestSystem.optionMarket.getBoardStrikes(boardId);
      console.log({ strikes })
    });

    before('check strikeIds', async() => {

      const results = await Promise.all(strikes.map(async strike => {
        const strikeObj = await strikeIdToDetail(lyraTestSystem.optionMarket, strike);
        return strikeObj;
      }))

      console.log({ results });
    })   

    it('user should be able to deposit through vault', async () => {
      // user 1 deposits
      await susd.connect(randomUser).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser).deposit(toBN('50000'));
      // user 2 deposits
      await susd.connect(randomUser2).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser2).deposit(toBN('70000'));

      const state = await managersVault.vaultState();
      expect(state.totalPending.eq(toBN('120000'))).to.be.true;
    });

    it('manager can start round 1', async () => {
      console.log({ boardId, strikes: strikes[1] })
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikes[0])
      await managersVault.connect(manager).startNextRound();
      const sharesBalance = managersVault.connect(manager).balanceOf(randomUser2.address);
      console.log({ sharesBalance })
    });

    it('will not trade when delta is out of range0', async () => {
      // 2500, 2600, 2800 are bad strike based on delta
      console.log(" strikes[0]", strikes[0])
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikes[0])
      await expect(managersVault.connect(manager).trade()).to.be.revertedWith('invalid strike');      
    });

    it('will not trade when delta is out of range1', async () => {
      // 2500, 2600, 2800 are bad strike based on delta
      console.log(" strikes[1]", strikes[1])
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikes[1])
      await expect(managersVault.connect(manager).trade()).to.be.revertedWith('TradeDeltaOutOfRange');
      
    });

    it('will not trade when delta is out of range4', async () => {
      // 2500, 2600, 2800 are bad strike based on delta
      console.log(" strikes[4]", strikes[4])
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikes[4])
      await expect(managersVault.connect(manager).trade()).to.be.revertedWith('invalid strike');
      
    });

    it('should revert when min premium < premium calculated with min vol', async () => {
      // 2550 is good strike with reasonable delta, but won't go through because premium will be too low.
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikes[3])
      await expect(managersVault.connect(manager).trade()).to.be.revertedWith('TotalCostOutsideOfSpecifiedBounds');

    });

    it('should trade when delta and vol are within range', async () => {
      const strikeObj = await strikeIdToDetail(lyraTestSystem.optionMarket, strikes[2]);
      const [collateralToAdd] = await managersStrategy.connect(manager).getRequiredCollateral(strikeObj);

      const vaultStateBefore = await managersVault.connect(manager).vaultState();
      const strategySUSDBalance = await susd.balanceOf(managersStrategy.address);
      console.log({ vaultStateBefore, strategySUSDBalance })

      // 3400 is a good strike
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikeObj.id);
      await managersVault.connect(manager).trade();

      const strategyBalance = await seth.balanceOf(managersStrategy.address);
      const vaultStateAfter = await managersVault.connect(manager).vaultState();
      console.log({ strategyBalance, vaultStateAfter });

      const strategySUDCBalanceAfter = await susd.balanceOf(managersStrategy.address);
      console.log({ strategySUDCBalanceAfter, strategySUSDBalance })

      // strategy shouldn't hold any seth
      expect(strategyBalance.isZero()).to.be.true;
      // check state.lockAmount left is updated
      expect(vaultStateBefore.lockedAmountLeft.sub(vaultStateAfter.lockedAmountLeft).eq(collateralToAdd)).to.be.true;
      // check that we receive sUSD
      expect(strategySUDCBalanceAfter.sub(strategySUSDBalance).gt(0)).to.be.true;

      // active strike is updated
      const storedStrikeId = await managersStrategy.activeStrikeIds(0);
      expect(storedStrikeId.eq(strikeObj.id)).to.be.true;

      // check that position size is correct
      const positionId = await managersStrategy.strikeToPositionId(storedStrikeId);
      const [position] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      expect(position.amount.eq(defaultStrategyDetail.size)).to.be.true;
      expect(position.collateral.eq(collateralToAdd)).to.be.true;
    });

    it('should revert when user try to trigger another trade during cooldown', async () => {
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikes[2]);
      await expect(managersVault.connect(manager).trade()).to.be.revertedWith('min time interval not passed');
    });

    it('should be able to trade a higher strike if spot price goes up', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('3200'), 'sETH');

      // triger with new strike (2900)
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikes[4]);
      await managersVault.connect(manager).trade();

      // check that active strikes are updated
      const storedStrikeId = await managersStrategy.activeStrikeIds(1);
      expect(storedStrikeId.eq(strikes[4])).to.be.true;
      const positionId = await managersStrategy.strikeToPositionId(storedStrikeId);
      const [position] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      expect(position.amount.eq(defaultStrategyDetail.size)).to.be.true;
    });

    it('should revert when trying to trade the old strike', async () => {
      await lyraEvm.fastForward(600);
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikes[3]);
      await expect(managersVault.connect(manager).trade()).to.be.revertedWith('invalid strike');
    });

    const additionalDepositAmount = toBN('25000');
    it('can add more deposit during the round', async () => {
      await managersVault.connect(randomUser).deposit(additionalDepositAmount);
      const state = await managersVault.vaultState();
      expect(state.totalPending.eq(additionalDepositAmount)).to.be.true;
      const receipt = await managersVault.depositReceipts(randomUser.address);
      expect(receipt.amount.eq(additionalDepositAmount)).to.be.true;
    });

    it('fastforward to the expiry', async () => {
      await lyraEvm.fastForward(boardParameter.expiresIn);
    });

    it('should revert when closeRound is called before options are settled', async () => {
      await expect(managersVault.closeRound()).to.be.revertedWith('cannot clear active position');
    });

    it('should be able to close closeRound after settlement', async () => {
      await lyraTestSystem.optionMarket.settleExpiredBoard(boardId);

      // settle all positions, from 1 to highest position
      const totalPositions = (await lyraTestSystem.optionToken.nextId()).sub(1).toNumber();
      const idsToSettle = Array.from({ length: totalPositions }, (_, i) => i + 1); // create array of [1... totalPositions]
      await lyraTestSystem.shortCollateral.settleOptions(idsToSettle);
      await managersVault.closeRound();

      // initiate withdraw for later test
      await managersVault.connect(randomUser2).initiateWithdraw(toBN('50'));
    });

  });

  describe('start round 2', async () => {
    let strikes: BigNumber[] = [];
    let position: any;
    let strikePrice: BigNumber;
    let positionId: BigNumber;
    let expiry: BigNumber;
    let snapshot: number;
    let strategySUSDBalanceBefore: BigNumber;

    before('prepare before new round start', async () => {
      // set price back to initial spot price
      await TestSystem.marketActions.mockPrice(lyraTestSystem, spotPrice, 'sETH');

      // initiate withdraw for later test
      const balance2 = await managersVault.connect(randomUser2).shareBalances(randomUser2.address);
      console.log({ balance2 })
      await managersVault.connect(randomUser2).initiateWithdraw(toBN('50000'));
      const vs = await managersVault.connect(randomUser2).vaultState();
      console.log({ currentRound: vs.round });
    });

    before('create new board', async () => {
      await TestSystem.marketActions.createBoard(lyraTestSystem, boardParameter);
      const boards = await lyraTestSystem.optionMarket.getLiveBoards();
      boardId = boards[0];

      strikes = await lyraTestSystem.optionMarket.getBoardStrikes(boardId);
    });

    before('start the next round', async () => {
      await lyraEvm.fastForward(lyraConstants.DAY_SEC);
      await managersVault.connect(manager).setNextBoardStrikeId(boardId, strikes[2]);
      await managersVault.connect(manager).startNextRound();
      const vs2 = await managersVault.connect(randomUser2).vaultState();
      console.log({ vs2: vs2.round });
    });

    before('should be able to complete the withdraw', async () => {
      const susdBefore = await seth.balanceOf(randomUser2.address);

      await managersVault.connect(randomUser2).completeWithdraw();

      const susdAfter = await susd.balanceOf(randomUser2.address);

      expect(susdAfter.sub(susdBefore).gt(toBN('50000'))).to.be.true;
    });

    beforeEach(async () => {
      snapshot = await lyraEvm.takeSnapshot();

      strategySUSDBalanceBefore = await susd.balanceOf(managersStrategy.address);
      await managersVault.connect(manager).trade();

      [strikePrice, expiry] = await lyraTestSystem.optionMarket.getStrikeAndExpiry(strikes[2]);
      positionId = await managersStrategy.strikeToPositionId(strikes[2]);
      position = (await lyraTestSystem.optionToken.getOptionPositions([positionId]))[0];
    });

    afterEach(async () => {
      await lyraEvm.restoreSnapshot(snapshot);
    });

    it('should recieve premium', async () => {
      const strategySUDCBalanceAfter = await susd.balanceOf(managersStrategy.address);
      expect(strategySUDCBalanceAfter.sub(strategySUSDBalanceBefore).gt(0)).to.be.true;
    });

    it('should revert when trying to reduce a safe position', async () => {
      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry);
      expect(fullCloseAmount).to.be.eq(0);
      await expect(managersVault.connect(keeper).reducePosition(positionId, toBN('10000'))).to.be.revertedWith(
        'amount exceeds allowed close amount',
      );
    });

    it('reduce full position if unsafe position + delta is in range', async () => {
      // 13% crash
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2600'), 'sETH');
      const positionId = await managersStrategy.strikeToPositionId(strikes[2]); // 2700 strike
      const preReduceBal = await susd.balanceOf(managersStrategy.address);

      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry.sub(10)); //account for time passing
      expect(fullCloseAmount).to.be.gt(0);
      await managersVault.connect(randomUser).reducePosition(positionId, fullCloseAmount);
      const postReduceBal = await susd.balanceOf(managersStrategy.address);
      expect(postReduceBal).to.be.lt(preReduceBal);
    });

    it('partially reduce position if unsafe position + delta is in range', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2600'), 'sETH');
      const preReduceBal = await susd.balanceOf(managersStrategy.address);

      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry.sub(10)); //account for time passing
      expect(fullCloseAmount).to.be.gt(0);
      await managersVault.connect(randomUser).reducePosition(positionId, fullCloseAmount.div(2));
      const postReduceBal = await susd.balanceOf(managersStrategy.address);
      expect(postReduceBal).to.be.lt(preReduceBal);
    });

    it('revert reduce position if unsafe position + close amount too large', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2250'), 'sETH');
      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry.sub(10)); //account for time passing
      expect(fullCloseAmount).to.be.gt(0);
      await expect(managersVault.connect(randomUser).reducePosition(positionId, fullCloseAmount.mul(2))).to.be.revertedWith(
        'amount exceeds allowed close amount',
      );
    });

    it('partially reduce position with force close if delta out of range', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2000'), 'sETH');

      const [positionBefore] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry.sub(10)); //account for time passing
      expect(fullCloseAmount).to.be.gt(0);

      // send strategy some usdc so they can successfully reduce position
      await susd.mint(managersStrategy.address, toBN('50000'));

      await managersVault.connect(randomUser).reducePosition(positionId, fullCloseAmount.div(2));
      const [positionAfter] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      expect(positionBefore.amount.sub(positionAfter.amount)).to.be.gt(0);
    });

  });
});

async function strikeIdToDetail(optionMarket: OptionMarket, strikeId: BigNumber) {
  const [strike, board] = await optionMarket.getStrikeAndBoard(strikeId);
  console.log({
    id: strike.id,
    expiry: board.expiry,
    strikePrice: strike.strikePrice,
    skew: strike.skew,
    boardIv: board.iv,
  })
  return {
    id: strike.id,
    expiry: board.expiry,
    strikePrice: strike.strikePrice,
    skew: strike.skew,
    boardIv: board.iv,
  };
}