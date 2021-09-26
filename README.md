<div align="center">

<img alt="logo" height="250px" src="https://bafkreicd4u5jhqcnhztqhi3dkvefx3ccooimkqca33ipjo4njyzfus5nfu.ipfs.dweb.link" />

# solc

[![nest badge][nest-badge]](https://nest.land/package/solc)

</div>

> ⚠️ Highly experimental!

Solidity v0.8.7 bindings for Deno, based on [solc-js](https://github.com/ethereum/solc-js).

## Docs

See [solc-js README](https://github.com/ethereum/solc-js#readme).

## Example

```ts
import { setupSolc } from 'https://deno.land/x/solc/mod.ts'
import { download } from 'https://deno.land/x/solc/download.ts'

await download('./soljson.js') // download soljson

const solc = setupSolc('./soljson.js') // require(...) soljson to Deno

const input = {
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

[code-quality-img]: https://img.shields.io/codefactor/grade/github/deno-libs/solc?style=for-the-badge&color=black&
[code-quality]: https://www.codefactor.io/repository/github/deno-libs/solc
[nest-badge]: https://img.shields.io/badge/publushed%20on-nest.land-black?style=for-the-badge
