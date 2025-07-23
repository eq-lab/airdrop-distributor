import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from 'fs';
import path from 'path';

declare var console: any;
declare var __dirname: string;

async function waitForConfirmationsAndVerify(
    hre: HardhatRuntimeEnvironment,
    address: string,
    constructorArgs: any[],
    contractName: string,
    confirmations: number = 5
) {
    console.log(`🔍 Verifying ${contractName}...`);
    console.log(`⏳ Waiting for ${confirmations} confirmations before verification...`);

    try {
        const currentBlock = await hre.ethers.provider.getBlockNumber();
        let confirmedBlock = currentBlock;

        while (confirmedBlock - currentBlock < confirmations) {
            await new Promise(resolve => setTimeout(resolve, 15000));
            confirmedBlock = await hre.ethers.provider.getBlockNumber();
            console.log(`📦 Current confirmations: ${confirmedBlock - currentBlock}/${confirmations}`);
        }

        console.log(`✅ ${confirmations} confirmations reached. Proceeding with verification...`);

        await hre.run("verify:verify", {
            address: address,
            constructorArguments: constructorArgs,
        });
        console.log(`✅ ${contractName} verified successfully!`);
        return true;
    } catch (error) {
        console.log(`❌ ${contractName} verification failed:`, error);
        console.log(`💡 You can verify manually later with:`);
        console.log(`npx hardhat verify --network ${hre.network.name} ${address} ${constructorArgs.map(arg => `"${arg}"`).join(' ')}`);
        return false;
    }
}

type AirdropConfig = {
    nodeUri: string;
    airdropTokenAddress?: string;
    testToken?: TestTokenConfig;
    airdropTokenStorageAddress: string;
};

type TestTokenConfig = { name: string; symbol: string; decimals?: number };

type ContractDeploymentData = { address: string; txHash?: string };
type DeploymentData = {
    airdropContract: ContractDeploymentData;
    token?: ContractDeploymentData;
};

task("airdrop:deploy", "Deploy AirdropDistributor contract")
    .addParam("target", "Target network config (e.g., sepolia, holesky, base)")
    .addFlag("dryRun", "Run deployment simulation on a fork")
    .addFlag("verify", "Verify contracts on Etherscan after deployment")
    .addOptionalParam("confirmations", "Number of confirmations to wait before verification", 5, types.int)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { target: configName, dryRun, verify, confirmations } = taskArgs;

        const configPath = path.resolve(__dirname, `../deploy/data/${configName}/config.json`);
        if (!fs.existsSync(configPath)) {
            throw new Error(`Config file not found: ${configPath}`);
        }

        const config: AirdropConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (dryRun) {
            console.log(`\n🧪 DRY RUN MODE - SIMULATION ONLY`);
            console.log(`📋 Using config for ${configName} (simulation):`);
            console.log(`   Using local Hardhat network instead of: ${config.nodeUri}`);
            console.log(`   Storage Address: ${config.airdropTokenStorageAddress}`);
            console.log(`💡 No real transactions will be sent - simulation only!`);
        } else {
            console.log(`\n📋 Using config for ${configName}:`);
            console.log(`   RPC: ${config.nodeUri}`);
            console.log(`   Storage Address: ${config.airdropTokenStorageAddress}`);
        }

        if (!hre.ethers.isAddress(config.airdropTokenStorageAddress)) {
            throw new Error(`Invalid airdropTokenStorageAddress: ${config.airdropTokenStorageAddress}`);
        }

        if (config.airdropTokenAddress && !hre.ethers.isAddress(config.airdropTokenAddress)) {
            throw new Error(`Invalid airdropTokenAddress: ${config.airdropTokenAddress}`);
        }

        const testTokenDataPresent = config.testToken !== undefined;
        const tokenAddressPresent = config.airdropTokenAddress !== undefined;

        if (testTokenDataPresent && tokenAddressPresent) {
            throw new Error(`Both airdropTokenAddress and testToken are provided in config. Please remove one of them`);
        }

        if (!testTokenDataPresent && !tokenAddressPresent) {
            throw new Error(`Both airdropTokenAddress and testToken are absent in config. Please add one of them`);
        }

        const [deployer] = await hre.ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Make sure PRIVATE_KEY is set in environment variables.");
        }

        let initialBalance: bigint;

        if (dryRun) {
            console.log(`\n🚀 Deployer address: ${deployer.address} (simulation)`);

            await hre.network.provider.send("hardhat_setBalance", [
                deployer.address,
                "0x56bc75e2d63100000", // 100 ETH in hex
            ]);

            initialBalance = await hre.ethers.provider.getBalance(deployer.address);
            console.log(`💰 Initial balance: ${hre.ethers.formatEther(initialBalance)} ETH (simulated)`);
        } else {
            console.log(`\n🚀 Deployer address: ${deployer.address}`);
            initialBalance = await hre.ethers.provider.getBalance(deployer.address);
            console.log(`💰 Initial balance: ${hre.ethers.formatEther(initialBalance)} ETH`);
        }

        let tokenAddress: string;
        let tokenDeploymentData: ContractDeploymentData | undefined;

        if (testTokenDataPresent) {
            const decimals = config.testToken!.decimals ?? 18;
            const deployMsg = dryRun ? `\n🪙 Simulating test token deployment: ${config.testToken!.name} (${config.testToken!.symbol}) with ${decimals} decimals` : `\n🪙 Deploying test token: ${config.testToken!.name} (${config.testToken!.symbol}) with ${decimals} decimals`;
            console.log(deployMsg);

            const MintableERC20 = await hre.ethers.getContractFactory("MintableERC20");
            const token = await MintableERC20.deploy(config.testToken!.name, config.testToken!.symbol, decimals);
            await token.waitForDeployment();

            tokenAddress = await token.getAddress();
            const deploymentTx = token.deploymentTransaction();
            tokenDeploymentData = {
                address: tokenAddress,
                txHash: deploymentTx?.hash
            };

            const successMsg = dryRun ? `✅ Test token simulated at: ${tokenAddress}` : `✅ Test token deployed to: ${tokenAddress}`;
            console.log(successMsg);
            console.log(`📋 Transaction hash: ${deploymentTx?.hash}`);

            if (verify && !dryRun) {
                await waitForConfirmationsAndVerify(
                    hre,
                    tokenAddress,
                    [config.testToken!.name, config.testToken!.symbol, decimals],
                    "Test Token",
                    confirmations
                );
            } else if (dryRun && verify) {
                console.log(`⏩ Skipping verification in dry run mode`);
            }
        } else {
            tokenAddress = config.airdropTokenAddress!;
            const tokenMsg = dryRun ? `\n🪙 Using existing token (simulation): ${tokenAddress}` : `\n🪙 Using existing token: ${tokenAddress}`;
            console.log(tokenMsg);
        }

        const airdropDeployMsg = dryRun ? `\n🚀 Simulating AirdropDistributor deployment...` : `\n🚀 Deploying AirdropDistributor...`;
        console.log(airdropDeployMsg);

        const AirdropDistributor = await hre.ethers.getContractFactory("AirdropDistributor");
        const airdropContract = await AirdropDistributor.deploy(tokenAddress, config.airdropTokenStorageAddress);
        await airdropContract.waitForDeployment();

        const airdropAddress = await airdropContract.getAddress();
        const airdropDeploymentTx = airdropContract.deploymentTransaction();
        const airdropDeploymentData: ContractDeploymentData = {
            address: airdropAddress,
            txHash: airdropDeploymentTx?.hash
        };

        const airdropSuccessMsg = dryRun ? `✅ AirdropDistributor simulated at: ${airdropAddress}` : `✅ AirdropDistributor deployed to: ${airdropAddress}`;
        console.log(airdropSuccessMsg);
        console.log(`📋 Transaction hash: ${airdropDeploymentTx?.hash}`);

        if (verify && !dryRun) {
            await waitForConfirmationsAndVerify(
                hre,
                airdropAddress,
                [tokenAddress, config.airdropTokenStorageAddress],
                "AirdropDistributor",
                confirmations
            );
        } else if (dryRun && verify) {
            console.log(`⏩ Skipping verification in dry run mode`);
        }

        const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
        const totalSpent = initialBalance - finalBalance;

        if (dryRun) {
            console.log(`\n💸 Final balance: ${hre.ethers.formatEther(finalBalance)} ETH (simulated)`);
            console.log(`💸 Estimated gas cost: ${hre.ethers.formatEther(totalSpent)} ETH`);
            console.log(`💡 No real ETH was spent - this was a simulation!`);
        } else {
            console.log(`\n💸 Final balance: ${hre.ethers.formatEther(finalBalance)} ETH`);
            console.log(`💸 Total spent: ${hre.ethers.formatEther(totalSpent)} ETH`);
        }

        if (!dryRun) {
            const deploymentData: DeploymentData = {
                airdropContract: airdropDeploymentData,
                token: tokenDeploymentData
            };

            const date = new Date();
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const deploymentDir = path.resolve(__dirname, `../deploy/data/${configName}`);
            const filename = path.join(deploymentDir, `deployment-${year}-${month}-${day}.json`);

            fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2) + '\n');
            console.log(`\n💾 Deployment data saved: ${filename}`);
        } else {
            console.log(`\n⏩ Skipping deployment data save (dry run mode)`);
        }

        const completionMsg = dryRun ? `\n🎉 Deployment simulation completed successfully!` : `\n🎉 Deployment completed successfully!`;
        console.log(completionMsg);

        const summaryTitle = dryRun ? `📋 Simulation Summary:` : `📋 Summary:`;
        console.log(summaryTitle);
        console.log(`   Token: ${tokenAddress}`);
        console.log(`   AirdropDistributor: ${airdropAddress}`);
        console.log(`   Storage Address: ${config.airdropTokenStorageAddress}`);

        if (dryRun) {
            console.log(`\n💡 To deploy for real, run the same command without --dry-run`);
        }
    });

task("airdrop:configs", "List available network configurations")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const deployDataDir = path.resolve(__dirname, '../deploy/data');
        const networks = fs.readdirSync(deployDataDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        console.log(`\n📋 Available network configurations:`);
        for (const network of networks) {
            const configPath = path.join(deployDataDir, network, 'config.json');
            if (fs.existsSync(configPath)) {
                const config: AirdropConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                console.log(`\n🌐 ${network}:`);
                console.log(`   RPC: ${config.nodeUri}`);
                console.log(`   Storage: ${config.airdropTokenStorageAddress}`);
                if (config.airdropTokenAddress) {
                    console.log(`   Token: ${config.airdropTokenAddress}`);
                }
                if (config.testToken) {
                    console.log(`   Test Token: ${config.testToken.name} (${config.testToken.symbol})`);
                }
            }
        }
    }); 