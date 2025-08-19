import { Signer } from 'ethers';
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

  const token = await new MintableERC20__factory().connect(owner).deploy('proof test token', 'PTT');
  const airdropDistributor = await new AirdropDistributor__factory().connect(owner).deploy(token.target);

  return { airdropDistributor, token, owner };
}
