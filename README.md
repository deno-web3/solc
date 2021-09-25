# solc

> ⚠️ Highly experimental!

Solidity compiler bindings for Deno.

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

const output = JSON.parse(solc.compile(JSON.stringify(input)))

// `output` here contains the JSON output as specified in the documentation
for (const contractName in output.contracts['test.sol']) {
  console.log(contractName + ': ' + output.contracts['test.sol'][contractName].evm.bytecode.object)
}
```

And then run with

```sh
deno run -A --unstable --no-check mod.js
```
