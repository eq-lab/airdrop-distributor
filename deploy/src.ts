import { ethers } from 'ethers';
import { handle } from '@oclif/errors';
import { Command, flags } from '@oclif/command';
import { AirdropDistributor__factory } from '../typechain-types';
import { formatUnits } from 'ethers/lib/utils';
import ganache from 'ganache';
import fs from 'fs';
import path from 'path';

type AirdropConfig = { nodeUri: string; airdropTokenAddress: string; airdropTokenStorageAddress: string };
type DeploymentData = { address: string; txHash: string };

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

    const airdropContractFactory = new AirdropDistributor__factory();
    const airdropContract = await airdropContractFactory
      .connect(deployer)
      .deploy(configData.airdropTokenAddress, configData.airdropTokenStorageAddress);
    await airdropContract.deployed();

    const deploymentData: DeploymentData = {
      address: airdropContract.address,
      txHash: airdropContract.deployTransaction.hash,
    };
    console.log(`\nContract deployed:`);
    console.log(`  address: ${deploymentData.address}`);
    console.log(`  tx hash: ${deploymentData.txHash}`);

    const resultingBalance = await deployer.getBalance();
    console.log(`\nDeployer resulting balance: ${formatUnits(resultingBalance, 18)} ETH`);
    console.log(`Spent: ${formatUnits(initialBalance.sub(resultingBalance), 18)} ETH`);

    if (!dryRun) {
      this.saveDeploymentData(deploymentData, this.getDir(config));
    }
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

    if (!ethers.utils.isAddress(config.airdropTokenAddress)) {
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
