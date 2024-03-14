// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.19;

interface IWardenAirdrop {
  /// @notice emitted when contract owner updates merkle root used in proofs verification
  event NewMerkleRoot(bytes32 newMerkleRoot);
  /// @notice emitted when user claimed allocated tokens
  /// @param amount amount transerred in last claim call
  /// @dev amount can differ from the one passed in claim call
  /// if user has claimed tokens before and got new allocation with merkle root update
  event Claim(address indexed user, uint256 amount);

  /// @notice call for claiming allocated airdrop
  /// @param amount total allocated airdrop amount for msg.sender
  /// @param proofs merkle proof for user eligibility and amount correctness
  function claim(uint256 amount, bytes32[] calldata proofs) external;

  /// @notice proof verification.
  /// @dev this function is one of the stages in claim call and must return true for that to pass
  /// @param claimer claimer address whose amounts and proofs are to be verified
  /// @param amount total allocated airdrop amount for msg.sender
  /// @param proofs merkle proof for user eligibility and amount correctness
  function verifyClaim(address claimer, uint256 amount, bytes32[] calldata proofs) external view returns (bool);

  /// @notice updates merkle root. Can be called by contranct owner only
  function updateRoot(bytes32 newMerkleRoot) external;

  /// @notice returns token address allocated for airdrop
  function airdropToken() external view returns(address);

  /// @notice returns current merkle root used for proofs verification
  function merkleRoot() external view returns(bytes32);
}
