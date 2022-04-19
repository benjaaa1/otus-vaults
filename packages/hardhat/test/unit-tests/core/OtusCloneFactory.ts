import { TestSystem } from '@lyrafinance/core';
import { toBN, ZERO_ADDRESS } from '@lyrafinance/core/dist/scripts/util/web3utils';
import { DEFAULT_PRICING_PARAMS } from '@lyrafinance/core/dist/test/utils/defaultParams';
import { TestSystemContractsType } from '@lyrafinance/core/dist/test/utils/deployTestSystem';
import { PricingParametersStruct } from '@lyrafinance/core/dist/typechain-types/OptionMarketViewer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { 
  OtusCloneFactory, 
  Strategy, 
  Strategy__factory,
  OtusVault, 
  MockERC20, 
  MockSupervisor,
  MockOtusVault,
  MockStrategy,
  MockOptionMarket,
  MockFuturesMarket
} from '../../../typechain-types';

describe('Unit Test - Basic clone vault with manager/supervisor flow', () => {
  let otusCloneFactory: OtusCloneFactory;
  let otusVault: OtusVault; 
  let strategy: Strategy; 

  let deployer: SignerWithAddress;
  let anyone: SignerWithAddress;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let noone: SignerWithAddress;
  let keeper: SignerWithAddress;

  let mockOtus: MockERC20;
  let mockSupervisor: MockSupervisor; 
  let mockOtusVault: MockOtusVault; 
  let mockStrategy: MockStrategy;
  let mockOptionMarket: MockOptionMarket; 
  let mockFuturesMarket: MockFuturesMarket;

  let susd: MockERC20;
  let seth: MockERC20;

  let lyraTestSystem: TestSystemContractsType;

  before('prepare signers', async () => {
    const addresses = await ethers.getSigners();
    deployer = addresses[0];
    anyone = addresses[1];
    treasury = addresses[2];
    noone = addresses[3];
    keeper = addresses[4];
    owner = addresses[5];
  });

  before('deploy lyra core', async () => {
    const pricingParams: PricingParametersStruct = {
      ...DEFAULT_PRICING_PARAMS,
      standardSize: toBN('10'),
      spotPriceFeeCoefficient: toBN('0.001'),
    };

    lyraTestSystem = await TestSystem.deploy(deployer, true, false, { pricingParams });
  })
  
  before('prepare mocked contracts', async () => {
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    mockOtus = (await MockERC20Factory.deploy('Otus Token', 'OTUS')) as MockERC20;
    susd = (await MockERC20Factory.deploy('Synthetic USD', 'sUSD')) as MockERC20;
    seth = (await MockERC20Factory.deploy('Synthetic ETH', 'sETH')) as MockERC20;

    const MockFuturesMarketFactory = await ethers.getContractFactory('MockFuturesMarket');
    mockFuturesMarket = (await MockFuturesMarketFactory.deploy()) as MockFuturesMarket;

    const MockSupervisorFactory = await ethers.getContractFactory('MockSupervisor')
    mockSupervisor = (await MockSupervisorFactory.deploy(treasury.address, mockOtus.address)) as MockSupervisor;

    const MockOtusVaultFactory = await ethers.getContractFactory('MockOtusVault')
    mockOtusVault = (await MockOtusVaultFactory.deploy(mockFuturesMarket.address, 86400 * 7)) as MockOtusVault;

    const MockStrategyFactory = await ethers.getContractFactory('MockStrategy')
    mockStrategy = (await MockStrategyFactory.deploy(
      lyraTestSystem.GWAVOracle.address,
      lyraTestSystem.testCurve.address,
      lyraTestSystem.optionToken.address,
      lyraTestSystem.optionMarket.address,
      lyraTestSystem.liquidityPool.address,
      lyraTestSystem.shortCollateral.address,
      lyraTestSystem.synthetixAdapter.address,
      lyraTestSystem.optionMarketPricer.address,
      lyraTestSystem.optionGreekCache.address,
      lyraTestSystem.basicFeeCounter.address as string,
    )) as MockStrategy;
  });

  describe('deploy', async () => {
    it('should successfully deploy and set immutable addresses', async () => {
      const OtusCloneFactory = await ethers.getContractFactory('OtusCloneFactory');

      otusCloneFactory = (await OtusCloneFactory.deploy(
        mockSupervisor.address,
        mockOtusVault.address,
        mockStrategy.address
      )) as OtusCloneFactory;

      const supervisorImm = await otusCloneFactory.supervisor();
      expect(supervisorImm).to.be.eq(mockSupervisor.address);

      const otusVaultImm = await otusCloneFactory.otusVault();
      expect(otusVaultImm).to.be.eq(mockOtusVault.address);

      const strategyImm = await otusCloneFactory.strategy();
      expect(strategyImm).to.be.eq(mockStrategy.address);
    });
  });

  describe('owner settings', async () => {
    it('owner should be able to set a new keeper', async () => {
      await otusCloneFactory.connect(owner).setKeeper(keeper.address);
      const setKeeper = await otusCloneFactory.keeper(); 
      expect(setKeeper).to.be.eq(keeper.address);
    }); 
    
  });

  describe('user settings', async() => {
    it('user should be able to clone a supervisor', async() => {
      await otusCloneFactory.connect(anyone)._cloneSupervisor(); 
      const supervisor = await otusCloneFactory.connect(anyone)._getSupervisor();
      expect(supervisor).to.not.be.eq(ZERO_ADDRESS);
      expect(supervisor).to.not.be.eq(mockSupervisor.address);
    })

    it('user should be able to clone a vault if they have a supervisor address', async() => {
      const cap = ethers.utils.parseEther('5000');
      const decimals = 18;
      await otusCloneFactory.connect(anyone)._cloneVault('OtusVault Share', 'Otus VS', true, 0, {
        decimals,
        cap, 
        asset: susd.address
      }); 

      const vault = await otusCloneFactory.connect(anyone)._getVault(); 
      expect(vault).to.not.be.eq(ZERO_ADDRESS);
      expect(vault).to.not.be.eq(mockOtusVault.address);
    });

    it('user should not be able to clone a vault if not a supervisor', async() => {
      const cap = ethers.utils.parseEther('5000');
      const decimals = 18;

      await expect(otusCloneFactory.connect(noone)._cloneVault('OtusVault Share', 'Otus VS', true, 0, {
        decimals,
        cap, 
        asset: susd.address
      })).to.be.revertedWith('Has no supervisor');
    });

    it('user should be able to clone a strategy if they have a vault address', async() => {
      await otusCloneFactory.connect(anyone)._cloneStrategy(susd.address, seth.address); 
      const strategy = await otusCloneFactory.connect(anyone)._getStrategy(); 
      expect(strategy).to.not.be.eq(ZERO_ADDRESS);
      expect(strategy).to.not.be.eq(mockStrategy.address);
    });

    it('user should not be able to clone a strategy if they have no supervisor address', async() => {
      await expect(otusCloneFactory.connect(noone)._cloneStrategy(susd.address, seth.address)).to.be.revertedWith('Has no supervisor'); 
    });

    it('user should not be able to clone a strategy if they have no vault address', async() => {
      await otusCloneFactory.connect(noone)._cloneSupervisor(); 
      await expect(otusCloneFactory.connect(noone)._cloneStrategy(susd.address, seth.address)).to.be.revertedWith('Has no vault'); 
    });

  });

}); 
