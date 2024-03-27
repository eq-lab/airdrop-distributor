// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.24;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/access/Ownable2Step.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@thirdweb-dev/contracts/lib/MerkleProof.sol';

import './interfaces/IAirdropDistributor.sol';

contract AirdropDistributor is IAirdropDistributor, AccessControl, Ownable2Step {
  /// @notice manager role which owners can update merkle tree root value
  bytes32 public constant MANAGER_ROLE = keccak256('MANAGER_ROLE');
  /// @notice token address allocated for airdrop
  address public immutable airdropToken;
  /// @notice address which allocated tokens are transferred from during claim
  address public immutable airdropTokenStorage;
  /// @notice manager address which has rights to update merkle root
  address public merkleRootManager;
  /// @notice current merkle root used for proofs verification
  bytes32 public merkleRoot;
  /// @notice stores total amounts each user has already claimed
  mapping(address => uint256) public claimed;

  constructor(address _airdropToken, address _airdropTokenStorage) {
    require(_airdropToken != address(0), 'airdropToken address is zero');
    require(_airdropTokenStorage != address(0), 'airdropToken storage address is zero');
    airdropToken = _airdropToken;
    airdropTokenStorage = _airdropTokenStorage;

    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(MANAGER_ROLE, msg.sender);
  }

  /// @inheritdoc IAirdropDistributor
  function verifyClaim(
    address claimer,
    uint256 amount,
    bytes32[] calldata proofs
  ) public view override returns (bool success) {
    (success, ) = MerkleProof.verify(proofs, merkleRoot, keccak256(abi.encodePacked(claimer, amount)));
  }

  /// @inheritdoc IAirdropDistributor
  function claim(uint256 amount, bytes32[] calldata proofs) external {
    uint256 alreadyClaimed = claimed[msg.sender];
    require(alreadyClaimed < amount, 'Already claimed');

    require(verifyClaim(msg.sender, amount, proofs), 'Proof failed');

    claimed[msg.sender] = amount;
    uint256 claimedAmount = amount - alreadyClaimed;
    TransferHelper.safeTransferFrom(airdropToken, airdropTokenStorage, msg.sender, claimedAmount);

    emit Claim(msg.sender, claimedAmount);
  }

  /// @inheritdoc IAirdropDistributor
  function updateRoot(bytes32 newMerkleRoot) external onlyRole(MANAGER_ROLE) {
    merkleRoot = newMerkleRoot;
    emit NewMerkleRoot(newMerkleRoot);
  }
}
