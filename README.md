<div align="center">

<img alt="logo" height="250px" src="https://bafkreicd4u5jhqcnhztqhi3dkvefx3ccooimkqca33ipjo4njyzfus5nfu.ipfs.dweb.link" />

# solc

[![nest badge][nest-badge]](https://nest.land/package/solc) [![][code-quality-img]][code-quality]

</div>

Solidity bindings for Deno, based on [solc-js](https://github.com/ethereum/solc-js).

Solidity 0.7+ is supported.

## Docs

See [solc-js README](https://github.com/ethereum/solc-js#readme) and [Deno doc](https://deno.land/x/solc@1.0.6/mod.ts).

## Example

```ts
import { setupSolc } from 'https://deno.land/x/solc/mod.ts'
import { Input } from 'https://deno.land/x/solc/types.ts'
import { download } from 'https://deno.land/x/solc/download.ts'
import 'https://deno.land/x/solc/env.ts'

const exists = async (filename: string): Promise<boolean> => {
  try {
    await Deno.stat(filename)
    return true
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false
    } else {
      throw error
    }
  }
}

if (!(await exists('./soljson.js'))) await download('./soljson.js')

const dec = new TextDecoder()

const solc = setupSolc('./soljson.js')

const readFile = async (path: string) => {
  const file = await Deno.readFile(path)
  return dec.decode(file)
}

const MyToken = await readFile('./MyToken.sol')
const ERC20 = await readFile('./ERC20.sol')

const input: Input = {
  language: 'Solidity',
  sources: {
    'MyToken.sol': {
      content: MyToken
    },
    'ERC20.sol': {
      content: ERC20
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

console.log(result)
```

And then run with

```sh
deno run -A --unstable --no-check mod.ts
```

[code-quality-img]: https://img.shields.io/codefactor/grade/github/deno-web3/solc?style=for-the-badge&color=626890&
[code-quality]: https://www.codefactor.io/repository/github/deno-web3/solc
[nest-badge]: https://img.shields.io/badge/publushed%20on-nest.land-626890?style=for-the-badge
