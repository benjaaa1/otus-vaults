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
import { boardParameter, defaultDynamicDeltaHedgeDetail, defaultStrategyDetail, defaultStrikeStrategyDetail, defaultStrikeStrategyDetailCall, initialPoolDeposit, spotPrice, vaultInfo } from '../utils/init';
import markets from '../../../constants/synthetix/markets.json';

describe('Strategy short call dynamic hedge test', async () => {
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
        optionType: defaultStrikeStrategyDetailCall.optionType,
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
        optionType: defaultStrikeStrategyDetailCall.optionType,
        strikeId: strikes[3],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };

      await expect(managersVault.connect(manager).trade([strikeStrategy])).to.be.revertedWith('TotalCostOutsideOfSpecifiedBounds');
    });

    it('should successfully trade multiple short call options', async () => {
      const strikeStrategy1st: StrategyBase.StrikeTradeStruct = {
        market: markets.ETH,
        optionType: defaultStrikeStrategyDetailCall.optionType,
        strikeId: strikes[2],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };

      const strikeStrategy2nd: StrategyBase.StrikeTradeStruct = {
        market: markets.ETH,
        optionType: defaultStrikeStrategyDetailCall.optionType,
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

    it('should revert additional strike when spot price moves down as delta out of range', async () => {
      await lyraEvm.fastForward(600);
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('950'), 'sETH');

      const strikeStrategy1st: StrategyBase.StrikeTradeStruct = {
        market: markets.ETH,
        optionType: defaultStrikeStrategyDetailCall.optionType,
        strikeId: strikes[3],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };

      await expect(managersVault.connect(manager).trade([strikeStrategy1st])).to.be.revertedWith('TradeDeltaOutOfRange');

    });

    it('should revert closed when positions open', async () => {

      await lyraEvm.fastForward(boardParameter.expiresIn);
      await expect(managersVault.connect(manager).closeRound()).to.be.revertedWith('cannot clear active position');

    })

    it('should be able to close round after options are settled', async () => {

      const susdBalanceBefore = await susd.balanceOf(managersVault.address);
      console.log({ susdBalanceBefore })

      const totalPositions = (await lyraTestSystem.optionToken.nextId()).sub(1).toNumber();

      const idsToSettle = Array.from({ length: totalPositions }, (_, i) => i + 1); // create array of [1... totalPositions]
      await lyraTestSystem.optionMarket.settleExpiredBoard(boardId);
      await lyraTestSystem.shortCollateral.settleOptions(idsToSettle);
      await expect(managersVault.connect(manager).closeRound());

      const susdBalanceAfter = await susd.balanceOf(managersVault.address);
      console.log({ susdBalanceAfter })

    })

  });

  describe('start round 2 with user hedge', async () => {
    let strikes: BigNumber[] = [];

    // let position: any;
    // let strikePrice: BigNumber;
    let positionId: BigNumber;
    // let expiry: BigNumber;
    let snapshot: number;

    before('prepare before new round start', async () => {
      // set price back to initial spot price
      await TestSystem.marketActions.mockPrice(lyraTestSystem, spotPrice, 'sETH');
    });

    before('create new board', async () => {
      await TestSystem.marketActions.createBoard(lyraTestSystem, boardParameter);
      const boards = await lyraTestSystem.optionMarket.getLiveBoards();
      console.log({ boards })

      boardId = boards[0];
    });

    before('set strikes array', async () => {
      strikes = await lyraTestSystem.optionMarket.getBoardStrikes(boardId);
    });

    it('update the hedge type', async () => {
      await managersStrategy.connect(manager).setHedgeStrategyType(2);
      const hedgeType = await managersStrategy.hedgeType();
      expect(hedgeType).to.be.eq(2);
    })

    it('set dynamic hedge strategy', async () => {
      await managersStrategy.connect(manager).setHedgeStrategies(defaultDynamicDeltaHedgeDetail);
      const dynamicHedgeStrategy = await managersStrategy.dynamicHedgeStrategy();
      console.log({ dynamicHedgeStrategy })
      expect(dynamicHedgeStrategy.threshold).to.be.eq(toBN('1'));

    })

    it('start the next round', async () => {
      await lyraEvm.fastForward(lyraConstants.DAY_SEC);

      await managersVault.connect(manager).startNextRound();
    });

    it('should be able to make a trade', async () => {

      snapshot = await lyraEvm.takeSnapshot();

      let vaultSUSDBalanceBefore = await susd.balanceOf(managersVault.address);
      console.log({ vaultSUSDBalanceBefore })
      const strikeStrategy1st: StrategyBase.StrikeTradeStruct = {
        market: markets.ETH,
        optionType: defaultStrikeStrategyDetailCall.optionType,
        strikeId: strikes[2],
        size: toBN('7'),
        positionId: toBN('0'),
        strikePrice: toBN('0'),
      };

      await managersVault.connect(manager).trade([strikeStrategy1st]);
      const activeStrikeTrades1 = await managersStrategy.activeStrikeTrades(0);
      console.log({ activeStrikeTrades1 })
      // position id's are not cleared cuurrently -bug 
      positionId = activeStrikeTrades1.positionId;
      expect(activeStrikeTrades1.positionId).to.be.eq(1);
    })

    // await managersVault.connect(manager).trade(strikes[2]);

    // [strikePrice, expiry] = await lyraTestSystem.optionMarket.getStrikeAndExpiry(strikes[2]);
    // positionId = await managersStrategy.strikeToPositionId(strikes[2]);
    // position = (await lyraTestSystem.optionToken.getOptionPositions([positionId]))[0];

    // it('should recieve premium', async () => {
    //   const strategySUDCBalanceAfter = await susd.balanceOf(managersStrategy.address);
    //   console.log({ strategySUSDBalanceBefore, strategySUDCBalanceAfter })
    //   expect(strategySUDCBalanceAfter.sub(strategySUSDBalanceBefore).gt(0)).to.be.true;
    // });

    // determined by keeper checking on schedule
    it('should open a hedge position when option is out of delta threshold', async () => {
      // this position delta is wrong  
      // needs to multiply the contract size too and 
      // be negative when its's a short call, positive when its a short put
      // as in that's how much money we're losing 
      // the sign (- or +) shows how to hedge it
      // on a short call (-.7) means we need to buy .7 eth 
      // on a short put (+.7) means we need to sell -.7
      const _positionDelta = await managersStrategy._checkDeltaByPositionId(markets.ETH, positionId);
      console.log({ _positionDelta });

      // update price       
      // await TestSystem.marketActions.mockPrice(lyraTestSystem, spotPrice, 'sETH');

      // keeper grabs position id of position that is out of delta hedge 

      // calculates the delta required to hedge 

      await managersVault.connect(keeper).dynamicDeltaHedge(markets.ETH, _positionDelta, positionId);
    });

  })

  // describe('start round 2', async () => {
  //   let strikes: BigNumber[] = [];
  //   let position: any;
  //   let strikePrice: BigNumber;
  //   let positionId: BigNumber;
  //   let expiry: BigNumber;
  //   let snapshot: number;
  //   let strategySUSDBalanceBefore: BigNumber;

  //   before('prepare before new round start', async () => {
  //     // set price back to initial spot price
  //     await TestSystem.marketActions.mockPrice(lyraTestSystem, spotPrice, 'sETH');

  //     // initiate withdraw for later test
  //     const balance2 = await managersVault.connect(randomUser2).shareBalances(randomUser2.address);
  //     console.log({ balance2 })
  //     await managersVault.connect(randomUser2).initiateWithdraw(toBN('50000'));
  //     const vs = await managersVault.connect(randomUser2).vaultState();
  //     console.log({ currentRound: vs.round });
  //   });

  //   before('create new board', async () => {
  //     await TestSystem.marketActions.createBoard(lyraTestSystem, boardParameter);
  //     const boards = await lyraTestSystem.optionMarket.getLiveBoards();
  //     boardId = boards[0];
  //   });

  //   it('start the next round', async () => {
  //     await lyraEvm.fastForward(lyraConstants.DAY_SEC);
  //     await managersVault.connect(manager).startNextRound(boardId);
  //     const vs = await managersVault.connect(manager).vaultState();
  //     console.log({ currentRound2: vs.round });
  //   });

  //   before('should be able to complete the withdraw', async () => {
  //     const susdBefore = await seth.balanceOf(randomUser2.address);

  //     await managersVault.connect(randomUser2).completeWithdraw();

  //     const susdAfter = await susd.balanceOf(randomUser2.address);

  //     expect(susdAfter.sub(susdBefore).gt(toBN('50000'))).to.be.true;
  //   });

  //   beforeEach(async () => {
  //     snapshot = await lyraEvm.takeSnapshot();

  //     strategySUSDBalanceBefore = await susd.balanceOf(managersStrategy.address);
  //     await managersVault.connect(manager).trade(strikes[2]);

  //     [strikePrice, expiry] = await lyraTestSystem.optionMarket.getStrikeAndExpiry(strikes[2]);
  //     positionId = await managersStrategy.strikeToPositionId(strikes[2]);
  //     position = (await lyraTestSystem.optionToken.getOptionPositions([positionId]))[0];
  //   });

  //   afterEach(async () => {
  //     await lyraEvm.restoreSnapshot(snapshot);
  //   });

  //   it('should recieve premium', async () => {
  //     const strategySUDCBalanceAfter = await susd.balanceOf(managersStrategy.address);
  //     expect(strategySUDCBalanceAfter.sub(strategySUSDBalanceBefore).gt(0)).to.be.true;
  //   });

  //   it('should revert when trying to reduce a safe position', async () => {
  //     const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry);
  //     expect(fullCloseAmount).to.be.eq(0);
  //     await expect(managersVault.connect(randomUser).reducePosition(positionId, toBN('10000'))).to.be.revertedWith(
  //       'amount exceeds allowed close amount',
  //     );
  //   });

  //   it('reduce full position if unsafe position + delta is in range', async () => {
  //     // 13% crash
  //     await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2600'), 'sETH');
  //     const positionId = await managersStrategy.strikeToPositionId(strikes[2]); // 2700 strike
  //     const preReduceBal = await susd.balanceOf(managersStrategy.address);

  //     const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry.sub(10)); //account for time passing
  //     expect(fullCloseAmount).to.be.gt(0);
  //     await managersVault.connect(randomUser).reducePosition(positionId, fullCloseAmount);
  //     const postReduceBal = await susd.balanceOf(managersStrategy.address);
  //     expect(postReduceBal).to.be.lt(preReduceBal);
  //   });

  //   it('partially reduce position if unsafe position + delta is in range', async () => {
  //     await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2600'), 'sETH');
  //     const preReduceBal = await susd.balanceOf(managersStrategy.address);

  //     const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry.sub(10)); //account for time passing
  //     expect(fullCloseAmount).to.be.gt(0);
  //     await managersVault.connect(randomUser).reducePosition(positionId, fullCloseAmount.div(2));
  //     const postReduceBal = await susd.balanceOf(managersStrategy.address);
  //     expect(postReduceBal).to.be.lt(preReduceBal);
  //   });

  //   it('revert reduce position if unsafe position + close amount too large', async () => {
  //     await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2250'), 'sETH');
  //     const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry.sub(10)); //account for time passing
  //     expect(fullCloseAmount).to.be.gt(0);
  //     await expect(managersVault.connect(randomUser).reducePosition(positionId, fullCloseAmount.mul(2))).to.be.revertedWith(
  //       'amount exceeds allowed close amount',
  //     );
  //   });

  //   it('partially reduce position with force close if delta out of range', async () => {
  //     await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2000'), 'sETH');

  //     const [positionBefore] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

  //     const fullCloseAmount = await managersStrategy.getAllowedCloseAmount(position, strikePrice, expiry.sub(10)); //account for time passing
  //     expect(fullCloseAmount).to.be.gt(0);

  //     // send strategy some usdc so they can successfully reduce position
  //     await susd.mint(managersStrategy.address, toBN('50000'));

  //     await managersVault.connect(randomUser).reducePosition(positionId, fullCloseAmount.div(2));
  //     const [positionAfter] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

  //     expect(positionBefore.amount.sub(positionAfter.amount)).to.be.gt(0);
  //   });

  //   it('should open a hedge position when strike price is under limit', async () => {

  //   });

  //   it('should not open a hedge position after max hedge attempts reaches limit', async () => {

  //   });

  //   it('should hedge the correct percentage compared to collateral', async () => {

  //   })

  //   it('should hedge with the leverage size set in strategy', async () => {

  //   });

  //   it('should close position when stop loss limit and increase hedge attempt', async () => {

  //   });

  //   it('position should be in profit with current price under strike price', async () => {

  //   });

  //   it('hedge position and option position should be closed within loss limit percentage', async () => {

  //   });

  // });
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