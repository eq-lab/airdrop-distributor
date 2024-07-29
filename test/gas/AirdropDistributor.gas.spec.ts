import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import snapshotGasCost from '@uniswap/snapshot-gas-cost';
import { ethers } from 'hardhat';
import { createAirdrop } from '../shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from '../shared/utils';
import { parseUnits } from 'ethers/lib/utils';

describe('AirdropDistributor gas', () => {
  it('claim gas 100 eligible users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(99);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await snapshotGasCost(await airdropDistributor.connect(user).claim(userAmount, userProof));
  });

  it('claim gas 1000 eligible users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(999);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await snapshotGasCost(await airdropDistributor.connect(user).claim(userAmount, userProof));
  });

  it('claim gas 10000 eligible users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9999);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await snapshotGasCost(await airdropDistributor.connect(user).claim(userAmount, userProof));
  });

  it('claim gas 50000 eligible users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(49999);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await snapshotGasCost(await airdropDistributor.connect(user).claim(userAmount, userProof));
  });

  it('updateRoot gas 100 users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(100);
    const tree = constructMerkleTree(airdropData);
    await snapshotGasCost(await airdropDistributor.connect(owner).updateRoot(tree.root));
  });

  it('updateRoot gas 1000 users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(1000);
    const tree = constructMerkleTree(airdropData);
    await snapshotGasCost(await airdropDistributor.connect(owner).updateRoot(tree.root));
  });

  it('updateRoot gas 10000 users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(10000);
    const tree = constructMerkleTree(airdropData);
    await snapshotGasCost(await airdropDistributor.connect(owner).updateRoot(tree.root));
  });

  it('updateRoot gas 50000 users', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(50000);
    const tree = constructMerkleTree(airdropData);
    await snapshotGasCost(await airdropDistributor.connect(owner).updateRoot(tree.root));
  });
});
