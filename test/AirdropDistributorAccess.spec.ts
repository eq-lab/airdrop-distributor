import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { createAirdrop } from './shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from './shared/utils';
import { AirdropDistributor__factory } from '../typechain-types';

describe('AirdropDistributor access', () => {
  it('updateRoot owner success', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(10);

    const tree = constructMerkleTree(airdropData);
    const treeHexRoot = tree.root;

    expect(await airdropDistributor.merkleRoot()).to.be.not.eq(treeHexRoot);
    await airdropDistributor.connect(owner).updateRoot(treeHexRoot);
    expect(await airdropDistributor.merkleRoot()).to.be.eq(treeHexRoot);
  });

  it('updateRoot manager', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, manager] = await ethers.getSigners();
    expect(await owner.getAddress()).to.be.not.eq(manager.address);

    await airdropDistributor.connect(owner).grantRole(await airdropDistributor.MANAGER_ROLE(), manager.address);

    const airdropData = generateRandomAirdropData(10);

    const tree = constructMerkleTree(airdropData);
    const treeHexRoot = tree.root;

    expect(await airdropDistributor.merkleRoot()).to.be.not.eq(treeHexRoot);
    await airdropDistributor.connect(manager).updateRoot(treeHexRoot);
    expect(await airdropDistributor.merkleRoot()).to.be.eq(treeHexRoot);
  });

  it('updateRoot outsider', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, outsider] = await ethers.getSigners();
    expect(await owner.getAddress()).to.be.not.eq(outsider.address);

    const airdropData = generateRandomAirdropData(10);

    const tree = constructMerkleTree(airdropData);
    const treeHexRoot = tree.root;

    await expect(airdropDistributor.connect(outsider).updateRoot(treeHexRoot)).to.be.revertedWithCustomError(
      airdropDistributor,
      'AccessControlUnauthorizedAccount'
    );
  });

  it('airdropToken zero address', async () => {
    const signer = (await ethers.getSigners()).at(0)!;
    const factory = new AirdropDistributor__factory();
    await expect(
      factory.connect(signer).deploy(ethers.ZeroAddress, ethers.Wallet.createRandom().address)
    ).to.be.revertedWith('airdropToken address is zero');
  });

  it('airdropToken storage zero address', async () => {
    const signer = (await ethers.getSigners()).at(0)!;
    const factory = new AirdropDistributor__factory();
    await expect(
      factory.connect(signer).deploy(ethers.Wallet.createRandom().address, ethers.ZeroAddress)
    ).to.be.revertedWith('airdropToken storage address is zero');
  });

  it('set new manager', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, manager] = await ethers.getSigners();

    const managerRole = await airdropDistributor.MANAGER_ROLE();

    expect(await airdropDistributor.hasRole(managerRole, manager.address)).to.be.false;
    await airdropDistributor.connect(owner).grantRole(managerRole, manager.address);
    expect(await airdropDistributor.hasRole(managerRole, manager.address)).to.be.true;
  });

  it('set new manager not owner fail', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, manager, notOwner] = await ethers.getSigners();
    expect(await owner.getAddress()).to.be.not.eq(notOwner.address);

    const managerRole = await airdropDistributor.MANAGER_ROLE();

    await expect(
      airdropDistributor.connect(notOwner).grantRole(managerRole, manager.address)
    ).to.be.revertedWithCustomError(airdropDistributor, 'AccessControlUnauthorizedAccount');
  });
});
