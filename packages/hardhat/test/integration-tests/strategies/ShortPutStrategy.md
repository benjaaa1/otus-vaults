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
  OtusController,
  OtusCloneFactory,
  OtusVault,
  Strategy,
  StrategyBase,
  MockOptionToken,
  MockERC20,
  OtusVault__factory,
  Strategy__factory,
  MockFuturesMarketManager,
  Keeper,
} from '../../../typechain-types';
import { LyraMarket } from '@lyrafinance/protocol/dist/test/utils/package/parseFiles';

const defaultStrategyDetail: StrategyBase.StrategyDetailStruct = {
  hedgeReserve: toBN('1.5'),
  collatBuffer: toBN('1.2'),
  collatPercent: toBN('.35'),
  minTimeToExpiry: lyraConstants.DAY_SEC,
  maxTimeToExpiry: lyraConstants.WEEK_SEC * 4,
  minTradeInterval: 600,
  gwavPeriod: 600,
  allowedMarkets: ['0x7345544800000000000000000000000000000000000000000000000000000000'],
};

const defaultStrikeStrategyDetailCall: StrategyBase.StrikeStrategyDetailStruct = {
  targetDelta: toBN('0.4'),
  maxDeltaGap: toBN('0.5'), // accept delta from 0.1~0.3
  minVol: toBN('0.8'), // min vol to sell. (also used to calculate min premium for call selling vault)
  maxVol: toBN('1.3'), // max vol to sell.
  maxVolVariance: toBN('0.1'),
  optionType: 3,
};

const defaultStrikeStrategyDetail: StrategyBase.StrikeStrategyDetailStruct = {
  targetDelta: toBN('0.2').mul(-1),
  maxDeltaGap: toBN('0.1'), // accept delta from 0.1~0.3
  minVol: toBN('0.8'), // min vol to sell. (also used to calculate min premium for call selling vault)
  maxVol: toBN('1.3'), // max vol to sell.
  maxVolVariance: toBN('0.1'),
  optionType: 4,
};

const defaultStaticDeltaHedgeDetail: StrategyBase.StaticDeltaHedgeStrategyStruct = {
  deltaToHedge: toBN('.5'), // 50% of delta
  maxLeverageSize: toBN('2'), // 2x
};

const defaultDynamicDeltaHedgeDetail: StrategyBase.DynamicDeltaHedgeStrategyStruct = {
  deltaToHedge: toBN('1'), // 100%
  maxHedgeAttempts: toBN('5'),
  maxLeverageSize: toBN('2'), // 150% ~ 1.5x 200% 2x
  period: lyraConstants.DAY_SEC, // every period to hedge check
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
  let otusController: OtusController;
  let otusCloneFactory: OtusCloneFactory;
  let vault: OtusVault;
  let strategy: Strategy;
  // cloned contracts owned by manager
  let managersVault: OtusVault;
  let managersStrategy: Strategy;
  let keeper: Keeper;

  // roles
  let otusMultiSig: SignerWithAddress;

  let deployer: SignerWithAddress;
  let manager: SignerWithAddress; // this is the supervisor

  let randomUser: SignerWithAddress;
  let randomUser2: SignerWithAddress;
  let randomUser3: SignerWithAddress;

  // testing parameters
  const spotPrice = toBN('1300');
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
    otusMultiSig = addresses[3];
    randomUser = addresses[4];
    randomUser2 = addresses[5];
    randomUser3 = addresses[6];
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
    boardId = boards[0];
    // await lyraTestSystem.optionMarket.addStrikeToBoard(boardId, toBN('1900'), toBN('1.1'));
    const details = await lyraTestSystem.optionMarket.getBoardAndStrikeDetails(boardId);

    await lyraTestSystem.optionGreekCache.updateBoardCachedGreeks(boardId);

    // fast forward do vol gwap can work
    await lyraEvm.fastForward(600);
  });

  before('deploy Mock Futures Market Manager', async () => {
    const MockFuturesMarketManagerFactory = await ethers.getContractFactory('MockFuturesMarketManager');
    futureMarketManager = (await MockFuturesMarketManagerFactory.connect(
      deployer,
    ).deploy()) as MockFuturesMarketManager;
    await futureMarketManager
      .connect(deployer)
      .addMarket(
        '0x7345544800000000000000000000000000000000000000000000000000000000',
        '0x13414675E6E4e74Ef62eAa9AC81926A3C1C7794D',
      );
  });

  before('deploy Mock Option - Token', async () => {
    const MockOptionTokenFactory = await ethers.getContractFactory('MockOptionToken');
    optionToken = (await MockOptionTokenFactory.connect(deployer).deploy(
      'Lyra Option Token',
      'LYRAOT',
    )) as MockOptionToken;
    await optionToken
      .connect(deployer)
      .init(
        lyraTestSystem.optionMarket.address,
        lyraTestSystem.optionGreekCache.address,
        susd.address,
        lyraTestSystem.synthetixAdapter.address,
      );
  });

  before('deploy vault, strategy, and clone factory contracts', async () => {
    const OtusController = await ethers.getContractFactory('OtusController');
    otusController = (await OtusController.connect(otusMultiSig).deploy(
      lyraTestSystem.lyraRegistry.address,
      futureMarketManager.address, // futuresmarketmanager
    )) as OtusController;

    const Keeper = await ethers.getContractFactory('Keeper');
    keeper = (await Keeper.connect(otusMultiSig).deploy(otusController.address)) as Keeper;

    const OtusVaultFactory = await ethers.getContractFactory('OtusVault');
    vault = (await OtusVaultFactory.connect(otusMultiSig).deploy(86400 * 7, keeper.address)) as OtusVault;

    const StrategyFactory = await ethers.getContractFactory('Strategy', {
      libraries: {
        BlackScholes: lyraTestSystem.blackScholes.address,
      },
    });

    strategy = (await StrategyFactory.connect(otusMultiSig).deploy(
      lyraTestSystem.synthetixAdapter.address,
    )) as Strategy;

    const OtusCloneFactory = await ethers.getContractFactory('OtusCloneFactory');
    otusCloneFactory = (await OtusCloneFactory.connect(otusMultiSig).deploy(
      vault.address,
      strategy.address,
      strategy.address, // l2DepositMover.address,
      otusController.address,
    )) as OtusCloneFactory;

    await otusController.connect(otusMultiSig).setOtusCloneFactory(otusCloneFactory.address);

    await otusController
      .connect(otusMultiSig)
      .setFuturesMarkets(seth.address, '0x7345544800000000000000000000000000000000000000000000000000000000');
  });

  before('set lyra market - eth', async () => {
    lyraMarket = await getMarketDeploys('local', 'sETH');
    await lyraTestSystem.lyraRegistry.addMarket({
      liquidityPool: lyraMarket.LiquidityPool.address,
      liquidityToken: lyraMarket.LiquidityToken.address,
      greekCache: lyraMarket.OptionGreekCache.address,
      optionMarket: lyraMarket.OptionMarket.address,
      optionMarketPricer: lyraMarket.OptionMarketPricer.address,
      optionToken: lyraMarket.OptionToken.address,
      poolHedger: lyraMarket.PoolHedger.address,
      shortCollateral: lyraMarket.ShortCollateral.address,
      gwavOracle: lyraMarket.GWAVOracle.address,
      quoteAsset: susd.address,
      baseAsset: lyraMarket.BaseAsset.address,
    });
  });

  before('setup option market details', async () => {
    await otusController.connect(deployer).setOptionMarketDetails(lyraMarket.OptionMarket.address);
    const addresses = await otusController.getOptionMarketDetails(lyraMarket.OptionMarket.address);
  });

  before('initialize vault and strategy', async () => {
    const cap = ethers.utils.parseEther('5000000'); // 5m USD as cap
    const decimals = 18;

    await otusController.connect(manager).createOptionsVault(
      lyraMarket.OptionMarket.address,
      {
        name: 'New Vault',
        tokenName: 'OtusVault Share',
        tokenSymbol: 'Otus VS',
        description: '',
        isPublic: true,
        performanceFee: 0,
        managementFee: 0,
      },
      {
        decimals,
        cap,
        asset: susd.address,
      },
      defaultStrategyDetail,
    );

    const vaultCloneAddress = await otusController.vaults(manager.address, 0);
    managersVault = (await ethers.getContractAt(OtusVault__factory.abi, vaultCloneAddress)) as OtusVault;
    expect(managersVault.address).to.not.be.eq(ZERO_ADDRESS);
    const strategyCloneAddress = await otusController.connect(manager)._getStrategies([managersVault.address]);
    managersStrategy = (await ethers.getContractAt(Strategy__factory.abi, strategyCloneAddress[0])) as Strategy;
    expect(managersStrategy.address).to.not.be.eq(ZERO_ADDRESS);
    expect(await managersVault.strategy()).to.be.eq(managersStrategy.address);
  });

  describe('check strategy setup', async () => {
    it('it should set the strategy correctly on the vault', async () => {
      const strategy = await managersVault.connect(manager).strategy();
      expect(strategy).to.be.eq(managersStrategy.address);
    });

    it('deploys with correct vault', async () => {
      expect(await managersStrategy.vault()).to.be.eq(managersVault.address);
    });

    it('deploys with correct gwavOracle', async () => {
      expect(await managersStrategy.gwavOracle()).to.be.eq(lyraTestSystem.GWAVOracle.address);
    });
  });

  describe('setStrategy', async () => {
    it('setting strategy should correctly update strategy variables', async () => {
      const owner = await managersStrategy.owner();

      await managersStrategy.connect(manager).setStrategy(defaultStrategyDetail);

      const newStrategy = await managersStrategy.connect(manager).currentStrategy();
      expect(newStrategy.minTimeToExpiry).to.be.eq(defaultStrategyDetail.minTimeToExpiry);
      expect(newStrategy.maxTimeToExpiry).to.be.eq(defaultStrategyDetail.maxTimeToExpiry);
      expect(newStrategy.minTradeInterval).to.be.eq(defaultStrategyDetail.minTradeInterval);
    });

    it('should revert if setStrategy is not called by owner', async () => {
      await expect(strategy.connect(randomUser).setStrategy(defaultStrategyDetail)).to.be.revertedWith(
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
    });

    before('check strikeIds', async () => {
      const results = await Promise.all(
        strikes.map(async strike => {
          const strikeObj = await strikeIdToDetail(lyraTestSystem.optionMarket, strike);
          return strikeObj;
        }),
      );
    });

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
      await managersVault.connect(manager).startNextRound(boardId);
      const sharesBalance = await managersVault.connect(manager).balanceOf(randomUser2.address);
    });

    it('will not trade when delta is out of range0', async () => {
      // 2500, 2600, 2800 are bad strike based on delta
      const strikeStrategy = {
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[0],
        size: toBN('7.5'),
        futuresHedge: false,
      };

      const currentStrikeStrategies = await managersStrategy.getCurrentStrikeStrategies();

      await expect(managersVault.connect(manager).trade([strikeStrategy])).to.be.revertedWith('invalid strike');
    });

    it('will not trade when delta is out of range1', async () => {
      // 2500, 2600, 2800 are bad strike based on delta
      const strikeStrategy = {
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[1],
        size: toBN('7.5'),
        futuresHedge: false,
      };

      const currentStrikeStrategies1 = await managersStrategy.getCurrentStrikeStrategies();

      await expect(managersVault.connect(manager).trade([strikeStrategy])).to.be.revertedWith('TradeDeltaOutOfRange');
    });

    it('will not trade when delta is out of range4', async () => {
      // 2500, 2600, 2800 are bad strike based on delta
      const strikeStrategy = {
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[4],
        size: toBN('7.5'),
        futuresHedge: false,
      };

      const currentStrikeStrategies2 = await managersStrategy.getCurrentStrikeStrategies();

      await expect(managersVault.connect(manager).trade([strikeStrategy])).to.be.revertedWith('invalid strike');
    });

    it('should revert when min premium < premium calculated with min vol', async () => {
      // 2550 is good strike with reasonable delta, but won't go through because premium will be too low.
      const strikeStrategy = {
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[3],
        size: toBN('7.5'),
        futuresHedge: false,
      };
      await expect(managersVault.connect(manager).trade([strikeStrategy])).to.be.revertedWith(
        'TotalCostOutsideOfSpecifiedBounds',
      );
    });

    it('should trade when delta and vol are within range', async () => {
      const strikeObj = await strikeIdToDetail(lyraTestSystem.optionMarket, strikes[2]);
      const strikeStrategy = {
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[2],
        size: toBN('7.5'),
        futuresHedge: false,
      };

      const strikeStrategyCall = {
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[6],
        size: toBN('7.5'),
        futuresHedge: false,
      };

      const [collateralToAdd] = await managersStrategy
        .connect(manager)
        .getRequiredCollateral(strikeObj, strikeStrategy.size, strikeStrategy.optionType);

      const vaultStateBefore = await managersVault.connect(manager).vaultState();
      const strategySUSDBalance = await susd.balanceOf(managersStrategy.address);

      // 3400 is a good strike
      await managersVault.connect(manager).trade([strikeStrategy, strikeStrategyCall]);

      const strategyBalance = await seth.balanceOf(managersStrategy.address);
      const vaultStateAfter = await managersVault.connect(manager).vaultState();

      const strategySUDCBalanceAfter = await susd.balanceOf(managersStrategy.address);

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

      expect(position.amount.eq(toBN('7.5'))).to.be.true;
      expect(position.collateral.eq(collateralToAdd)).to.be.true;
    });

    it('should be able to trade a higher strike if spot price goes up', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('3200'), 'sETH');

      // triger with new strike (2900)
      const strikeStrategy = {
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[4],
        size: toBN('7.5'),
        futuresHedge: false,
      };

      await managersVault.connect(manager).trade([strikeStrategy]);

      // check that active strikes are updated
      const storedStrikeId = await managersStrategy.activeStrikeIds(1);
      expect(storedStrikeId.eq(strikes[4])).to.be.true;
      const positionId = await managersStrategy.strikeToPositionId(storedStrikeId);
      const [position] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      expect(position.amount.eq(toBN('7.5'))).to.be.true;
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
      const currentStrikeStrategies = await managersStrategy.getCurrentStrikeStrategies();
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
      await managersVault.connect(randomUser2).initiateWithdraw(toBN('50000'));
      const vs = await managersVault.connect(randomUser2).vaultState();
    });

    before('create new board', async () => {
      await TestSystem.marketActions.createBoard(lyraTestSystem, boardParameter);
      const boards = await lyraTestSystem.optionMarket.getLiveBoards();
      boardId = boards[0];

      strikes = await lyraTestSystem.optionMarket.getBoardStrikes(boardId);
    });

    before('start the next round', async () => {
      await lyraEvm.fastForward(lyraConstants.DAY_SEC);

      await managersVault.connect(manager).startNextRound(boardId);
      const vs2 = await managersVault.connect(randomUser2).vaultState();
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

      const strikeStrategy = {
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[2],
        size: toBN('7.5'),
        futuresHedge: false,
      };

      await managersVault.connect(manager).trade([strikeStrategy]);

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
      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(
        position,
        strikePrice,
        expiry,
        position.optionType,
      );
      expect(fullCloseAmount).to.be.eq(0);
      await expect(managersVault.connect(manager).reducePosition(positionId, toBN('10000'))).to.be.revertedWith(
        'amount exceeds allowed close amount',
      );
    });

    it('reduce full position if unsafe position + delta is in range', async () => {
      // 13% crash
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2600'), 'sETH');
      const positionId = await managersStrategy.strikeToPositionId(strikes[2]); // 2700 strike
      const preReduceBal = await susd.balanceOf(managersStrategy.address);

      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(
        position,
        strikePrice,
        expiry.sub(10),
        position.optionType,
      ); //account for time passing
      expect(fullCloseAmount).to.be.gt(0);
      await managersVault.connect(manager).reducePosition(positionId, fullCloseAmount);
      const postReduceBal = await susd.balanceOf(managersStrategy.address);
      expect(postReduceBal).to.be.lt(preReduceBal);
    });

    it('partially reduce position if unsafe position + delta is in range', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2600'), 'sETH');
      const preReduceBal = await susd.balanceOf(managersStrategy.address);

      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(
        position,
        strikePrice,
        expiry.sub(10),
        position.optionType,
      ); //account for time passing
      expect(fullCloseAmount).to.be.gt(0);
      await managersVault.connect(manager).reducePosition(positionId, fullCloseAmount.div(2));
      const postReduceBal = await susd.balanceOf(managersStrategy.address);
      expect(postReduceBal).to.be.lt(preReduceBal);
    });

    it('revert reduce position if unsafe position + close amount too large', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2250'), 'sETH');
      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(
        position,
        strikePrice,
        expiry.sub(10),
        position.optionType,
      ); //account for time passing
      expect(fullCloseAmount).to.be.gt(0);
      await expect(
        managersVault.connect(manager).reducePosition(positionId, fullCloseAmount.mul(2)),
      ).to.be.revertedWith('amount exceeds allowed close amount');
    });

    it('partially reduce position with force close if delta out of range', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2000'), 'sETH');

      const [positionBefore] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(
        position,
        strikePrice,
        expiry.sub(10),
        position.optionType,
      ); //account for time passing
      expect(fullCloseAmount).to.be.gt(0);

      // send strategy some usdc so they can successfully reduce position
      await susd.mint(managersStrategy.address, toBN('50000'));

      await managersVault.connect(manager).reducePosition(positionId, fullCloseAmount.div(2));
      const [positionAfter] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      expect(positionBefore.amount.sub(positionAfter.amount)).to.be.gt(0);
    });
  });
});

async function strikeIdToDetail(optionMarket: OptionMarket, strikeId: BigNumber) {
  const [strike, board] = await optionMarket.getStrikeAndBoard(strikeId);
  return {
    id: strike.id,
    expiry: board.expiry,
    strikePrice: strike.strikePrice,
    skew: strike.skew,
    boardIv: board.iv,
  };
}
