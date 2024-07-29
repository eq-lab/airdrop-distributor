import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { ethers } from 'hardhat';

export type UserAirdropData = { address: string; amount: bigint };

export function constructMerkleTree(airdropData: UserAirdropData[]): StandardMerkleTree<(string | bigint)[]> {
  const leafs = airdropData.map((userData) => [userData.address, userData.amount]);

  return StandardMerkleTree.of(leafs, ['address', 'uint256']);
}

export function constructProof(
  tree: StandardMerkleTree<(string | bigint)[]>,
  userAirdropData: UserAirdropData
): string[] {
  return tree.getProof([userAirdropData.address, userAirdropData.amount]);
}

export function generateRandomAirdropData(userNum: number): UserAirdropData[] {
  let airdropData: UserAirdropData[] = new Array(userNum);
  for (let i = 0; i < userNum; ++i) {
    const randomUser = ethers.Wallet.createRandom().address;
    const randomAmount = BigInt(Math.ceil(Math.random() * 100_000)) * 10n ** 15n;
    airdropData[i] = { address: randomUser, amount: randomAmount };
  }

  return airdropData;
}
