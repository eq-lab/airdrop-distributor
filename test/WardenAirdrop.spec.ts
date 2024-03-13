import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import snapshotGasCost from '@uniswap/snapshot-gas-cost';
import { ethers } from 'hardhat';
import { createAirdrop } from './shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from './shared/utils';
import { parseUnits } from 'ethers/lib/utils';

describe('WardenAirdrop', () => {
  it('claim success', async () => {
    const { wardenAirdrop, token, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const tokenStorage = await wardenAirdrop.airdropTokenStorage();
    const storageBalanceBefore = await token.balanceOf(tokenStorage);

    const airdropData = generateRandomAirdropData(99);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await wardenAirdrop.connect(user).claim(userAmount, userProof);

    expect(await token.balanceOf(user.address)).to.be.eq(userAmount);

    const storageBalanceCurrent = await token.balanceOf(tokenStorage);
    expect(storageBalanceBefore.sub(storageBalanceCurrent)).to.be.eq(userAmount);

    expect(await wardenAirdrop.claimed(user.address)).to.be.eq(userAmount);
  });

  it('claim ineligible user fail', async () => {
    const { wardenAirdrop, token, owner } = await loadFixture(createAirdrop);
    const [_, ineligibleUser] = await ethers.getSigners();

    const tokenStorage = await wardenAirdrop.airdropTokenStorage();
    const storageBalanceBefore = await token.balanceOf(tokenStorage);

    const airdropData = generateRandomAirdropData(100);
    const userAmount = parseUnits('100', 18);

    const tree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot());

    const ineligibleUserProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [ineligibleUser.address, userAmount])
    );
    await expect(wardenAirdrop.connect(ineligibleUser).claim(userAmount, ineligibleUserProof)).to.be.revertedWith(
      'Proof failed'
    );

    expect(await token.balanceOf(ineligibleUser.address)).to.be.eq(0);

    const storageBalanceCurrent = await token.balanceOf(tokenStorage);
    expect(storageBalanceBefore).to.be.eq(storageBalanceCurrent);
  });
});
