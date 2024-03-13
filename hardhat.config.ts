import '@nomicfoundation/hardhat-toolbox';
require('hardhat-contract-sizer');
require('hardhat-dependency-compiler');

const config = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000,
      },
    },
  },
  mocha: {
    timeout: 200_000,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
    only: ['Airdrop'],
    except: ['Mock', 'Test'],
  }
};

export default config;