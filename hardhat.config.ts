import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-contract-sizer';

const config = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000,
      },
    },
  },
  mocha: {
    timeout: 2_000_000,
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
