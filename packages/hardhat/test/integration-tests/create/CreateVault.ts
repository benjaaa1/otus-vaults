import { lyraConstants, TestSystem, getMarketDeploys } from '@lyrafinance/protocol';
import { toBN, ZERO_ADDRESS } from '@lyrafinance/protocol/dist/scripts/util/web3utils';
import { DEFAULT_PRICING_PARAMS } from '@lyrafinance/protocol/dist/test/utils/defaultParams';
import { TestSystemContractsType } from '@lyrafinance/protocol/dist/test/utils/deployTestSystem';
import { PricingParametersStruct } from '@lyrafinance/protocol/dist/typechain-types/OptionMarketViewer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

import {
  LyraBase,
  MockERC20,
  MockFuturesMarket,
  MockFuturesMarketManager,
  OtusCloneFactory,
  OtusController,
  OtusVault
} from '../../../typechain-types';
import { Strategy } from '../../../typechain-types/Strategy';

import { LyraMarket } from '@lyrafinance/protocol/dist/test/utils/package/parseFiles';
import { Vault } from '../../../typechain-types/OtusVault';


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

  let randomUser1: SignerWithAddress;
  let randomUser2: SignerWithAddress;
  let randomUser3: SignerWithAddress;
  let keeper: SignerWithAddress;

  before('assign roles', async () => {
    const addresses = await ethers.getSigners();
    deployer = addresses[0];
    manager = addresses[1];
    otusMultiSig = addresses[2];
    randomUser1 = addresses[3];
    randomUser2 = addresses[4];
    randomUser3 = addresses[5];
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

    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    susd = (await MockERC20Factory.connect(deployer).deploy('sUSD', 'sUSD', toBN('100000000'))) as MockERC20;

    const MockFuturesMarketManagerFactory = await ethers.getContractFactory('MockFuturesMarketManager');
    futuresMarketsManager = (await MockFuturesMarketManagerFactory.connect(
      deployer,
    ).deploy()) as MockFuturesMarketManager;

    await futuresMarketsManager
      .connect(deployer)
      .addMarket(
        '0x7345544800000000000000000000000000000000000000000000000000000000',
        '0x0D10c032ad006C98C33A95e59ab3BA2b0849bD59',
      );

    const LyraBaseETHFactory = await ethers.getContractFactory('LyraBase', {
      libraries: { BlackScholes: lyraTestSystem.blackScholes.address },
    });

    const lyraMarket = getMarketDeploys('kovan-ovm', 'sETH');

    lyraBaseETH = (await LyraBaseETHFactory.connect(deployer).deploy(
      '0x7345544800000000000000000000000000000000000000000000000000000000',
      '0xa64a15E39e717663bB6885a536FA9741DEe08daC', // synthetix adapter
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
      lyraTestSystem.lyraRegistry.address,
      futuresMarketsManager.address, // futuresmarketmanager
      keeper.address,
    )) as OtusController;

    const OtusVaultFactory = await ethers.getContractFactory('OtusVault');
    vault = (await OtusVaultFactory.connect(otusMultiSig).deploy(86400 * 7)) as OtusVault;

    const StrategyBaseFactory = await ethers.getContractFactory('Strategy');
    console.log({ susd: susd.address });
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
    await otusController
      .connect(otusMultiSig)
      .setFuturesMarkets(
        '0x0D10c032ad006C98C33A95e59ab3BA2b0849bD59',
        '0x7345544800000000000000000000000000000000000000000000000000000000',
      );

    const lyraMarket = getMarketDeploys('kovan-ovm', 'sETH');

    await otusController.connect(otusMultiSig).setOptionMarketDetails(lyraMarket.OptionMarket.address);

    await otusController
      .connect(otusMultiSig)
      .setLyraAdapter(
        lyraBaseETH.address,
        lyraMarket.OptionMarket.address,
        '0x7345544800000000000000000000000000000000000000000000000000000000',
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
});
