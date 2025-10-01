import { beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { wrapper } from "solc";
import { createRequire } from "./helpers_test.ts";
import { download } from "solc/download";
import type { Input, Output, Wrapper } from "solc/types";

const require = createRequire(import.meta.url);

globalThis.__dirname = import.meta.dirname!;

const contract = `
// SPDX-License-Identifier: MIT
pragma solidity >=0.8;

contract HelloWorld {
    string public greet = "Hello World!";
}
`;

const interfaceContract = `
// SPDX-License-Identifier: MIT
pragma solidity >=0.8;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
`;

const abstractContract = `
// SPDX-License-Identifier: MIT
pragma solidity >=0.8;

import "./IERC20.sol";

abstract contract Token is IERC20 {
    mapping(address => uint256) internal _balances;
    
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    function _mint(address to, uint256 amount) internal {
        _balances[to] += amount;
    }
}
`;

const implementationContract = `
// SPDX-License-Identifier: MIT
pragma solidity >=0.8;

import "./Token.sol";

contract MyToken is Token {
    string public name = "MyToken";
    
    constructor() {
        _mint(msg.sender, 1000000);
    }
    
    function transfer(address to, uint256 amount) external override returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }
}
`;

const errorContract = `
// SPDX-License-Identifier: MIT
pragma solidity >=0.8;

contract ErrorContract {
    // This will cause a compilation error - missing semicolon
    string public name = "test"
    
    function test() public {
        // This will cause another error - undefined variable
        undefinedVariable = 5;
    }
}
`;

// Contract for testing Solidity 0.7.x compatibility
const solidity07Contract = `
// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

contract Token07 {
    string public name = "Token07";
    mapping(address => uint256) public balances;
    
    constructor() {
        balances[msg.sender] = 1000000;
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
}
`;

describe("Wrapper", () => {
  let solc: Wrapper;
  beforeAll(async () => {
    await download("./soljson_test.cjs", "0.8.18");
    solc = wrapper(require("./soljson_test.cjs"));
  });
  it("returns JS interface", () => {
    expect(solc.compile).toBeDefined();
    expect(solc.version()).toBe("0.8.18+commit.87f61d96.Emscripten.clang");
    expect(solc.license()).toContain(
      "Most of the code is licensed under GPLv3 (see below), the license for individual"
    );
  });
  it("compiles a Solidity file", () => {
    const input: Input = {
      language: "Solidity",
      sources: {
        "Hello.sol": { content: contract },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };
    const output: Output = JSON.parse(solc.compile(JSON.stringify(input)));

    expect(output.sources!["Hello.sol"].id).toEqual(0);
    expect(output.contracts!["Hello.sol"]["HelloWorld"].abi).toEqual([
      {
        inputs: [],
        name: "greet",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ]);
  });

  it("compiles multiple files with inheritance (interface + abstract + implementation)", () => {
    const input: Input = {
      language: "Solidity",
      sources: {
        "IERC20.sol": { content: interfaceContract },
        "Token.sol": { content: abstractContract },
        "MyToken.sol": { content: implementationContract },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };
    const output: Output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Verify all files are compiled
    expect(output.sources!["IERC20.sol"]).toBeDefined();
    expect(output.sources!["Token.sol"]).toBeDefined();
    expect(output.sources!["MyToken.sol"]).toBeDefined();

    // Verify interface contract
    expect(output.contracts!["IERC20.sol"]["IERC20"]).toBeDefined();
    expect(output.contracts!["IERC20.sol"]["IERC20"].abi).toEqual([
      {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ]);

    // Verify abstract contract exists but has no bytecode (since it's abstract)
    expect(output.contracts!["Token.sol"]["Token"]).toBeDefined();

    // Verify implementation contract
    expect(output.contracts!["MyToken.sol"]["MyToken"]).toBeDefined();
    expect(
      output.contracts!["MyToken.sol"]["MyToken"].evm.bytecode.object
    ).not.toBe("");

    // Check that MyToken has the expected ABI including inherited functions
    const myTokenAbi = output.contracts!["MyToken.sol"]["MyToken"].abi;
    const functionNames = myTokenAbi
      .map((item) => item.name)
      .filter((name) => name);
    expect(functionNames).toContain("transfer");
    expect(functionNames).toContain("balanceOf");
    expect(functionNames).toContain("name");
  });

  it("handles compilation errors properly", () => {
    const input: Input = {
      language: "Solidity",
      sources: {
        "Error.sol": { content: errorContract },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };
    const output: Output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Should have compilation errors
    expect(output.errors).toBeDefined();
    expect(output.errors!.length).toBeGreaterThan(0);

    // Check that errors contain expected information
    const errorMessages = output
      .errors!.map(
        (error: any) => error.message || error.formattedMessage || ""
      )
      .join(" ");
    expect(errorMessages.toLowerCase()).toMatch(/(error|expected|syntax)/);
  });

  it("compiles Solidity 0.7.x contracts (version compatibility test)", async () => {
    // Download and test with Solidity 0.7.6 (last stable 0.7.x version)
    await download("./soljson_07_test.cjs", "0.7.6");
    const solc07 = wrapper(require("./soljson_07_test.cjs"));

    expect(solc07.version()).toBe("0.7.6+commit.7338295f.Emscripten.clang");

    const input: Input = {
      language: "Solidity",
      sources: {
        "Token07.sol": { content: solidity07Contract },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };
    const output: Output = JSON.parse(solc07.compile(JSON.stringify(input)));

    // Verify compilation succeeded
    expect(output.sources!["Token07.sol"]).toBeDefined();
    expect(output.contracts!["Token07.sol"]["Token07"]).toBeDefined();
    expect(
      output.contracts!["Token07.sol"]["Token07"].evm.bytecode.object
    ).not.toBe("");

    // Verify ABI is generated correctly for 0.7.x
    const abi = output.contracts!["Token07.sol"]["Token07"].abi;
    const functionNames = abi.map((item) => item.name).filter((name) => name);
    expect(functionNames).toContain("transfer");
    expect(functionNames).toContain("balanceOf");
    expect(functionNames).toContain("name");
  });
});
