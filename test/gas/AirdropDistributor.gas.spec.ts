import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import snapshotGasCost from '@uniswap/snapshot-gas-cost';
import { ethers } from 'hardhat';
import { createAirdrop } from '../shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from '../shared/utils';
import { parseUnits } from 'ethers';

describe('AirdropDistributor gas', () => {
  it('claim gas 100 eligible users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(99);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getProof([user.address, userAmount]);
    const txReceipt = await (await airdropDistributor.connect(user).claim(userAmount, userProof)).wait();
    await snapshotGasCost(Number(txReceipt?.gasUsed));
  });

  it('claim gas 1000 eligible users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(999);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getProof([user.address, userAmount]);
    const txReceipt = await (await airdropDistributor.connect(user).claim(userAmount, userProof)).wait();
    await snapshotGasCost(Number(txReceipt?.gasUsed));
  });

  it('claim gas 10000 eligible users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9999);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getProof([user.address, userAmount]);
    const txReceipt = await (await airdropDistributor.connect(user).claim(userAmount, userProof)).wait();
    await snapshotGasCost(Number(txReceipt?.gasUsed));
  });

  it('claim gas 50000 eligible users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(49999);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getProof([user.address, userAmount]);
    const txReceipt = await (await airdropDistributor.connect(user).claim(userAmount, userProof)).wait();
    await snapshotGasCost(Number(txReceipt?.gasUsed));
  });

  it('updateRoot gas 100 users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(100);
    const tree = constructMerkleTree(airdropData);
    const txReceipt = await (await airdropDistributor.connect(owner).updateRoot(tree.root)).wait();
    await snapshotGasCost(Number(txReceipt?.gasUsed));
  });

  it('updateRoot gas 1000 users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(1000);
    const tree = constructMerkleTree(airdropData);
    const txReceipt = await (await airdropDistributor.connect(owner).updateRoot(tree.root)).wait();
    await snapshotGasCost(Number(txReceipt?.gasUsed));
  });

  it('updateRoot gas 10000 users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(10000);
    const tree = constructMerkleTree(airdropData);
    const txReceipt = await (await airdropDistributor.connect(owner).updateRoot(tree.root)).wait();
    await snapshotGasCost(Number(txReceipt?.gasUsed));
  });

  it('updateRoot gas 50000 users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(50000);
    const tree = constructMerkleTree(airdropData);
    const txReceipt = await (await airdropDistributor.connect(owner).updateRoot(tree.root)).wait();
    await snapshotGasCost(Number(txReceipt?.gasUsed));
  });
});
