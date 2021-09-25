# solc

> ⚠️ Highly experimental!

Solidity v0.8.7 bindings for Deno, based on [solc-js](https://github.com/ethereum/solc-js).

## Example

```ts
import { solc } from 'https://deno.land/x/solc/mod.ts'

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

const { contracts } = JSON.parse(solc.compile(JSON.stringify(input)))

// `output` here contains the JSON output as specified in the documentation
for (const contractName in contracts['test.sol']) {
  console.log(`${contractName}: ${contracts['test.sol'][contractName].evm.bytecode.object}`)
}
```

And then run with

```sh
deno run -A --unstable --no-check mod.js
```
