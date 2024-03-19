import { MerkleTree } from '@thirdweb-dev/merkletree';
import { BigNumber, BigNumberish } from 'ethers';
import { keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

export type UserAirdropData = { address: string; amount: BigNumberish };

export function constructMerkleTree(airdropData: UserAirdropData[]): MerkleTree {
  const hashedLeafs = airdropData.map((userData) =>
    solidityKeccak256(['address', 'uint256'], [userData.address, userData.amount])
  );

  return new MerkleTree(hashedLeafs, keccak256, {
    sort: true,
    sortLeaves: true,
    sortPairs: true,
  });
}

export function constructProof(tree: MerkleTree, userAirdropData: UserAirdropData): string[] {
  return tree.getHexProof(solidityKeccak256(['address', 'uint256'], [userAirdropData.address, userAirdropData.amount]));
}

export function generateRandomAirdropData(userNum: number): UserAirdropData[] {
  let airdropData: UserAirdropData[] = new Array(userNum);
  for (let i = 0; i < userNum; ++i) {
    const randomUser = ethers.Wallet.createRandom().address;
    const randomAmount = BigNumber.from(Math.ceil(Math.random() * 100_000)).mul(10n ** 15n);
    airdropData[i] = { address: randomUser, amount: randomAmount };
  }

  return airdropData;
}
