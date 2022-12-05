import { lyraConstants, lyraEvm, TestSystem, getMarketDeploys } from '@lyrafinance/protocol';
import { fromBN, toBN, ZERO_ADDRESS } from '@lyrafinance/protocol/dist/scripts/util/web3utils';
import { DEFAULT_PRICING_PARAMS } from '@lyrafinance/protocol/dist/test/utils/defaultParams';
import { TestSystemContractsType } from '@lyrafinance/protocol/dist/test/utils/deployTestSystem';
import { PricingParametersStruct } from '@lyrafinance/protocol/dist/typechain-types/OptionMarketViewer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, FixedNumber } from 'ethers';
import { ethers } from 'hardhat';

import {
  LyraBase,
  MockERC20,
  MockFuturesMarket,
  MockFuturesMarketManager,
  OtusCloneFactory,
  OtusController,
  OtusVault,
  OtusVault__factory,
  Strategy__factory,
} from '../../../typechain-types';
import { Strategy, StrategyBase } from '../../../typechain-types/Strategy';

import { LyraMarket } from '@lyrafinance/protocol/dist/test/utils/package/parseFiles';
import { Vault } from '../../../typechain-types/OtusVault';
import { OptionMarket } from '@lyrafinance/protocol/dist/typechain-types';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

const ethMarketKey = '0x7345544800000000000000000000000000000000000000000000000000000000';

const defaultStrategyDetail: StrategyBase.StrategyDetailStruct = {
  hedgeReserve: toBN('.15'), // limit up to 50%
  collatBuffer: toBN('1.2'),
  collatPercent: toBN('.35'),
  minTimeToExpiry: lyraConstants.DAY_SEC,
  maxTimeToExpiry: lyraConstants.WEEK_SEC * 4,
  minTradeInterval: 600,
  gwavPeriod: 600,
  allowedMarkets: [ethMarketKey],
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

const vaultInfo: Vault.VaultInformationStruct = {
  name: 'New Vault',
  tokenName: 'OtusVault Share',
  tokenSymbol: 'Otus VS',
  description: 'Sell ETH Puts',
  isPublic: true,
  performanceFee: toBN('0'),
  managementFee: toBN('0'),
};

const spotPrice = toBN('3000');

let boardId = toBN('0');

const boardParameter = {
  expiresIn: lyraConstants.DAY_SEC * 7,
  baseIV: '0.8',
  strikePrices: ['2500', '2600', '2700', '2800', '2900', '3000', '3100'],
  skews: ['1.3', '1.2', '1.1', '1', '1.1', '1.3', '1.3'],
};

const initialPoolDeposit = toBN('1500000'); // 1.5m

describe('Short Put No Hedge Strategy Test', async () => {
  // mocked tokens
  let susd: MockERC20;
  let seth: MockERC20;

  let lyraTestSystem: TestSystemContractsType;
  let lyraMarket: LyraMarket;

  // primary contracts
  let futuresMarketsManager: MockFuturesMarketManager;
  let futuresMarket: MockFuturesMarket;

  let lyraBaseETH: LyraBase;
  let otusController: OtusController;
  let otusCloneFactory: OtusCloneFactory;
  let vault: OtusVault;
  let strategy: Strategy;
  // cloned contracts owned by manager
  let managersVault: OtusVault;
  let managersStrategy: Strategy;

  // roles
  let otusMultiSig: SignerWithAddress;

  let deployer: SignerWithAddress;
  let manager: SignerWithAddress; // this is the supervisor

  let randomUser: SignerWithAddress;
  let randomUser2: SignerWithAddress;
  let keeper: SignerWithAddress;

  before('assign roles', async () => {
    const addresses = await ethers.getSigners();
    deployer = addresses[0];
    manager = addresses[1]; // supervisor
    otusMultiSig = addresses[3];
    randomUser = addresses[4];
    randomUser2 = addresses[5];
    keeper = addresses[6];
  });

  before('deploy lyra, synthetix and other', async () => {
    const pricingParams: PricingParametersStruct = {
      ...DEFAULT_PRICING_PARAMS,
      standardSize: toBN('10'),
      spotPriceFeeCoefficient: toBN('0.001'),
    };

    lyraTestSystem = await TestSystem.deploy(deployer, false, false, { pricingParams });

    await TestSystem.seed(deployer, lyraTestSystem, {
      initialBoard: boardParameter,
      initialBasePrice: spotPrice,
      initialPoolDeposit: initialPoolDeposit,
    });

    const MockFuturesMarketFactory = await ethers.getContractFactory('MockFuturesMarket');
    futuresMarket = (await MockFuturesMarketFactory.connect(deployer).deploy()) as MockFuturesMarket;

    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    // susd = (await MockERC20Factory.connect(deployer).deploy('sUSD', 'sUSD', toBN('100000000'))) as MockERC20;
    susd = lyraTestSystem.snx.quoteAsset as MockERC20;

    const MockFuturesMarketManagerFactory = await ethers.getContractFactory('MockFuturesMarketManager');
    futuresMarketsManager = (await MockFuturesMarketManagerFactory.connect(
      deployer,
    ).deploy()) as MockFuturesMarketManager;

    await futuresMarketsManager.connect(deployer).addMarket(ethMarketKey, futuresMarket.address);

    const LyraBaseETHFactory = await ethers.getContractFactory('LyraBase', {
      libraries: { BlackScholes: lyraTestSystem.blackScholes.address },
    });

    const lyraMarket = getMarketDeploys('kovan-ovm', 'sETH');

    lyraBaseETH = (await LyraBaseETHFactory.connect(deployer).deploy(
      ethMarketKey,
      lyraTestSystem.synthetixAdapter.address, // synthetix adapter
      lyraTestSystem.optionToken.address,
      lyraTestSystem.optionMarket.address,
      lyraTestSystem.liquidityPool.address,
      lyraTestSystem.shortCollateral.address,
      lyraTestSystem.optionMarketPricer.address,
      lyraTestSystem.optionGreekCache.address,
      lyraTestSystem.GWAVOracle.address,
    )) as LyraBase;

    const boards = await lyraTestSystem.optionMarket.getLiveBoards();

    boardId = boards[0];

    await lyraTestSystem.optionGreekCache.updateBoardCachedGreeks(boardId);

    await lyraEvm.fastForward(600);
  });

  before('deploy vault, strategy, and clone factory contracts', async () => {
    const OtusController = await ethers.getContractFactory('OtusController');

    otusController = (await OtusController.connect(otusMultiSig).deploy(
      lyraTestSystem.lyraRegistry.address,
      futuresMarketsManager.address, // futuresmarketmanager
      keeper.address,
    )) as OtusController;

    const OtusVaultFactory = await ethers.getContractFactory('OtusVault');
    vault = (await OtusVaultFactory.connect(otusMultiSig).deploy(86400 * 7)) as OtusVault;

    const StrategyBaseFactory = await ethers.getContractFactory('Strategy');

    strategy = (await StrategyBaseFactory.connect(otusMultiSig).deploy(susd.address)) as Strategy;

    const OtusCloneFactory = await ethers.getContractFactory('OtusCloneFactory');
    otusCloneFactory = (await OtusCloneFactory.connect(otusMultiSig).deploy(
      vault.address,
      strategy.address,
      otusController.address,
    )) as OtusCloneFactory;

    // set settings on otuscontroller => clonefactory / futuresmarkest / lyrabase
    await otusController.connect(otusMultiSig).setOtusCloneFactory(otusCloneFactory.address);

    // dont need to set futures market anymore
    await otusController.connect(otusMultiSig).setFuturesMarkets(futuresMarket.address, ethMarketKey);

    const lyraMarket = getMarketDeploys('kovan-ovm', 'sETH');

    await otusController
      .connect(otusMultiSig)
      .setLyraAdapter(lyraBaseETH.address, lyraTestSystem.optionMarket.address, ethMarketKey);
  });

  before('initialize vault and strategy', async () => {
    const vaultParams: Vault.VaultParamsStruct = {
      decimals: 18,
      cap: toBN('5000000'),
      asset: susd.address,
    };

    await otusController.connect(manager).createOptionsVault(vaultInfo, vaultParams, defaultStrategyDetail);

    const vaultCloneAddress = await otusController.vaults(manager.address, 0);
    managersVault = (await ethers.getContractAt(OtusVault__factory.abi, vaultCloneAddress)) as OtusVault;

    expect(managersVault.address).to.not.be.eq(ZERO_ADDRESS);

    const strategyCloneAddress = await otusController.connect(manager)._getStrategies([managersVault.address]);
    managersStrategy = (await ethers.getContractAt(Strategy__factory.abi, strategyCloneAddress[0])) as Strategy;

    expect(managersStrategy.address).to.not.be.eq(ZERO_ADDRESS);
  });

  describe('check strategy setup', async () => {
    it('it should set the strategy correctly on the vault', async () => {
      const strategy = await managersVault.connect(manager).strategy();
      expect(strategy).to.be.eq(managersStrategy.address);
    });

    it('deploys with correct vault', async () => {
      expect(await managersStrategy.vault()).to.be.eq(managersVault.address);
    });
  });

  describe('set strategy, set static hedge', async () => {
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

    it('manager can start round 1 - no board selected', async () => {
      const vaultStartingBalance = await susd.balanceOf(managersVault.address);
      await managersVault.connect(manager).startNextRound();
      const sharesBalance = await managersVault.connect(manager).balanceOf(randomUser2.address);
      expect(sharesBalance.eq(toBN('0'))).to.be.true;

      const strategyBalance = await susd.balanceOf(managersStrategy.address);

      expect(strategyBalance.gt(toBN('0'))).to.be.true;
      expect(strategyBalance.eq(vaultStartingBalance)).to.be.false;
    });

    it('manager can immediately close round', async () => {
      const state = await managersVault.vaultState();
      expect(state.roundInProgress).to.be.true;

      await managersVault.connect(manager).closeRound();
      const updatedState = await managersVault.vaultState();
      expect(updatedState.roundInProgress).to.be.false;

      const strategyBalance = await susd.balanceOf(managersStrategy.address);
      expect(strategyBalance.eq(toBN('0'))).to.be.true;
    });

    it('can update hedge type', async () => {
      const _hedgeTypeBefore = await managersStrategy.connect(manager).hedgeType();
      expect(_hedgeTypeBefore == 0).to.be.true;
      await managersStrategy.connect(manager).setHedgeStrategyType(2);
      const _hedgeType = await managersStrategy.connect(manager).hedgeType();

      expect(_hedgeType == 2).to.be.true;
    });

    it('can set strike strategies', async () => {
      await managersStrategy.connect(manager).setStrikeStrategyDetail([defaultStrikeStrategyDetail]);

      const currentStrikeStrategy = await managersStrategy
        .connect(manager)
        .currentStrikeStrategies(defaultStrikeStrategyDetail.optionType);

      await expect(currentStrikeStrategy.maxVol.eq(defaultStrikeStrategyDetail.maxVol)).to.be.true;
    });

    it('should revert when delta out of range', async () => {
      await lyraEvm.fastForward(lyraConstants.DAY_SEC);
      await managersVault.connect(manager).startNextRound();

      const strikeStrategy: StrategyBase.StrikeTradeStruct = {
        market: ethMarketKey,
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[1],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };

      await expect(managersVault.connect(manager).trade([strikeStrategy])).to.be.revertedWith('TradeDeltaOutOfRange');
    });

    it('should trade single strike', async () => {
      const state = await managersVault.vaultState();
      const strikeStrategy: StrategyBase.StrikeTradeStruct = {
        market: ethMarketKey,
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[2],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };
      const trade = await managersVault.connect(manager).trade([strikeStrategy]);

      const vaultStateAfter = await managersVault.vaultState();
      console.log({ vaultStateAfter });

      const strategySUSDBalanceAfter = await susd.balanceOf(managersStrategy.address);
      console.log({ strategySUSDBalanceAfter });
    });

    it('should delta hedge after trade', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2000'), 'sETH');

      const strikeTrade = await managersStrategy.activeStrikeTrades(0);

      const _checkDeltaByPositionId = await managersStrategy._checkDeltaByPositionId(
        ethMarketKey,
        strikeTrade.positionId,
      );

      const size = parseFloat(formatUnits(strikeTrade.size));
      const formattedDelta = parseFloat(formatUnits(_checkDeltaByPositionId));

      const deltaToHedge = toBN((size * formattedDelta).toString());

      await managersVault.connect(keeper).staticDeltaHedge(strikeTrade.market, deltaToHedge, strikeTrade.positionId);
    });

    it('should close hedge at round close', async () => {
      await managersVault.connect(manager).closeRound();
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
