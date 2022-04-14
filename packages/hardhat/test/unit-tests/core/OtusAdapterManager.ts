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

describe.only('Unit Test - Basic clone vault with manager/supervisor flow', () => {
	let otusAdapterManager: OtusAdapterManager;

	let anyone: SignerWithAddress;
	let owner: SignerWithAddress;
	let deployer: SignerWithAddress;

	let lyraTestSystem: TestSystemContractsType;
	let mockOtusAdapter: MockOtusAdapter;

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

		// const mockOtusAdapterFactory = await ethers.getContractFactory('MockOtusAdapter');
    // mockOtusAdapter = (await mockOtusAdapterFactory.deploy()) as MockOtusAdapter;

	});

	describe('deploy', async () => {
    it('should successfully deploy with owner', async () => {
      const OtusAdapterManagerFactory = await ethers.getContractFactory('OtusAdapterManager', {
        libraries: {
          BlackScholes: lyraTestSystem.blackScholes.address,
        },
      });

			otusAdapterManager = (await OtusAdapterManagerFactory.connect(owner).deploy()) as OtusAdapterManager;

			const managerOwner = await otusAdapterManager.owner();
      expect(managerOwner).to.be.eq(owner.address);
			console.log({ managerOwner, owner: owner.address })

		})
	});	

	describe('rollover', async () => {
		it('owner should store quote asset pair and create new adapters', async () => {

			otusAdapterManager.connect(owner).initializeVaultAdapter(
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
			);
			console.log(quoteAsset.address, baseAsset1.address)
			const otusAdapter = await otusAdapterManager.connect(owner).quoteToBaseAssets(baseAsset1.address, quoteAsset.address); //getVaultAdapter(quoteAsset.address, baseAsset1.address); 
			console.log({ otusAdapter })	

			await expect(otusAdapterManager.connect(owner).initializeVaultAdapter(
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
			)).to.be.revertedWith("Has vault adapter");

		});
	}); 


}); 