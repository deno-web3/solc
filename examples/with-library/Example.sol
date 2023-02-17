// SPDX-License-Identifier: MIT
pragma solidity >=0.8;

import { LibString } from "./LibString.sol";

contract Example {
  function stringify(int256 value) external pure returns (string memory) {
    return LibString.toString(value);
  }
}