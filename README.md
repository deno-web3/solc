<div align="center">

<img alt="logo" height="250px" src="https://bafkreicd4u5jhqcnhztqhi3dkvefx3ccooimkqca33ipjo4njyzfus5nfu.ipfs.dweb.link" />

# solc

[![nest badge][nest-badge]](https://nest.land/package/solc) [![][code-quality-img]][code-quality]

</div>

> ⚠️ Highly experimental!

Solidity bindings for Deno, based on [solc-js](https://github.com/ethereum/solc-js).

Solidity 0.7+ is supported.

## Docs

See [solc-js README](https://github.com/ethereum/solc-js#readme).

## Example

```ts
import { download } from 'https://deno.land/x/solc/download.ts'
import { setupMethods } from 'https://deno.land/x/solc/wrapper.ts'
import 'https://deno.land/x/solc/process.ts'
import { createRequire } from 'https://deno.land/std@0.108.0/node/module.ts'
import { exists } from 'https://deno.land/x/solc/utils.ts'

if (!(await exists('./soljson.js'))) download('./soljson.js')

const require = createRequire(import.meta.url)

const solc = setupMethods(require('./soljson.js'))

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

const result = JSON.parse(solc.compile(JSON.stringify(input)))

const { contracts } = result

// `output` here contains the JSON output as specified in the documentation
for (const contractName in contracts['test.sol']) {
  console.log(`${contractName}: ${contracts['test.sol'][contractName].evm.bytecode.object}`)
}
```

And then run with

```sh
deno run -A --unstable --no-check mod.js
```

See [example](https://github.com/deno-web3/solc/tree/master/example) for a more advanced example.

[code-quality-img]: https://img.shields.io/codefactor/grade/github/deno-web3/solc?style=for-the-badge&color=626890&
[code-quality]: https://www.codefactor.io/repository/github/deno-web3/solc
[nest-badge]: https://img.shields.io/badge/publushed%20on-nest.land-626890?style=for-the-badge
