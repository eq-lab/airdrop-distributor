import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { createAirdrop } from './shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from './shared/utils';
import { parseUnits } from 'ethers/lib/utils';

describe('AirdropDistributorClaim fail', () => {
  it('claim ineligible user fail', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, ineligibleUser] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(10);
    const userAmount = parseUnits('100', 18);

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.getHexRoot());

    const ineligibleUserProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [ineligibleUser.address, userAmount])
    );
    expect(await airdropDistributor.verifyClaim(ineligibleUser.address, userAmount, ineligibleUserProof)).to.be.false;
    await expect(airdropDistributor.connect(ineligibleUser).claim(userAmount, ineligibleUserProof)).to.be.revertedWith(
      'Proof failed'
    );
  });

  it('claim ineligible user with other user proof fail', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, ineligibleUser] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(10);

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.getHexRoot());

    const eligibleUser = airdropData[0];
    const eligibleUserProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [eligibleUser.address, eligibleUser.amount])
    );
    expect(await airdropDistributor.verifyClaim(eligibleUser.address, eligibleUser.amount, eligibleUserProof)).to.be
      .true;
    await expect(
      airdropDistributor.connect(ineligibleUser).claim(eligibleUser.amount, eligibleUserProof)
    ).to.be.revertedWith('Proof failed');
  });

  it('claim wrong amount with correct proof', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    const wrongUserAmount = userAmount.add(1);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    expect(await airdropDistributor.verifyClaim(user.address, userAmount, userProof)).to.be.true;
    await expect(airdropDistributor.connect(user).claim(wrongUserAmount, userProof)).to.be.revertedWith('Proof failed');
  });

  it('claim correct amount with wrong proof', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    const wrongUserAmount = userAmount.add(1);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, wrongUserAmount])
    );
    expect(await airdropDistributor.verifyClaim(user.address, userAmount, userProof)).to.be.false;
    await expect(airdropDistributor.connect(user).claim(userAmount, userProof)).to.be.revertedWith('Proof failed');
  });

  it('claim wrong amount with wrong proof', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    const wrongUserAmount = userAmount.add(1);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, wrongUserAmount])
    );
    expect(await airdropDistributor.verifyClaim(user.address, userAmount, userProof)).to.be.false;
    await expect(airdropDistributor.connect(user).claim(wrongUserAmount, userProof)).to.be.revertedWith('Proof failed');
  });

  it('claim twice without root update', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, user] = await ethers.getSigners();

    const airdropData = generateRandomAirdropData(9);
    const userAmount = parseUnits('100', 18);
    airdropData.push({ address: user.address, amount: userAmount });

    const tree = constructMerkleTree(airdropData);
    await airdropDistributor.connect(owner).updateRoot(tree.getHexRoot());

    const userProof = tree.getHexProof(
      ethers.utils.solidityKeccak256(['address', 'uint256'], [user.address, userAmount])
    );
    await airdropDistributor.connect(user).claim(userAmount, userProof);

    expect(await airdropDistributor.verifyClaim(user.address, userAmount, userProof)).to.be.true;
    await expect(airdropDistributor.connect(user).claim(userAmount, userProof)).to.be.revertedWith('Already claimed');
  });
});
