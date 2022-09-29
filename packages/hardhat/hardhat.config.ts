import * as dotenv from 'dotenv';
import { utils } from 'ethers';
import fs from 'fs';
import chalk from 'chalk';

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

const mainnetGwei = 21;

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
  tenderly: {
    project: 'otus-finance-vault-factory',
    username: '0xbenjaaa',
  },
  defaultNetwork,
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP || null,
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545',
    },
    mainnet: {
      url: 'https://mainnet.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925', // <---- YOUR INFURA ID! (or it won't work)
      gasPrice: mainnetGwei * 1000000000,
      accounts: {
        mnemonic: mnemonic(),
      },
      deploy: ['deploy_l1'],
      companionNetworks: {
        l2: 'optimism',
      },
    },
    kovan: {
      url: 'https://kovan.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925', // <---- YOUR INFURA ID! (or it won't work)
      //    url: "https://speedy-nodes-nyc.moralis.io/XXXXXXXXXXXXXXXXXXXXXXX/eth/kovan", // <---- YOUR MORALIS ID! (not limited to infura)
      accounts: {
        mnemonic: 'wear bubble foil piano inherit cram talent cute minute neglect three play',
      },
      deploy: ['deploy_l1'],
      companionNetworks: {
        l2: 'kovanOptimism',
      },
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
    kovanOptimism: {
      chainId: 69,
      url: 'https://optimism-kovan.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925',
      ovm: true,
      timeout: 60000,
      accounts: {
        mnemonic: 'wear bubble foil piano inherit cram talent cute minute neglect three play',
      },
      deploy: ['deploy_l2'],
      companionNetworks: {
        l1: 'kovan',
      },
    },
    localOptimism: {
      url: 'http://localhost:8545',
      accounts: {
        mnemonic: mnemonic(),
      },
      companionNetworks: {
        l1: 'localOptimismL1',
      },
    },
    localOptimismL1: {
      url: 'http://localhost:9545',
      gasPrice: 0,
      accounts: {
        mnemonic: mnemonic(),
      },
      companionNetworks: {
        l2: 'localOptimism',
      },
    },
    // hardhat: {
    //   allowUnlimitedContractSize: true
    // }
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
      mainnet: '582EMV38X8492YGM6IIB22YVXIBFDB3RU5',
      optimisticKovan: '582EMV38X8492YGM6IIB22YVXIBFDB3RU5',
    },
  },
  dependencyCompiler: {
    paths: lyraContractPaths,
  },
};
