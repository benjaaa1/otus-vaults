import { lyraConstants, lyraEvm, TestSystem } from '@lyrafinance/core';
import { toBN } from '@lyrafinance/core/dist/scripts/util/web3utils';
import { TestSystemContractsType } from '@lyrafinance/core/dist/test/utils/deployTestSystem';
import { OptionMarket } from '@lyrafinance/core/dist/typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { OtusCloneFactory, Supervisor, OtusVault, Strategy, MockFuturesMarket, MockERC20, Supervisor__factory, OtusVault__factory, Strategy__factory } from '../../../typechain-types';
// import { Strategy } from '../../../typechain-types/Strategy';

const defaultStrategyDetail: Strategy.DetailStruct = {
  collatBuffer: toBN('1.2'),
  collatPercent: toBN('0.8'),
  maxVolVariance: toBN('0.1'),
  gwavPeriod: 600,
  minTimeToExpiry: lyraConstants.DAY_SEC,
  maxTimeToExpiry: lyraConstants.WEEK_SEC * 2,
  targetDelta: toBN('0.2'),
  maxDeltaGap: toBN('0.05'), // accept delta from 0.15~0.25
  minVol: toBN('0.8'), // min vol to sell. (also used to calculate min premium for call selling vault)
  maxVol: toBN('1.3'), // max vol to sell.
  size: toBN('10'),
  minTradeInterval: 600,
};

const defaultHedgeDetail: Strategy.HedgeDetailStruct = {
  hedgePercentage: toBN('1.2'),
  maxHedgeAttempts: toBN('0.8'),
  limitStrikePricePercent: toBN('0.1'),
  leverageSize: toBN('0.1'),
  stopLossLimit: toBN('0.1'),
};

describe('Strategy integration test', async () => {
  // mocked tokens
  let susd: MockERC20;
  let seth: MockERC20;
  let otus: MockERC20;

  let lyraTestSystem: TestSystemContractsType;

  // primary contracts
  let futuresMarket: MockFuturesMarket; 
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

  // testing parameters
  const spotPrice = toBN('3000');
  let boardId = BigNumber.from(0);
  const boardParameter = {
    expiresIn: lyraConstants.DAY_SEC * 7,
    baseIV: '0.9',
    strikePrices: ['2500', '3000', '3200', '3400', '3550'],
    skews: ['1.1', '1', '1.1', '1.3', '1.3'],
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
  });

  before('deploy lyra core', async () => {
    lyraTestSystem = await TestSystem.deploy(deployer, false, false);
    // lyraGlobal = lyraCore.getGlobalContracts('local');

    // lyraETHMarkets = lyraCore.getMarketContracts('local', 'sETH');

    await TestSystem.seed(deployer, lyraTestSystem, {
      initialBoard: boardParameter,
      initialBasePrice: spotPrice,
      initialPoolDeposit: initialPoolDeposit,
    });

    // assign test tokens
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    // seth = lyraTestSystem.snx.baseAsset as MockERC20;
    susd = (await MockERC20Factory.deploy('Synthetix USD', 'sUSD')) as MockERC20;

    // set boardId
    const boards = await lyraTestSystem.optionMarket.getLiveBoards();
    boardId = boards[0];

    await lyraTestSystem.optionGreekCache.updateBoardCachedGreeks(boardId);

    // fast forward do vol gwap can work
    await lyraEvm.fastForward(600);
  });

  before('deploy Mock Synthetix Futures Market', async () => {
    const MockERC20Factory = await ethers.getContractFactory('MockFuturesMarket');
    futuresMarket = (await MockERC20Factory.deploy()) as MockFuturesMarket;
  })

  before('deploy Otus Token', async () => {
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    otus = (await MockERC20Factory.deploy('Otus Finance', 'OTUS')) as MockERC20;
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
    )) as OtusVault;

    const StrategyFactory = await ethers.getContractFactory('Strategy');

    strategy = (await StrategyFactory.connect(otusMultiSig).deploy(
      lyraTestSystem.GWAVOracle.address,
      lyraTestSystem.testCurve.address, // curve swap
      lyraTestSystem.optionToken.address,
      lyraTestSystem.optionMarket.address,
      lyraTestSystem.liquidityPool.address,
      lyraTestSystem.shortCollateral.address,
      lyraTestSystem.synthetixAdapter.address,
      lyraTestSystem.optionMarketPricer.address,
      lyraTestSystem.optionGreekCache.address,
      susd.address, // quote
      susd.address, // base
      lyraTestSystem.basicFeeCounter.address as string,
    )) as Strategy;

    const OtusCloneFactory = await ethers.getContractFactory('OtusCloneFactory');
    otusCloneFactory = (await OtusCloneFactory.connect(otusMultiSig).deploy(
      supervisor.address,
      vault.address,
      strategy.address
    )) as OtusCloneFactory;
  });

  before('initialize supervisor with a manager', async () => {
    await otusCloneFactory.connect(manager)._cloneSupervisor(); 
    const supervisorCloneAddress = await otusCloneFactory.supervisors(manager.address);
    managersSupervisor = await ethers.getContractAt(Supervisor__factory.abi, supervisorCloneAddress) as Supervisor; 
    expect(managersSupervisor.address).to.not.be.empty;
  });

  before('initialize vault with supervisor', async () => {
    const cap = ethers.utils.parseEther('5000');
    const decimals = 18;

    await otusCloneFactory.connect(manager)._cloneVault(
      'OtusVault Share', 'Otus VS',  {
        decimals,
        cap, 
        asset: susd.address
      }
    ); 

    const vaultCloneAddress = await otusCloneFactory.vaults(managersSupervisor.address);
    managersVault = await ethers.getContractAt(OtusVault__factory.abi, vaultCloneAddress) as OtusVault; 
    expect(managersVault.address).to.not.be.empty;
  });

  before('initialize strategy for vault with a supervisor', async () => {
    console.log({ managersVaultAddress: managersVault.address })
    await otusCloneFactory.connect(manager)._cloneStrategy(); 
    const strategyCloneAddress = await otusCloneFactory.strategies(managersVault.address);
    managersStrategy = await ethers.getContractAt(Strategy__factory.abi, strategyCloneAddress) as Strategy; 
    expect(managersStrategy.address).to.not.be.empty;
  });

  before('link strategy to vault', async () => {
    const owner = await managersVault.owner();
    console.log({ owner, manager: manager.address });

    await managersVault.connect(manager).setStrategy(managersStrategy.address);
  });

  describe('check strategy setup', async () => {
    it('deploys with correct vault and optionType', async () => {
      expect(await managersStrategy.vault()).to.be.eq(managersVault.address);
      expect(await managersStrategy.tradeOptionType()).to.be.eq(TestSystem.OptionType.SHORT_CALL_BASE);
      // expect(await managersStrategy.gwavOracle()).to.be.eq(lyraTestSystem.GWAVOracle.address);
    });
  });

  describe('setStrategy', async () => {
    it('setting strategy should correctly update strategy variables', async () => {

      const owner = await managersStrategy.owner();
      console.log({ owner, manager: manager.address });

      // await managersStrategy.connect(manager).setStrategy(defaultStrategyDetail, defaultHedgeDetail);

      // const newStrategy = await strategy.currentStrategy();
      // expect(newStrategy.minTimeToExpiry).to.be.eq(defaultStrategyDetail.minTimeToExpiry);
      // expect(newStrategy.maxTimeToExpiry).to.be.eq(defaultStrategyDetail.maxTimeToExpiry);
      // expect(newStrategy.targetDelta).to.be.eq(defaultStrategyDetail.targetDelta);
      // expect(newStrategy.maxDeltaGap).to.be.eq(defaultStrategyDetail.maxDeltaGap);
      // expect(newStrategy.minVol).to.be.eq(defaultStrategyDetail.minVol);
      // expect(newStrategy.maxVol).to.be.eq(defaultStrategyDetail.maxVol);
      // expect(newStrategy.size).to.be.eq(defaultStrategyDetail.size);
      // expect(newStrategy.minTradeInterval).to.be.eq(defaultStrategyDetail.minTradeInterval);

      // const newHedgeStrategy = await strategy.currentHedgeStrategy();
      // expect(newHedgeStrategy.hedgePercentage).to.be.eq(defaultHedgeDetail.hedgePercentage);
      // expect(newHedgeStrategy.maxHedgeAttempts).to.be.eq(defaultHedgeDetail.maxHedgeAttempts);
      // expect(newHedgeStrategy.limitStrikePricePercent).to.be.eq(defaultHedgeDetail.limitStrikePricePercent);
      // expect(newHedgeStrategy.leverageSize).to.be.eq(defaultHedgeDetail.leverageSize);
      // expect(newHedgeStrategy.stopLossLimit).to.be.eq(defaultHedgeDetail.stopLossLimit);

    });

    // it('should revert if setStrategy is not called by owner', async () => {
    //   await expect(strategy.connect(randomUser).setStrategy(defaultStrategyDetail, defaultHedgeDetail)).to.be.revertedWith(
    //     'Ownable: caller is not the owner',
    //   );
    // });
  });

  describe('start the first round', async () => {
    let strikes: BigNumber[] = [];
    before('create fake susd for users', async () => {
      await susd.mint(randomUser.address, toBN('10000'));
      await susd.mint(randomUser2.address, toBN('10000'));
    });
    before('set strikes array', async () => {
      strikes = await lyraTestSystem.optionMarket.getBoardStrikes(boardId);
    });
    it('user should be able to deposit through vault', async () => {
      // user 1 deposits
      await susd.connect(randomUser).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser).deposit(toBN('5000'));
      // user 2 deposits
      await susd.connect(randomUser2).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser2).deposit(toBN('5000'));

      const state = await managersVault.vaultState();
      expect(state.totalPending.eq(toBN('10000'))).to.be.true;
    });
    it('manager can start round 1', async () => {
      await managersVault.connect(manager).startNextRound(boardId);
    });
    it('will not trade when delta is out of range"', async () => {
      // 2500 is a bad strike because delta is close to 1
      await expect(vault.connect(randomUser).trade(strikes[0])).to.be.revertedWith('invalid strike');

      // 3000 is a bad strike because delta is close to 0.5
      await expect(vault.connect(randomUser).trade(strikes[1])).to.be.revertedWith('invalid strike');

      // 3200 is a bad strike (delta is close to 0.34)
      await expect(vault.connect(randomUser).trade(strikes[2])).to.be.revertedWith('invalid strike');
    });

    it('should revert when min premium < premium calculated with min vol', async () => {
      // 3550 is good strike with reasonable delta, but won't go through because premium will be too low.
      await expect(vault.connect(randomUser).trade(strikes[4])).to.be.revertedWith('TotalCostOutsideOfSpecifiedBounds');
    });

    it('should trade when delta and vol are within range', async () => {
      const strikeObj = await strikeIdToDetail(lyraTestSystem.optionMarket, strikes[3]);
      // const [getRequiredCollateral] = await strategy.getRequiredCollateral(strikeObj);

      // const vaultSatetBefore = await vault.vaultState();
      // const strategySUSDBalance = await susd.balanceOf(strategy.address);

      // // 3400 is a good strike
      // await vault.connect(randomUser).trade(strikes[3]);

      // const strategyBalance = await susd.balanceOf(strategy.address);
      // const vaultSatetAfter = await vault.vaultState();
      // const strategySUDCBalanceAfter = await susd.balanceOf(strategy.address);
      // // strategy shouldn't hold any seth
      // expect(strategyBalance.isZero()).to.be.true;
      // // check state.lockAmount left is updated
      // expect(vaultSatetBefore.lockedAmountLeft.sub(vaultSatetAfter.lockedAmountLeft).eq(collateralToAdd)).to.be.true;
      // // check that we receive sUSD
      // expect(strategySUDCBalanceAfter.sub(strategySUSDBalance).gt(0)).to.be.true;

      // // active strike is updated
      // const storedStrikeId = await strategy.activeStrikeIds(0);
      // expect(storedStrikeId.eq(strikes[3])).to.be.true;

      // // check that position size is correct
      // const positionId = await strategy.strikeToPositionId(storedStrikeId);
      // const [position] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      // expect(position.amount.eq(defaultStrategyDetail.size)).to.be.true;
      // expect(position.collateral.eq(collateralToAdd)).to.be.true;
    });

    it('should revert when user try to trigger another trade during cooldown', async () => {
      await expect(vault.connect(randomUser).trade(strikes[3])).to.be.revertedWith('min time interval not passed');
    });

    it('should be able to trade again after time interval', async () => {
      await lyraEvm.fastForward(600);
      const strikeObj = await strikeIdToDetail(lyraTestSystem.optionMarket, strikes[3]);
      const positionId = await strategy.strikeToPositionId(strikeObj.id);

      // const [collateralToAdd] = await strategy.getRequiredCollateral(strikeObj);
      // const vaultSatetBefore = await vault.vaultState();
      // const [positionBefore] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      // await vault.connect(randomUser).trade(strikes[3]);

      // const vaultSatetAfter = await vault.vaultState();
      // expect(vaultSatetBefore.lockedAmountLeft.sub(vaultSatetAfter.lockedAmountLeft).eq(collateralToAdd)).to.be.true;

      // const [positionAfter] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);
      // expect(positionAfter.amount.sub(positionBefore.amount).eq(defaultStrategyDetail.size)).to.be.true;
    });

    it('should be able to trade a higher strike if spot price goes up', async () => {
      await TestSystem.marketActions.mockPrice(lyraTestSystem, toBN('3150'), 'sETH');

      // triger with new strike (3550)
      await vault.connect(randomUser).trade(strikes[4]);

      // check that active strikes are updated
      const storedStrikeId = await strategy.activeStrikeIds(1);
      expect(storedStrikeId.eq(strikes[4])).to.be.true;
      const positionId = await strategy.strikeToPositionId(storedStrikeId);
      const [position] = await lyraTestSystem.optionToken.getOptionPositions([positionId]);

      expect(position.amount.eq(defaultStrategyDetail.size)).to.be.true;
    });
    it('should revert when trying to trade the old strike', async () => {
      await lyraEvm.fastForward(600);
      await expect(vault.connect(randomUser).trade(strikes[3])).to.be.revertedWith('invalid strike');
    });

    const additionalDepositAmount = toBN('30');
    it('can add more deposit during the round', async () => {
      await vault.connect(randomUser).deposit(additionalDepositAmount);
      const state = await vault.vaultState();
      expect(state.totalPending.eq(additionalDepositAmount)).to.be.true;
      const receipt = await vault.depositReceipts(randomUser.address);
      expect(receipt.amount.eq(additionalDepositAmount)).to.be.true;
    });
    it('fastforward to the expiry', async () => {
      await lyraEvm.fastForward(boardParameter.expiresIn);
    });
    it('should revert when closeRound is called before options are settled', async () => {
      await expect(vault.closeRound()).to.be.revertedWith('cannot clear active position');
    });
    it('should be able to close closeRound after settlement', async () => {
      await lyraTestSystem.optionMarket.settleExpiredBoard(boardId);

      // settle all positions, from 1 to highest position
      const totalPositions = (await lyraTestSystem.optionToken.nextId()).sub(1).toNumber();
      const idsToSettle = Array.from({ length: totalPositions }, (_, i) => i + 1); // create array of [1... totalPositions]
      await lyraTestSystem.shortCollateral.settleOptions(idsToSettle);
      await vault.closeRound();

      // initiate withdraw for later test
      await vault.connect(randomUser2).initiateWithdraw(toBN('50'));
    });
  });
  describe('start round 2', async () => {
    before('create new board', async () => {
      await TestSystem.marketActions.createBoard(lyraTestSystem, boardParameter);
      const boards = await lyraTestSystem.optionMarket.getLiveBoards();
      boardId = boards[0];
    });
    it('start the next round', async () => {
      await lyraEvm.fastForward(lyraConstants.DAY_SEC);
      await vault.connect(manager).startNextRound(boardId);
    });
    // it('should be able to complete the withdraw', async() => {
    //   const sethBefore = await seth.balanceOf(randomUser2.address)

    //   await vault.connect(randomUser2).completeWithdraw();

    //   const sethAfter = await seth.balanceOf(randomUser2.address)

    //   console.log(sethAfter.sub(sethBefore).toString())
    // })
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