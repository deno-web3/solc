import { solc } from './mod.ts'
import type { Contract } from './types.ts'

const input = {
  language: 'Solidity',
  sources: {
    'test.sol': {
      content: 'contract C { function f() public { } }'
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
}

const { contracts } = JSON.parse(solc.compile(JSON.stringify(input))) as {
  contracts: Record<string, Record<string, Contract>>
}

// `output` here contains the JSON output as specified in the documentation
for (const contractName in contracts['test.sol']) {
  console.log(`${contractName}: ${contracts['test.sol'][contractName].evm.bytecode.object}`)
}
