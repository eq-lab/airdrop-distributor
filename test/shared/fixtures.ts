import { expect } from 'chai';
import { Signer } from 'ethers';
import { parseUnits } from 'ethers';
import { ethers } from 'hardhat';
import {
  AirdropDistributor,
  MintableERC20,
  AirdropDistributor__factory,
  MintableERC20__factory,
} from '../../typechain-types';

export async function createAirdrop(): Promise<{
  airdropDistributor: AirdropDistributor;
  token: MintableERC20;
  owner: Signer;
}> {
  const signers = await ethers.getSigners();
  const owner = signers.at(0)!;
  const airdropStorage = signers.at(-1)!;

  const token = await new MintableERC20__factory().connect(owner).deploy('proof test token', 'PTT');
  const airdropDistributor = await new AirdropDistributor__factory()
    .connect(owner)
    .deploy(token.target, airdropStorage.address);

  const totalAirdropAmount = parseUnits('1000000', 18); // 1_000_000 * 10^18
  await token.connect(owner).mint(airdropStorage.address, totalAirdropAmount);
  expect(await token.balanceOf(airdropStorage.address)).to.be.eq(totalAirdropAmount);
  await token.connect(airdropStorage).approve(airdropDistributor.target, totalAirdropAmount);

  return { airdropDistributor, token, owner };
}
