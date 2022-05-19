import { lyraConstants, lyraEvm, TestSystem } from '@lyrafinance/protocol';
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
  MockFuturesMarket,
  MockFuturesMarketManager,
  MockOptionToken,
  MockERC20, 
  Supervisor__factory, 
  OtusVault__factory, 
  Strategy__factory
} from '../../../typechain-types';

const defaultStrategyDetail: Strategy.DetailStruct = {
  collatBuffer: toBN('1.2'),
  collatPercent: toBN('1'),
  maxVolVariance: toBN('0.1'),
  gwavPeriod: 600,
  minTimeToExpiry: lyraConstants.DAY_SEC,
  maxTimeToExpiry: lyraConstants.WEEK_SEC * 2,
  targetDelta: toBN('0.2').mul(-1),
  maxDeltaGap: toBN('0.05'), // accept delta from 0.15~0.25
  minVol: toBN('0.8'), // min vol to sell. (also used to calculate min premium for call selling vault)
  maxVol: toBN('1.3'), // max vol to sell.
  size: toBN('2'),
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
  let otus: MockERC20;

  let lyraTestSystem: TestSystemContractsType;

  // mocked contract for testing
  let optionToken: MockOptionToken;

  // primary contracts
  let futuresMarket: MockFuturesMarket;
  let futuresMarketManager: MockFuturesMarketManager;  
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
    manager = addresses[1]; // supervisor; 
    treasury = addresses[2];
    otusMultiSig = addresses[3];
    randomUser = addresses[8];
    randomUser2 = addresses[9];
    keeper = addresses[10]
  });

  before('deploy lyra core', async () => {
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

    // assign test tokens
    seth = lyraTestSystem.snx.baseAsset as MockERC20;
    susd = lyraTestSystem.snx.quoteAsset as MockERC20;

    // set boardId
    const boards = await lyraTestSystem.optionMarket.getLiveBoards();
    boardId = boards[0];

    await lyraTestSystem.optionGreekCache.updateBoardCachedGreeks(boardId);

    // fast forward do vol gwap can work
    await lyraEvm.fastForward(600);
  });

  before('deploy Mock Synthetix Futures Market and Manager', async () => {
    const futuresMarketFactory = await ethers.getContractFactory('MockFuturesMarket');
    futuresMarket = (await futuresMarketFactory.deploy()) as MockFuturesMarket;

    const futuresMarketManagerFactory = await ethers.getContractFactory('MockFuturesMarketManager');
    futuresMarketManager = (await futuresMarketManagerFactory.deploy()) as MockFuturesMarketManager;
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

  before('deploy Otus Token', async () => {
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    otus = (await MockERC20Factory.deploy('Otus Finance', 'OTUS', toBN('1000000'))) as MockERC20;
  })

  before('deploy supervisor, vault, strategy, and clone factory contracts', async () => {
    const SupervisorFactory = await ethers.getContractFactory('Supervisor');
    supervisor = (await SupervisorFactory.connect(otusMultiSig).deploy(
      treasury.address,
      otus.address,
    )) as Supervisor;

    const OtusVaultFactory = await ethers.getContractFactory('OtusVault');

    vault = (await OtusVaultFactory.connect(otusMultiSig).deploy(
      futuresMarket.address,
      86400 * 7,
      keeper.address
    )) as OtusVault;

    const StrategyFactory = await ethers.getContractFactory('Strategy', {
      libraries: {
        BlackScholes: lyraTestSystem.blackScholes.address,
      },
    });

    strategy = (await StrategyFactory.connect(otusMultiSig).deploy(
      lyraTestSystem.GWAVOracle.address,
      lyraTestSystem.synthetixAdapter.address,
      lyraTestSystem.optionMarketPricer.address,
      lyraTestSystem.optionGreekCache.address,
      lyraTestSystem.basicFeeCounter.address as string
    )) as Strategy;

    const OtusCloneFactory = await ethers.getContractFactory('OtusCloneFactory');
    otusCloneFactory = (await OtusCloneFactory.connect(otusMultiSig).deploy(
      supervisor.address,
      vault.address,
      strategy.address, 
      lyraTestSystem.lyraRegistry.address, 
      futuresMarketManager.address
    )) as OtusCloneFactory;
  });

  before('initialize supervisor with a manager', async () => {
    await otusCloneFactory.connect(manager).cloneSupervisor(); 
    const supervisorCloneAddress = await otusCloneFactory.supervisors(manager.address);
    managersSupervisor = await ethers.getContractAt(Supervisor__factory.abi, supervisorCloneAddress) as Supervisor; 
    expect(managersSupervisor.address).to.not.be.eq(ZERO_ADDRESS);
  });

  before('initialize vault and strategy with supervisor', async () => {
    const cap = ethers.utils.parseEther('5000000'); // 5m USD as cap
    const decimals = 18;

    await otusCloneFactory.connect(manager).cloneVaultWithStrategy(
      susd.address, seth.address,
      'OtusVault Share', 'Otus VS', true, 0, {
        decimals,
        cap, 
        asset: susd.address
      }
    ); 

    const vaultCloneAddress = await otusCloneFactory.vaults(managersSupervisor.address);
    managersVault = await ethers.getContractAt(OtusVault__factory.abi, vaultCloneAddress) as OtusVault; 
    expect(managersVault.address).to.not.be.eq(ZERO_ADDRESS);

    const strategyCloneAddress = await otusCloneFactory.connect(manager)._getStrategy(vaultCloneAddress);
    managersStrategy = await ethers.getContractAt(Strategy__factory.abi, strategyCloneAddress) as Strategy; 
    expect(managersStrategy.address).to.not.be.eq(ZERO_ADDRESS);
  });

  before('check strategy was set for vault', async () => {
    await managersVault.connect(manager).setStrategy(managersStrategy.address)
  });

  describe('check strategy setup', async () => {

    it('it should set the strategy correctly on the vault', async () => {
      const strategy = await managersVault.connect(manager).strategy(); 
      expect(strategy).to.be.eq(managersStrategy.address);
    })

    it('deploys with correct vault', async () => {
      expect(await managersStrategy.vault()).to.be.eq(managersVault.address);
    });

    it('deploys with correct optionType - default', async () => {
      expect(await managersStrategy.connect(manager).optionType()).to.be.eq(TestSystem.OptionType.LONG_CALL);
    });

    it('deploys with correct gwavOracle', async () => {
      expect(await managersStrategy.gwavOracle()).to.be.eq(lyraTestSystem.GWAVOracle.address);
    });

    it('it should set the correct optionType from vaultOptionTypes', async () => {
      expect(await managersStrategy.connect(manager).optionType()).to.be.eq(TestSystem.OptionType.SHORT_PUT_QUOTE);
    });

  });

  describe('setStrategy', async () => {
    it('setting strategy should correctly update strategy variables', async () => {

      const owner = await managersStrategy.owner();

      await managersStrategy.connect(manager).setStrategy(
        defaultStrategyDetail, 
        defaultHedgeDetail
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
    });

    it('will not trade when delta is out of range"', async () => {
      // 2500, 2600, 2800 are bad strike based on delta
      await expect(managersVault.connect(manager).trade(strikes[0])).to.be.revertedWith('invalid strike');
      await expect(managersVault.connect(manager).trade(strikes[1])).to.be.revertedWith('invalid strike');
      await expect(managersVault.connect(manager).trade(strikes[4])).to.be.revertedWith('invalid strike');
    });

    it('should revert when min premium < premium calculated with min vol', async () => {
      // 3550 is good strike with reasonable delta, but won't go through because premium will be too low.
      await expect(managersVault.connect(manager).trade(strikes[3])).to.be.revertedWith('TotalCostOutsideOfSpecifiedBounds');
    });

    it('should trade when delta and vol are within range', async () => {
      const strikeObj = await strikeIdToDetail(lyraTestSystem.optionMarket, strikes[2]);
      const [collateralToAdd] = await managersStrategy.connect(manager).getRequiredCollateral(strikeObj);

      const vaultStateBefore = await managersVault.connect(manager).vaultState();
      const strategySUSDBalance = await susd.balanceOf(managersStrategy.address);
      console.log({ vaultStateBefore, strategySUSDBalance })

      // 3400 is a good strike
      await managersVault.connect(manager).trade(strikeObj.id);

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
      await expect(managersVault.connect(manager).trade(strikes[2])).to.be.revertedWith('min time interval not passed');
    });

    it('should be able to trade a higher strike if spot price goes up', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('3200'), 'sETH');

      // triger with new strike (3550)
      await managersVault.connect(manager).trade(strikes[4]);

      // check that active strikes are updated
      const storedStrikeId = await managersStrategy.activeStrikeIds(1);
      expect(storedStrikeId.eq(strikes[4])).to.be.true;
      const positionId = await managersStrategy.strikeToPositionId(storedStrikeId);
      const [position] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      expect(position.amount.eq(defaultStrategyDetail.size)).to.be.true;
    });

    it('should revert when trying to trade the old strike', async () => {
      await lyraEvm.fastForward(600);
      await expect(managersVault.connect(manager).trade(strikes[3])).to.be.revertedWith('invalid strike');
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


    it('should open a hedge position when strike price is under limit', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('2000'), 'sETH');

    });

    it('should not open a hedge position after max hedge attempts reaches limit', async () => {

    });

    it('should hedge the correct percentage compared to collateral', async () => {

    })

    it('should hedge with the leverage size set in strategy', async () => {

    });

    it('should close position when stop loss limit and increase hedge attempt', async () => {

    });

    it('position should be in profit with current price under strike price', async () => {

    });

    it('hedge position and option position should be closed within loss limit percentage', async () => {

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
    });

    it('start the next round', async () => {
      await lyraEvm.fastForward(lyraConstants.DAY_SEC);
      await managersVault.connect(manager).startNextRound(boardId);
      const vs = await managersVault.connect(manager).vaultState();
      console.log({ currentRound2: vs.round });
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
      await managersVault.connect(manager).trade(strikes[2]);

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
      await expect(managersVault.connect(randomUser).reducePosition(positionId, toBN('10000'))).to.be.revertedWith(
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
  return {
    id: strike.id,
    expiry: board.expiry,
    strikePrice: strike.strikePrice,
    skew: strike.skew,
    boardIv: board.iv,
  };
}