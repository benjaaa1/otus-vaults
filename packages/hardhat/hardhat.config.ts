import * as dotenv from 'dotenv';
import fs from 'fs';

import '@nomiclabs/hardhat-waffle';
import '@tenderly/hardhat-tenderly';

import 'hardhat-deploy';
import 'hardhat-gas-reporter';

import '@otusfinance/otus-hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';

import '@typechain/hardhat';
import 'hardhat-dependency-compiler';
import { lyraContractPaths } from '@lyrafinance/protocol/dist/test/utils/package/index-paths';
import 'hardhat-contract-sizer';

dotenv.config();

const defaultNetwork = 'localhost';

function mnemonic() {
  try {
    return fs.readFileSync('./mnemonic.txt').toString().trim();
  } catch (e) {
    if (defaultNetwork !== 'localhost') {
      console.log(
        '☢️ WARNING: No mnemonic file created for a deploy account. Try `yarn run generate` and then `yarn run account`.',
      );
    }
  }
  return '';
}
module.exports = {
  defaultNetwork,
  networks: {
    localhost: {
      url: 'http://localhost:8545', // http://hardhat:8545
      deploy: ['deploy_local'],
    },
    optimism: {
      url: 'https://mainnet.optimism.io',
      accounts: {
        mnemonic: mnemonic(),
      },
      deploy: ['deploy_l2'],
      companionNetworks: {
        l1: 'mainnet',
      },
    },
    goerliOptimism: {
      url: `https://optimism-goerli.infura.io/v3/${process.env.INFURA_ID}`,
      ovm: true,
      timeout: 60000,
      chainId: 420,
      accounts: [process.env.PRIVATE_KEY],
      deploy: ['deploy_l2']
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.7',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  ovm: {
    solcVersion: '0.7.6',
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  mocha: {
    timeout: 1000000000,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
    },
  },
  dependencyCompiler: {
    paths: lyraContractPaths,
  },
};
