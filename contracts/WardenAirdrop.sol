// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.19;

import '@openzeppelin/contracts/access/Ownable2Step.sol';

import '@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import '@thirdweb-dev/contracts/lib/MerkleProof.sol';

contract WardenAirdrop is Ownable2Step {
  using LowGasSafeMath for uint256;

  event NewMerkleRoot(bytes32 newMerkleRoot);
  event Claim(address indexed user, uint256 amount);

  address public immutable airdropToken;
  address public immutable airdropTokenStorage;
  bytes32 public merkleRoot;

  mapping(address => uint256) public claimed;

  constructor(address _airdropToken, address _airdropTokenStorage) Ownable2Step() {
    airdropToken = _airdropToken;
    airdropTokenStorage = _airdropTokenStorage;
  }

  function verifyClaim(address claimer, uint256 amount, bytes32[] calldata proofs) public view returns (bool success) {
    (success, ) = MerkleProof.verify(proofs, merkleRoot, keccak256(abi.encodePacked(claimer, amount)));
  }

  function claim(uint256 amount, bytes32[] calldata proofs) external {
    require(verifyClaim(msg.sender, amount, proofs), 'Proof failed');

    uint256 alreadyClaimed = claimed[msg.sender];
    require(alreadyClaimed < amount, 'Already claimed');

    claimed[msg.sender] = amount;
    uint256 claimedAmount = amount.sub(alreadyClaimed);
    TransferHelper.safeTransferFrom(airdropToken, airdropTokenStorage, msg.sender, claimedAmount);

    emit Claim(msg.sender, claimedAmount);
  }

  function updateRoot(bytes32 newMerkleRoot) external onlyOwner {
    merkleRoot = newMerkleRoot;
    emit NewMerkleRoot(newMerkleRoot);
  }
}
