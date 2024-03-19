import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { createAirdrop } from './shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from './shared/utils';
import { AirdropDistributor__factory } from '../typechain-types';

describe('AirdropDistributor', () => {
  it('updateRoot success', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(10);

    const tree = constructMerkleTree(airdropData);
    const treeHexRoot = tree.getHexRoot();

    expect(await airdropDistributor.merkleRoot()).to.be.not.eq(treeHexRoot);
    await airdropDistributor.connect(owner).updateRoot(treeHexRoot);
    expect(await airdropDistributor.merkleRoot()).to.be.eq(treeHexRoot);
  });

  it('updateRoot not owner', async () => {
    const { airdropDistributor, owner } = await loadFixture(createAirdrop);
    const [_, notOwner] = await ethers.getSigners();
    expect(await owner.getAddress()).to.be.not.eq(notOwner.address);

    const airdropData = generateRandomAirdropData(10);

    const tree = constructMerkleTree(airdropData);
    const treeHexRoot = tree.getHexRoot();

    expect(airdropDistributor.connect(notOwner).updateRoot(treeHexRoot)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
  });

  it('airdropToken zero address', async () => {
    const signer = (await ethers.getSigners()).at(0)!;
    const factory = new AirdropDistributor__factory();
    await expect(
      factory.connect(signer).deploy(ethers.constants.AddressZero, ethers.Wallet.createRandom().address)
    ).to.be.revertedWith('airdropToken address is zero');
  });

  it('airdropToken storage zero address', async () => {
    const signer = (await ethers.getSigners()).at(0)!;
    const factory = new AirdropDistributor__factory();
    await expect(
      factory.connect(signer).deploy(ethers.Wallet.createRandom().address, ethers.constants.AddressZero)
    ).to.be.revertedWith('airdropToken storage address is zero');
  });
});
