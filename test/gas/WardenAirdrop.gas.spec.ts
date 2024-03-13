import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import snapshotGasCost from '@uniswap/snapshot-gas-cost';
import { ethers } from 'hardhat';
import { createAirdrop } from '../shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from '../shared/utils';
import { parseUnits } from 'ethers/lib/utils';

describe('WardenAirdrop gas', () => {
  it('claim gas', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(99);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await snapshotGasCost(await wardenAirdrop.connect(user).claim(userAmount, userProof));
  });

  it('updateRoot gas 100 users', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(100);
    const tree = constructMerkleTree(airdropData);
    await snapshotGasCost(await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot()));
  });

  it('updateRoot gas 1000 users', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(1000);
    const tree = constructMerkleTree(airdropData);
    await snapshotGasCost(await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot()));
  });

  it('updateRoot gas 10000 users', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(10000);
    const tree = constructMerkleTree(airdropData);
    await snapshotGasCost(await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot()));
  });
});
