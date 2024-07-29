import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { createAirdrop } from './shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from './shared/utils';
import { parseUnits } from 'ethers';

describe('AirdropDistributorClaim success', () => {
  it('claim base', async () => {
    const { airdropDistributor, token, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const tokenStorage = await airdropDistributor.airdropTokenStorage();
    const storageBalanceBefore = await token.balanceOf(tokenStorage);

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getProof([user.address, userAmount]);
    await airdropDistributor.connect(user).claim(userAmount, userProof);

    expect(await token.balanceOf(user.address)).to.be.eq(userAmount);

    const storageBalanceCurrent = await token.balanceOf(tokenStorage);
    expect(storageBalanceBefore - storageBalanceCurrent).to.be.eq(userAmount);

    expect(await airdropDistributor.claimed(user.address)).to.be.eq(userAmount);
  });

  it('claim twice with root update', async () => {
    const { airdropDistributor, token, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const tokenStorage = await airdropDistributor.airdropTokenStorage();
    const storageBalanceBefore = await token.balanceOf(tokenStorage);

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.root);

    const userProof = tree.getProof([user.address, userAmount]);
    await airdropDistributor.connect(user).claim(userAmount, userProof);

    const newUserAmount = userAmount * 3n;
    airdropData.pop();
    airdropData.push({ address: user.address, amount: newUserAmount });

    const newTree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(newTree.root);

    const newUserProof = newTree.getProof([user.address, newUserAmount]);
    await airdropDistributor.connect(user).claim(newUserAmount, newUserProof);

    expect(await token.balanceOf(user.address)).to.be.eq(newUserAmount);

    const storageBalanceCurrent = await token.balanceOf(tokenStorage);
    expect(storageBalanceBefore - storageBalanceCurrent).to.be.eq(newUserAmount);

    expect(await airdropDistributor.claimed(user.address)).to.be.eq(newUserAmount);
  });
});
