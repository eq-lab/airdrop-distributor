import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { createAirdrop } from './shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from './shared/utils';
import { parseUnits } from 'ethers/lib/utils';

describe('WardenAirdropClaim success', () => {
  it('claim base', async () => {
    const { wardenAirdrop, token, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const tokenStorage = await wardenAirdrop.airdropTokenStorage();
    const storageBalanceBefore = await token.balanceOf(tokenStorage);

    const airdropData = generateRandomAirdropData(9);
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

  it('claim twice with root update', async () => {
    const { wardenAirdrop, token, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const tokenStorage = await wardenAirdrop.airdropTokenStorage();
    const storageBalanceBefore = await token.balanceOf(tokenStorage);

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await wardenAirdrop.connect(user).claim(userAmount, userProof);

    const newUserAmount = userAmount.mul(3);
    airdropData.pop();
    airdropData.push({ address: user.address, amount: newUserAmount });

    const newTree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(newTree.getHexRoot());

    const newUserProof = newTree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, newUserAmount])
    );
    await wardenAirdrop.connect(user).claim(newUserAmount, newUserProof);

    expect(await token.balanceOf(user.address)).to.be.eq(newUserAmount);

    const storageBalanceCurrent = await token.balanceOf(tokenStorage);
    expect(storageBalanceBefore.sub(storageBalanceCurrent)).to.be.eq(newUserAmount);

    expect(await wardenAirdrop.claimed(user.address)).to.be.eq(newUserAmount);
  });
});
