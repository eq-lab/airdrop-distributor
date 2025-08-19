// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.24;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/access/Ownable2Step.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';

import './interfaces/IAirdropDistributor.sol';

/// @notice interface for mintable token
interface IMintableERC20Token {
  function mint(address recipient, uint256 amount) external;
}

/**
 * @title AirdropDistributor
 * @notice AirdropDistributor is a contract that distributes tokens to airdrop recipients
 * @dev This contract use mint function to distribute tokens to airdrop recipients
 */
contract AirdropDistributor is IAirdropDistributor, AccessControl, Ownable2Step {
  /// @notice manager role which owners can update merkle tree root value
  bytes32 public constant MANAGER_ROLE = keccak256('MANAGER_ROLE');
  /// @notice token address allocated for airdrop
  address public immutable airdropToken;
  /// @notice current merkle root used for proofs verification
  bytes32 public merkleRoot;
  /// @notice stores total amounts each user has already claimed
  mapping(address => uint256) public claimed;

  constructor(address _airdropToken) Ownable(msg.sender) {
    require(_airdropToken != address(0), 'airdropToken address is zero');
    airdropToken = _airdropToken;

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MANAGER_ROLE, msg.sender);
  }

  /// @inheritdoc IAirdropDistributor
  function verifyClaim(
    address claimer,
    uint256 amount,
    bytes32[] calldata proofs
  ) public view override returns (bool success) {
    success = MerkleProof.verify(proofs, merkleRoot, keccak256(bytes.concat(keccak256(abi.encode(claimer, amount)))));
  }

  /// @inheritdoc IAirdropDistributor
  function claim(uint256 amount, bytes32[] calldata proofs) external {
    uint256 alreadyClaimed = claimed[msg.sender];
    require(alreadyClaimed < amount, 'Already claimed');

    require(verifyClaim(msg.sender, amount, proofs), 'Proof failed');

    claimed[msg.sender] = amount;
    uint256 claimedAmount = amount - alreadyClaimed;
    IMintableERC20Token(airdropToken).mint(msg.sender, claimedAmount);

    emit Claim(msg.sender, claimedAmount);
  }

  /// @inheritdoc IAirdropDistributor
  function updateRoot(bytes32 newMerkleRoot) external onlyRole(MANAGER_ROLE) {
    merkleRoot = newMerkleRoot;
    emit NewMerkleRoot(newMerkleRoot);
  }
}
