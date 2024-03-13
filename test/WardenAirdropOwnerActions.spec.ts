import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { createAirdrop } from './shared/fixtures';
import { constructMerkleTree, generateRandomAirdropData } from './shared/utils';
import { parseUnits } from 'ethers/lib/utils';

describe('WardenAirdrop', () => {
  it('updateRoot success', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);

    const airdropData = generateRandomAirdropData(10);

    const tree = constructMerkleTree(airdropData);
    const treeHexRoot = tree.getHexRoot();

    expect(await wardenAirdrop.merkleRoot()).to.be.not.eq(treeHexRoot);
    await wardenAirdrop.connect(owner).updateRoot(treeHexRoot);
    expect(await wardenAirdrop.merkleRoot()).to.be.eq(treeHexRoot);
  });

  it('updateRoot not owner', async () => {
    const { wardenAirdrop, owner } = await loadFixture(createAirdrop);
    const [_, notOwner] = await ethers.getSigners();
    expect(await owner.getAddress()).to.be.not.eq(notOwner.address);

    const airdropData = generateRandomAirdropData(10);

    const tree = constructMerkleTree(airdropData);
    const treeHexRoot = tree.getHexRoot();

    expect(wardenAirdrop.connect(notOwner).updateRoot(treeHexRoot)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
  });
});
