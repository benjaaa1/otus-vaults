import { parseEther, parseUnits } from '@ethersproject/units';
import { ZERO_ADDRESS } from '@lyrafinance/core/dist/scripts/util/web3utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { 
  OtusCloneFactory, 
  Strategy, 
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

  before('prepare signers', async () => {
    const addresses = await ethers.getSigners();
    owner = addresses[0];
    anyone = addresses[1];
    treasury = addresses[2];
    noone = addresses[3];
    keeper = addresses[4];
  });

  
  before('prepare mocked contracts', async () => {
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    mockOtus = (await MockERC20Factory.deploy('Otus Token', 'OTUS')) as MockERC20;
    susd = (await MockERC20Factory.deploy('Synthetic USD', 'sUSD')) as MockERC20;

    const MockFuturesMarketFactory = await ethers.getContractFactory('MockFuturesMarket');
    mockFuturesMarket = (await MockFuturesMarketFactory.deploy()) as MockFuturesMarket;

    const MockSupervisorFactory = await ethers.getContractFactory('MockSupervisor')
    mockSupervisor = (await MockSupervisorFactory.deploy(treasury.address, mockOtus.address)) as MockSupervisor;

    const MockOtusVaultFactory = await ethers.getContractFactory('MockOtusVault')
    mockOtusVault = (await MockOtusVaultFactory.deploy(mockFuturesMarket.address, 86400 * 7)) as MockOtusVault;

    const MockStrategyFactory = await ethers.getContractFactory('MockStrategy')
    mockStrategy = (await MockStrategyFactory.deploy(susd.address, susd.address)) as MockStrategy;
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
      await otusCloneFactory.connect(anyone)._cloneVault('OtusVault Share', 'Otus VS',  {
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

      await expect(otusCloneFactory.connect(noone)._cloneVault('OtusVault Share', 'Otus VS',  {
        decimals,
        cap, 
        asset: susd.address
      })).to.be.revertedWith('Has no supervisor');
    });

    it('user should be able to clone a strategy if they have a vault address', async() => {
      await otusCloneFactory.connect(anyone)._cloneStrategy(); 
      const strategy = await otusCloneFactory.connect(anyone)._getStrategy(); 
      expect(strategy).to.not.be.eq(ZERO_ADDRESS);
      expect(strategy).to.not.be.eq(mockStrategy.address);

    });

    it('user should not be able to clone a strategy if they have no supervisor address', async() => {
      await expect(otusCloneFactory.connect(noone)._cloneStrategy()).to.be.revertedWith('Has no supervisor'); 
    });

    it('user should not be able to clone a strategy if they have no vault address', async() => {
      await otusCloneFactory.connect(noone)._cloneSupervisor(); 
      await expect(otusCloneFactory.connect(noone)._cloneStrategy()).to.be.revertedWith('Has no vault'); 
    });

  });

}); 
