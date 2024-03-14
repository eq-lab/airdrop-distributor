// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.19;

import '@openzeppelin/contracts/access/Ownable2Step.sol';

import '@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import '@thirdweb-dev/contracts/lib/MerkleProof.sol';

import './interfaces/IWardenAirdrop.sol';

contract WardenAirdrop is IWardenAirdrop, Ownable2Step {
  using LowGasSafeMath for uint256;

  /// @notice token address allocated for airdrop
  address public immutable airdropToken;
  /// @notice address which allocated tokens are transferred from during claim
  address public immutable airdropTokenStorage;
  /// @notice current merkle root used for proofs verification
  bytes32 public merkleRoot;
  /// @notice stores total amounts each user has already claimed
  mapping(address => uint256) public claimed;

  constructor(address _airdropToken, address _airdropTokenStorage) Ownable2Step() {
    airdropToken = _airdropToken;
    airdropTokenStorage = _airdropTokenStorage;
  }

  /// @inheritdoc IWardenAirdrop
  function verifyClaim(
    address claimer,
    uint256 amount,
    bytes32[] calldata proofs
  ) public view override returns (bool success) {
    (success, ) = MerkleProof.verify(proofs, merkleRoot, keccak256(abi.encodePacked(claimer, amount)));
  }

  /// @inheritdoc IWardenAirdrop
  function claim(uint256 amount, bytes32[] calldata proofs) external {
    uint256 alreadyClaimed = claimed[msg.sender];
    require(alreadyClaimed < amount, 'Already claimed');

    require(verifyClaim(msg.sender, amount, proofs), 'Proof failed');

    claimed[msg.sender] = amount;
    uint256 claimedAmount = amount.sub(alreadyClaimed);
    TransferHelper.safeTransferFrom(airdropToken, airdropTokenStorage, msg.sender, claimedAmount);

    emit Claim(msg.sender, claimedAmount);
  }

  /// @inheritdoc IWardenAirdrop
  function updateRoot(bytes32 newMerkleRoot) external onlyOwner {
    merkleRoot = newMerkleRoot;
    emit NewMerkleRoot(newMerkleRoot);
  }
}
