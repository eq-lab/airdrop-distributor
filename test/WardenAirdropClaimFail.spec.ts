import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { createAirdrop } from './shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from './shared/utils';
import { parseUnits } from 'ethers/lib/utils';

describe('WardenAirdropClaim fail', () => {
  it('claim ineligible user fail', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);
    const [_, ineligibleUser] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(10);
    const userAmount = parseUnits('100', 18);

    const tree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot());

    const ineligibleUserProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [ineligibleUser.address, userAmount])
    );
    await expect(wardenAirdrop.connect(ineligibleUser).claim(userAmount, ineligibleUserProof)).to.be.revertedWith(
      'Proof failed'
    );
  });

  it('claim wrong amount with correct proof', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    const wrongUserAmount = userAmount.add(1);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await expect(wardenAirdrop.connect(user).claim(wrongUserAmount, userProof)).to.be.revertedWith('Proof failed');
  });

  it('claim correct amount with wrong proof', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    const wrongUserAmount = userAmount.add(1);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, wrongUserAmount])
    );
    await expect(wardenAirdrop.connect(user).claim(userAmount, userProof)).to.be.revertedWith('Proof failed');
  });

  it('claim wrong amount with wrong proof', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    const wrongUserAmount = userAmount.add(1);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, wrongUserAmount])
    );
    await expect(wardenAirdrop.connect(user).claim(wrongUserAmount, userProof)).to.be.revertedWith('Proof failed');
  });

  it('claim twice without root update', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await wardenAirdrop.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await wardenAirdrop.connect(user).claim(userAmount, userProof);

    await expect(wardenAirdrop.connect(user).claim(userAmount, userProof)).to.be.revertedWith('Already claimed');
  });
});
