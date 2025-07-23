// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @dev Mintable ERC20 token.
contract MintableERC20 is ERC20, Ownable2Step {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}
