import { lyraConstants, lyraEvm, TestSystem, getMarketDeploys, getGlobalDeploys } from '@lyrafinance/protocol';
import { toBN, ZERO_ADDRESS } from '@lyrafinance/protocol/dist/scripts/util/web3utils';
import { DEFAULT_PRICING_PARAMS } from '@lyrafinance/protocol/dist/test/utils/defaultParams';
import { TestSystemContractsType } from '@lyrafinance/protocol/dist/test/utils/deployTestSystem';
import { PricingParametersStruct } from '@lyrafinance/protocol/dist/typechain-types/OptionMarketViewer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import markets from '../../../constants/synthetix/markets.json';

import {
  LyraBase,
  MockERC20,
  MockFuturesMarket,
  MockFuturesMarketManager,
  OtusCloneFactory,
  OtusController,
  OtusVault,
  OtusVault__factory,
  Strategy__factory
} from '../../../typechain-types';
import { Strategy } from '../../../typechain-types/Strategy';

import { LyraGlobal, LyraMarket } from '@lyrafinance/protocol/dist/test/utils/package/parseFiles';
import { Vault } from '../../../typechain-types/OtusVault';
import { defaultStrategyDetail, vaultInfo } from '../utils/init';


const spotPrice = toBN('3000');

const boardId = toBN('0');

const boardParameter = {
  expiresIn: lyraConstants.DAY_SEC * 7,
  baseIV: '0.8',
  strikePrices: ['2500', '2600', '2700', '2800', '2900', '3000', '3100'],
  skews: ['1.3', '1.2', '1.1', '1', '1.1', '1.3', '1.3'],
};

const initialPoolDeposit = toBN('1500000'); // 1.5m

describe('Vault User transaction integration test ', async () => {
  // mocked tokens
  let susd: MockERC20;

  let lyraTestSystem: TestSystemContractsType;
  let lyraMarket: LyraMarket;
  let lyraGlobal: LyraGlobal;

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

    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    susd = (await MockERC20Factory.connect(deployer).deploy('sUSD', 'sUSD', toBN('100000000'))) as MockERC20;

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

    lyraGlobal = getGlobalDeploys('local');
    lyraMarket = getMarketDeploys('local', 'sETH');

    const LyraBaseETHFactory = await ethers.getContractFactory('LyraBase', {
      libraries: { BlackScholes: lyraTestSystem.blackScholes.address },
    });

    lyraBaseETH = (await LyraBaseETHFactory.connect(deployer).deploy(
      markets.ETH,
      lyraGlobal.SynthetixAdapter.address,
      lyraMarket.OptionToken.address,
      lyraMarket.OptionMarket.address,
      lyraMarket.LiquidityPool.address,
      lyraMarket.ShortCollateral.address,
      lyraMarket.OptionMarketPricer.address,
      lyraMarket.OptionGreekCache.address,
      lyraMarket.GWAVOracle.address,
    )) as LyraBase;

  });

  before('deploy vault, strategy, and clone factory contracts', async () => {
    const OtusController = await ethers.getContractFactory('OtusController');

    otusController = (await OtusController.connect(otusMultiSig).deploy(
      futuresMarketsManager.address,
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

    await otusController.connect(otusMultiSig).setOtusCloneFactory(otusCloneFactory.address);

    await otusController
      .connect(otusMultiSig)
      .setFuturesMarkets(
        futuresMarket.address,
        markets.ETH,
      );

    await otusController
      .connect(otusMultiSig)
      .setLyraAdapter(
        lyraBaseETH.address,
        lyraMarket.OptionMarket.address,
        markets.ETH,
      );

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

  describe('users can deposit and withdraw while round is inactive', async () => {

    before('create fake susd for users', async () => {
      await susd.mint(randomUser1.address, toBN('100000'));
      await susd.mint(randomUser2.address, toBN('100000'));
    });

    before('users should be able to deposit to vault', async () => {
      await susd.connect(randomUser1).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser1).deposit(toBN('50000'));

      await susd.connect(randomUser2).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser2).deposit(toBN('70000'));

      const state = await managersVault.vaultState();
      expect(state.totalPending.eq(toBN('120000'))).to.be.true;
    })

    it('user can withdraw instantly', async () => {
      await managersVault.connect(randomUser1).withdrawInstantly(toBN('50000'));
      const stateAfter1 = await managersVault.vaultState();
      expect(stateAfter1.totalPending.eq(toBN('70000'))).to.be.true;

      await managersVault.connect(randomUser2).withdrawInstantly(toBN('50000'));
      const stateAfter2 = await managersVault.vaultState();
      expect(stateAfter2.totalPending.eq(toBN('20000'))).to.be.true;
    })

    it('users do not have shares yet', async () => {
      const [heldByAccount] = await managersVault.connect(randomUser2).shareBalances(randomUser2.address);
      expect(heldByAccount.eq(toBN('0'))).to.be.true;
    });

  });

  describe('users can deposit and withdraw while round is active', async () => {

    before('create fake susd for users', async () => {
      await susd.mint(randomUser1.address, toBN('100000'));
      await susd.mint(randomUser2.address, toBN('100000'));
    });

    before('users should be able to deposit to vault', async () => {
      await susd.connect(randomUser1).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser1).deposit(toBN('50000'));

      await susd.connect(randomUser2).approve(managersVault.address, lyraConstants.MAX_UINT);
      await managersVault.connect(randomUser2).deposit(toBN('70000'));

      const state = await managersVault.vaultState();
      expect(state.totalPending.eq(toBN('140000'))).to.be.true;
    })

    before('start round', async () => {
      await managersVault.connect(manager).startNextRound();
      const state = await managersVault.connect(manager).vaultState();
      expect(state.round == 2).to.be.true;
      expect(state.roundInProgress).to.be.true;
    })

    it('users do have shares in vault', async () => {
      const [, heldByVault] = await managersVault.connect(randomUser2).shareBalances(randomUser2.address);
      expect(heldByVault.eq(toBN('90000'))).to.be.true;
    });

    it('user can request withdrawal during round', async () => {
      const randomUser2BalanceBefore = await susd.balanceOf(randomUser2.address);
      console.log({ randomUser2BalanceBefore })

      await managersVault.connect(randomUser2).initiateWithdraw(toBN('90000'));
      const state = await managersVault.vaultState();
      expect(state.queuedWithdrawShares.eq(toBN('90000'))).to.be.true;
    });

    it('users can complete withdrawal during next round', async () => {
      await managersVault.connect(manager).closeRound();
      await lyraEvm.fastForward(60000);
      await managersVault.connect(manager).startNextRound();
      const state1 = await managersVault.vaultState();
      console.log({ state1 })
      const managersBalance = await susd.balanceOf(managersVault.address);
      console.log({ managersBalance })

      const randomUser2Balance = await susd.balanceOf(randomUser2.address);
      console.log({ randomUser2Balance })

      await managersVault.connect(randomUser2).completeWithdraw();
      const state = await managersVault.vaultState();
      expect(state.queuedWithdrawShares.eq(toBN('0'))).to.be.true;
      expect(state.lockedAmount.eq(toBN('50000'))).to.be.true;
    })

  })


});
