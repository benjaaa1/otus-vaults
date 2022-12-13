import { lyraConstants, TestSystem, getMarketDeploys, getGlobalDeploys } from '@lyrafinance/protocol';
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
import { defaultDynamicDeltaHedgeDetail, defaultStrategyDetail, defaultStrikeStrategyDetailCall, vaultInfo } from '../utils/init';


const spotPrice = toBN('3000');

const boardId = toBN('0');

const boardParameter = {
  expiresIn: lyraConstants.DAY_SEC * 7,
  baseIV: '0.8',
  strikePrices: ['2500', '2600', '2700', '2800', '2900', '3000', '3100'],
  skews: ['1.3', '1.2', '1.1', '1', '1.1', '1.3', '1.3'],
};

const initialPoolDeposit = toBN('1500000'); // 1.5m

describe('Create vault test', async () => {
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

  before('assign roles', async () => {
    const addresses = await ethers.getSigners();
    deployer = addresses[0];
    manager = addresses[1];
    otusMultiSig = addresses[2];
    keeper = addresses[3];
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

  describe('check strategy setup', async () => {

    it('it should set the strategy correctly on the vault', async () => {
      const strategy = await managersVault.connect(manager).strategy();
      expect(strategy).to.be.eq(managersStrategy.address);
    });

    it('deploys with correct vault', async () => {
      expect(await managersStrategy.vault()).to.be.eq(managersVault.address);
    });

  });

  describe('update vault strategy', async () => {

    it('should set the vault strategy while vault is closed', async () => {
      await managersStrategy.connect(manager).setStrategy({ ...defaultStrategyDetail, collatPercent: toBN('.80') });
      expect((await managersStrategy.currentStrategy()).collatPercent).to.be.eq(toBN('.80'));
    })

    it('should revert when trying to set vault strategy while vault is open', async () => {
      await managersVault.connect(manager).startNextRound();
      await expect(
        managersStrategy.connect(manager).setStrategy({ ...defaultStrategyDetail, collatPercent: toBN('.70') })).to.be.revertedWith(
          'round opened',
        );
    })

  })

  describe('set strike strategy', async () => {

    it('should set the strike strategies while vault is closed', async () => {
      await managersVault.connect(manager).closeRound();

      await managersStrategy.connect(manager).setStrikeStrategyDetail([defaultStrikeStrategyDetailCall]);
      // option type
      const _optionType = defaultStrikeStrategyDetailCall.optionType;
      const strikeStrategyForOptionType = await managersStrategy.currentStrikeStrategies(_optionType);
      await expect(strikeStrategyForOptionType.targetDelta).to.eq(defaultStrikeStrategyDetailCall.targetDelta);
    })

  })

  describe('set hedge type', async () => {
    it('should not set the hedge type when not valid', async () => {
      await expect(
        managersStrategy.connect(manager).setHedgeStrategyType(3)).to.be.revertedWith(
          'reverted with panic code 0x21 (Tried to convert a value into an enum, but the value was too big or negative)'
        );
    })

    it('should not set the hedge type when valid', async () => {
      await managersStrategy.connect(manager).setHedgeStrategyType(2);
      await managersStrategy.connect(manager).setHedgeStrategies(defaultDynamicDeltaHedgeDetail);
      const dynamicHedgeStrategy = await managersStrategy.dynamicHedgeStrategy();
      expect(dynamicHedgeStrategy.threshold).to.be.eq(defaultDynamicDeltaHedgeDetail.threshold);
    })

  })

});
