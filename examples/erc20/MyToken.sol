// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8;

import {ERC20} from "./ERC20.sol";

/**
 * @dev This is an example contract implementation of NFToken with metadata extension.
 */
contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MYTOKEN", 18) {}

    function mint(address to, uint256 value) external {
        _mint(to, value);
    }

    function burn(address from, uint256 value) external {
        _burn(from, value);
    }
}
