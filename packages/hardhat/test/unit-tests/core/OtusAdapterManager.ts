import { parseEther, parseUnits } from '@ethersproject/units';
import { lyraConstants, lyraEvm, TestSystem } from '@lyrafinance/core';
import { toBN } from '@lyrafinance/core/dist/scripts/util/web3utils';
import { DEFAULT_PRICING_PARAMS } from '@lyrafinance/core/dist/test/utils/defaultParams';
import { TestSystemContractsType } from '@lyrafinance/core/dist/test/utils/deployTestSystem';
import { PricingParametersStruct } from '@lyrafinance/core/dist/typechain-types/OptionMarketViewer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { 
  MockERC20,
	MockOtusAdapter,
	OtusAdapterManager
} from '../../../typechain-types';

describe('Unit Test - Otus Adapter Manager', () => {
	let otusAdapterManager: OtusAdapterManager;

	let anyone: SignerWithAddress;
	let owner: SignerWithAddress;
	let deployer: SignerWithAddress;

	let lyraTestSystem: TestSystemContractsType;
	let mockOtusAdapter: MockOtusAdapter;
	let mockOtusAdapter2: MockOtusAdapter; 
	let mockOtusAdapter2Copy: MockOtusAdapter;

	let baseAsset1: MockERC20;
	let baseAsset2: MockERC20;
	let baseAsset3: MockERC20;
	let baseAsset4: MockERC20;
	let quoteAsset: MockERC20;

	before('prepare signers', async () => {
		const addresses = await ethers.getSigners();
		deployer = addresses[0];
		owner = addresses[1];
		anyone = addresses[2];
	});

	
  before('deploy lyra core', async () => {
    const pricingParams: PricingParametersStruct = {
      ...DEFAULT_PRICING_PARAMS,
      standardSize: toBN('10'),
      spotPriceFeeCoefficient: toBN('0.001'),
    };

    lyraTestSystem = await TestSystem.deploy(deployer, true, false, { pricingParams });
  });

	before('prepare mocked contracts', async () => {
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    baseAsset1 = (await MockERC20Factory.deploy('Synthetic ETH', 'sETH')) as MockERC20;
    baseAsset2 = (await MockERC20Factory.deploy('Synthetic BTC', 'sBTC')) as MockERC20;
    baseAsset3 = (await MockERC20Factory.deploy('Synthetic SOL', 'sSOL')) as MockERC20;
    baseAsset4 = (await MockERC20Factory.deploy('Synthetic LINK', 'sLINK')) as MockERC20;
    quoteAsset = (await MockERC20Factory.deploy('Synthetic USD', 'sUSD')) as MockERC20;

		const mockOtusAdapterFactory = await ethers.getContractFactory('MockOtusAdapter');
    mockOtusAdapter = (await mockOtusAdapterFactory.deploy(
			lyraTestSystem.GWAVOracle.address,
			lyraTestSystem.testCurve.address, // curve swap
			lyraTestSystem.optionToken.address,
			lyraTestSystem.optionMarket.address,
			lyraTestSystem.liquidityPool.address,
			lyraTestSystem.shortCollateral.address,
			lyraTestSystem.synthetixAdapter.address,
			lyraTestSystem.optionMarketPricer.address,
			lyraTestSystem.optionGreekCache.address,
			quoteAsset.address, 
			baseAsset1.address, 
			lyraTestSystem.basicFeeCounter.address as string
		)) as MockOtusAdapter;

		mockOtusAdapter2 = (await mockOtusAdapterFactory.deploy(
			lyraTestSystem.GWAVOracle.address,
			lyraTestSystem.testCurve.address, // curve swap
			lyraTestSystem.optionToken.address,
			lyraTestSystem.optionMarket.address,
			lyraTestSystem.liquidityPool.address,
			lyraTestSystem.shortCollateral.address,
			lyraTestSystem.synthetixAdapter.address,
			lyraTestSystem.optionMarketPricer.address,
			lyraTestSystem.optionGreekCache.address,
			quoteAsset.address, 
			baseAsset2.address, 
			lyraTestSystem.basicFeeCounter.address as string
		)) as MockOtusAdapter;

		mockOtusAdapter2Copy = (await mockOtusAdapterFactory.deploy(
			lyraTestSystem.GWAVOracle.address,
			lyraTestSystem.testCurve.address, // curve swap
			lyraTestSystem.optionToken.address,
			lyraTestSystem.optionMarket.address,
			lyraTestSystem.liquidityPool.address,
			lyraTestSystem.shortCollateral.address,
			lyraTestSystem.synthetixAdapter.address,
			lyraTestSystem.optionMarketPricer.address,
			lyraTestSystem.optionGreekCache.address,
			quoteAsset.address, 
			baseAsset2.address, 
			lyraTestSystem.basicFeeCounter.address as string
		)) as MockOtusAdapter;

	});

	describe('deploy', async () => {
    it('should successfully deploy with owner', async () => {
      const OtusAdapterManagerFactory = await ethers.getContractFactory('OtusAdapterManager');
			otusAdapterManager = (await OtusAdapterManagerFactory.connect(owner).deploy()) as OtusAdapterManager;
			const managerOwner = await otusAdapterManager.owner();
      expect(managerOwner).to.be.eq(owner.address);
		})
	});	

	describe('rollover', async () => {
		it('owner should store quote asset pair and create new adapters', async () => {

			await otusAdapterManager.connect(owner).setVaultAdapter(baseAsset1.address, quoteAsset.address, mockOtusAdapter.address);
			const mockOtusAdapterAddress = await otusAdapterManager.connect(owner).getVaultAdapter(baseAsset1.address, quoteAsset.address); 
			expect(mockOtusAdapterAddress).to.be.eq(mockOtusAdapter.address); 

			await otusAdapterManager.connect(owner).setVaultAdapter(baseAsset2.address, quoteAsset.address, mockOtusAdapter2.address);
			const mockOtusAdapterAddress2 = await otusAdapterManager.connect(owner).getVaultAdapter(baseAsset2.address, quoteAsset.address); 
			expect(mockOtusAdapterAddress2).to.be.eq(mockOtusAdapter2.address); 

			await expect(
				otusAdapterManager.connect(owner).setVaultAdapter(baseAsset2.address, quoteAsset.address, mockOtusAdapter2.address)
			).to.be.revertedWith("Has an available Otus Adapter.");

			await expect(
				otusAdapterManager.connect(owner).getVaultAdapter(baseAsset3.address, quoteAsset.address)
			).to.be.revertedWith("No Available Otus Adapter for Assets."); 

		});

		it('should not set vault adapter if not owner', async () => {

			await expect(
					otusAdapterManager.connect(anyone).setVaultAdapter(baseAsset2.address, quoteAsset.address, mockOtusAdapter2.address)
				).to.be.revertedWith("Ownable: caller is not the owner");

		})

		it('should not set vault adapter if same base quote pair is already in use', async () => {

			await expect(
				otusAdapterManager.connect(owner).setVaultAdapter(baseAsset2.address, quoteAsset.address, mockOtusAdapter2Copy.address)
			).to.be.revertedWith("Has an available Otus Adapter.");

			const hasAdapterTrue = await otusAdapterManager.connect(anyone).hasVaultAdapter(baseAsset2.address, quoteAsset.address); 
			expect(hasAdapterTrue).to.be.eq(true); 

			const hasAdapterFalse = await otusAdapterManager.connect(anyone).hasVaultAdapter(baseAsset3.address, quoteAsset.address); 
			expect(hasAdapterFalse).to.be.eq(false); 

		});

	}); 


}); 