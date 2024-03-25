import { ethers } from 'ethers';
import { handle } from '@oclif/errors';
import { Command, flags } from '@oclif/command';
import { AirdropDistributor__factory, MintableERC20__factory } from '../typechain-types';
import { formatUnits } from 'ethers/lib/utils';
import ganache from 'ganache';
import fs from 'fs';
import path from 'path';

type AirdropConfig = {
  nodeUri: string;
  airdropTokenAddress?: string;
  testToken?: TestTokenConfig;
  airdropTokenStorageAddress: string;
};
type TestTokenConfig = { name: string; symbol: string };

type ContractDeploymentData = { address: string; txHash: string };
type DeploymentData = {
  airdropContract: ContractDeploymentData;
  token?: ContractDeploymentData;
};

class AirdropDeployment extends Command {
  static description = 'Airdrop contract deployment';

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    key: flags.string({
      char: 'k',
      description: 'Deployer private key',
      required: true,
      env: 'KEY',
    }),
    config: flags.string({
      char: 'c',
      description: 'Config file path',
      required: true,
      env: 'CONFIG',
    }),
    dryRun: flags.boolean({
      char: 'd',
      description: 'dry run on fork for deployment config tests and fee estimations',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags: parsedFlags } = this.parse(AirdropDeployment);
    const { key, config, dryRun } = parsedFlags;

    const configData = this.readConfig(config);

    const provider = await this.getProvider(configData.nodeUri, dryRun);
    const deployer = new ethers.Wallet(key).connect(provider);

    console.log(`\nDeployer address is ${deployer.address}`);
    const initialBalance = await deployer.getBalance();
    console.log(`Deployer initial balance: ${formatUnits(initialBalance, 18)} ETH`);

    const testTokenDataPresent = configData.testToken !== undefined;
    const tokenAddressPresent = configData.airdropTokenAddress !== undefined;

    if (testTokenDataPresent && tokenAddressPresent) {
      throw new Error(`Both airdropTokenAddress and testToken are provided in config. Pls remove one of them`);
    }

    if (!testTokenDataPresent && !tokenAddressPresent) {
      throw new Error(`Both airdropTokenAddress and testToken are absent in config. Pls add one of them`);
    }

    const tokenDeploymentData = testTokenDataPresent
      ? await this.deployToken(deployer, configData.testToken!)
      : undefined;
    const tokenAddress = tokenAddressPresent ? configData.airdropTokenAddress! : tokenDeploymentData!.address;

    const airdropDeploymentData = await this.deployAirdropContract(
      deployer,
      tokenAddress,
      configData.airdropTokenStorageAddress
    );

    const resultingBalance = await deployer.getBalance();
    console.log(`\nDeployer resulting balance: ${formatUnits(resultingBalance, 18)} ETH`);
    console.log(`Spent: ${formatUnits(initialBalance.sub(resultingBalance), 18)} ETH`);

    const deploymentData: DeploymentData = { airdropContract: airdropDeploymentData, token: tokenDeploymentData };
    if (!dryRun) {
      this.saveDeploymentData(deploymentData, this.getDir(config));
    }
  }

  async deployAirdropContract(
    deployer: ethers.Signer,
    tokenAddress: string,
    tokenStorage: string
  ): Promise<ContractDeploymentData> {
    console.log(`\nDeploying airdrop contract`);
    const airdropContractFactory = new AirdropDistributor__factory();
    const airdropContract = await airdropContractFactory.connect(deployer).deploy(tokenAddress, tokenStorage);
    await airdropContract.deployed();

    console.log(`\nAirdrop contract deployed:`);
    console.log(`  address: ${airdropContract.address}`);
    console.log(`  tx hash: ${airdropContract.deployTransaction.hash}`);
    return { address: airdropContract.address, txHash: airdropContract.deployTransaction.hash };
  }

  async deployToken(deployer: ethers.Signer, config: TestTokenConfig): Promise<ContractDeploymentData> {
    console.log(`\nDeploying token contract`);
    const tokenFactory = new MintableERC20__factory();
    const token = await tokenFactory.connect(deployer).deploy(config.name, config.symbol);
    await token.deployed();

    console.log(`\nToken contract deployed:`);
    console.log(`  address: ${token.address}`);
    console.log(`  tx hash: ${token.deployTransaction.hash}`);
    return { address: token.address, txHash: token.deployTransaction.hash };
  }

  async getProvider(nodeUri: string, dryRun: boolean): Promise<ethers.providers.JsonRpcProvider> {
    console.log(`\nSetting up provider`);
    let provider = new ethers.providers.JsonRpcProvider(nodeUri);

    if (dryRun) {
      console.log(`Dry run: running on fork`);
      const chainId = (await provider.getNetwork()).chainId;
      const options = {
        chain: { chainId: chainId },
        logging: { quiet: true },
        fork: { url: nodeUri },
      };
      provider = new ethers.providers.Web3Provider(
        ganache.provider(options) as unknown as ethers.providers.ExternalProvider
      );
    }

    console.log(`Current block number: ${await provider.getBlockNumber()}`);
    return provider;
  }

  readConfig(configPath: string): AirdropConfig {
    const config: AirdropConfig = require(configPath);

    if (config.airdropTokenAddress !== undefined && !ethers.utils.isAddress(config.airdropTokenAddress)) {
      throw new Error(`airdropTokenAddress has invalid value: ${config.airdropTokenAddress}`);
    }

    if (!ethers.utils.isAddress(config.airdropTokenStorageAddress)) {
      throw new Error(`airdropTokenStorageAddress has invalid value: ${config.airdropTokenStorageAddress}`);
    }

    return config;
  }

  saveDeploymentData(deploymentData: DeploymentData, configDir: string) {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const filename = configDir + `/deployment-${year}-${month}-${day}.json`;
    const data = JSON.stringify(deploymentData, null, 2) + `\n`;
    const resolvedPath = path.resolve(__dirname, filename);
    fs.writeFileSync(resolvedPath, data, { flag: 'wx' });
    console.log(`\nDeployment data saved: ${resolvedPath}`);
  }

  getDir(path: string): string {
    return path.split('/').slice(0, -1).join('/');
  }
}

async function main(): Promise<void> {
  await AirdropDeployment.run();
}

main().catch(handle);
