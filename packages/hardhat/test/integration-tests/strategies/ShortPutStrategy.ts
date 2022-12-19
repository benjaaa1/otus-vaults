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
  OtusVault,
  Strategy,
  MockFuturesMarket,
  MockERC20,
  OtusVault__factory,
  Strategy__factory,
  MockFuturesMarketManager,
  LyraBase,
  OtusController,
  StrategyBase
} from '../../../typechain-types';
import { Vault } from '../../../typechain-types/OtusVault';
import { boardParameter, defaultStrategyDetail, defaultStrikeStrategyDetail, defaultStrikeStrategyDetailCall, initialPoolDeposit, spotPrice, vaultInfo } from '../utils/init';
import markets from '../../../constants/synthetix/markets.json';

describe('Strategy integration test', async () => {
  // mocked tokens
  let susd: MockERC20;
  let seth: MockERC20;
  let otus: MockERC20;

  let lyraTestSystem: TestSystemContractsType;
  let boardId = toBN('0');

  // synthetix futures contracts
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
  let deployer: SignerWithAddress;
  let otusMultiSig: SignerWithAddress;
  let manager: SignerWithAddress;
  let keeper: SignerWithAddress;

  // users
  let randomUser1: SignerWithAddress;
  let randomUser2: SignerWithAddress;

  before('assign roles', async () => {
    const addresses = await ethers.getSigners();
    deployer = addresses[0];
    manager = addresses[1];
    otusMultiSig = addresses[2];
    keeper = addresses[3];

    randomUser1 = addresses[4];
    randomUser2 = addresses[5];

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

    // const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    susd = lyraTestSystem.snx.quoteAsset as MockERC20;

    const MockFuturesMarketFactory = await ethers.getContractFactory('MockFuturesMarket');
    futuresMarket = (await MockFuturesMarketFactory.connect(deployer).deploy()) as MockFuturesMarket;

    const MockFuturesMarketManagerFactory = await ethers.getContractFactory('MockFuturesMarketManager');
    futuresMarketsManager = (await MockFuturesMarketManagerFactory.connect(
      deployer,
    ).deploy()) as MockFuturesMarketManager;

    // add market to futures market manager (synthetix)
    await futuresMarketsManager
      .connect(deployer)
      .addMarket(
        markets.ETH,
        futuresMarket.address,
      );

    const LyraBaseETHFactory = await ethers.getContractFactory('LyraBase', {
      libraries: { BlackScholes: lyraTestSystem.blackScholes.address },
    });

    lyraBaseETH = (await LyraBaseETHFactory.connect(deployer).deploy(
      markets.ETH,
      lyraTestSystem.synthetixAdapter.address,
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
      keeper.address,
      [markets.ETH],
      [lyraBaseETH.address],
      [lyraTestSystem.optionMarket.address],
      [futuresMarket.address]
    )) as OtusController;

    const OtusVaultFactory = await ethers.getContractFactory('OtusVault');
    vault = (await OtusVaultFactory.connect(otusMultiSig).deploy(86400 * 7)) as OtusVault;

    const StrategyBaseFactory = await ethers.getContractFactory('Strategy');
    strategy = (await StrategyBaseFactory.connect(otusMultiSig).deploy(
      susd.address,
      otusController.address
    )) as Strategy;

    const OtusCloneFactory = await ethers.getContractFactory('OtusCloneFactory');
    otusCloneFactory = (await OtusCloneFactory.connect(otusMultiSig).deploy(
      vault.address,
      strategy.address,
      otusController.address,
    )) as OtusCloneFactory;

    await otusController.connect(otusMultiSig).setOtusCloneFactory(otusCloneFactory.address);

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

    await managersStrategy.connect(manager).setStrikeStrategyDetail([defaultStrikeStrategyDetail, defaultStrikeStrategyDetailCall]);
    const _optionType = defaultStrikeStrategyDetailCall.optionType;
    const strikeStrategyForOptionType = await managersStrategy.currentStrikeStrategies(_optionType);
    await expect(strikeStrategyForOptionType.targetDelta).to.eq(defaultStrikeStrategyDetailCall.targetDelta);

  });

  describe('start the first round', async () => {

    let strikes: BigNumber[] = [];

    before('create fake susd for users', async () => {
      await susd.mint(randomUser1.address, toBN('100000'));
      await susd.mint(randomUser2.address, toBN('100000'));
    });

    before('set strikes array', async () => {
      strikes = await lyraTestSystem.optionMarket.getBoardStrikes(boardId);
    });

    it('users should be able to deposit to vault', async () => {
      await susd.connect(randomUser1).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser1).deposit(toBN('100000'));

      await susd.connect(randomUser2).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser2).deposit(toBN('100000'));

      const state = await managersVault.vaultState();
      expect(state.totalPending.eq(toBN('200000'))).to.be.true;
    })

    it('manager can start round 1', async () => {
      await managersVault.connect(manager).startNextRound();
    });

    it('will not trade when delta is out of range"', async () => {

      const strikeStrategy: StrategyBase.StrikeTradeStruct = {
        market: markets.ETH,
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[1],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };

      await expect(managersVault.connect(manager).trade([strikeStrategy])).to.be.revertedWith('TradeDeltaOutOfRange');
    });

    it('should revert when min premium < premium calculated with min vol', async () => {

      const strikeStrategy: StrategyBase.StrikeTradeStruct = {
        market: markets.ETH,
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[3],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };

      await expect(managersVault.connect(manager).trade([strikeStrategy])).to.be.revertedWith('TotalCostOutsideOfSpecifiedBounds');
    });

    it('should successfully trade multiple short put options', async () => {
      const strikeStrategy1st: StrategyBase.StrikeTradeStruct = {
        market: markets.ETH,
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[2],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };

      const strikeStrategy2nd: StrategyBase.StrikeTradeStruct = {
        market: markets.ETH,
        optionType: defaultStrikeStrategyDetail.optionType,
        strikeId: strikes[4],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };

      await managersVault.connect(manager).trade([strikeStrategy1st, strikeStrategy2nd]);
      const activeStrikeTrades1 = await managersStrategy.activeStrikeTrades(0);

      const activeStrikeTrades2 = await managersStrategy.activeStrikeTrades(1);

      expect(activeStrikeTrades1.positionId).to.be.eq(1);
      expect(activeStrikeTrades2.positionId).to.be.eq(2);

    });

    it('should trade additional higher strike when spot price up', async () => {

    })

    it('should revert closed when positions open', async () => {

    })

    it('should be able to close round after options are settled', async () => {

    })

  });

});
