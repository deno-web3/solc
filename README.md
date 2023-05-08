<div align="center">

<img alt="logo" height="250px" src="https://bafkreicd4u5jhqcnhztqhi3dkvefx3ccooimkqca33ipjo4njyzfus5nfu.ipfs.dweb.link" />

# solc

[![nest badge][nest-badge]](https://nest.land/package/solc) [![GitHub Workflow Status][gh-actions-img]][github-actions]
[![Codecov][cov-badge-url]][cov-url] [![][code-quality-img]][code-quality]

</div>

Solidity bindings for Deno, based on [solc-js](https://github.com/ethereum/solc-js).

Solidity 0.7+ is supported.

For a CLI and a higher level API you can use [sol_build](https://github.com/deno-web3/sol_build).

## Docs

See [solc-js README](https://github.com/ethereum/solc-js#readme) and [Deno doc](https://deno.land/x/solc/mod.ts).

## Example

```ts
import { wrapper } from 'https://deno.land/x/solc/mod.ts'
import { Input } from 'https://deno.land/x/solc/types.ts'
import { download } from 'https://deno.land/x/solc/download.ts'
import { createRequire } from 'https://deno.land/std@0.177.0/node/module.ts'

// Download latest Solidity compiler
await download()

const solc = wrapper(createRequire(import.meta.url)('./soljson.js'))

const MyToken = await Deno.readTextFile('./MyToken.sol')
const ERC20 = await Deno.readTextFile('./ERC20.sol')

const input: Input = {
  language: 'Solidity',
  sources: {
    'MyToken.sol': {
      content: MyToken,
    },
    'ERC20.sol': {
      content: ERC20,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
}
console.log(JSON.parse(solc.compile(JSON.stringify(input))))
```

And then run with

```sh
deno run --allow-net --allow-read --allow-write mod.ts
```

[code-quality-img]: https://img.shields.io/codefactor/grade/github/deno-web3/solc?style=for-the-badge&color=626890&
[code-quality]: https://www.codefactor.io/repository/github/deno-web3/solc
[nest-badge]: https://img.shields.io/badge/publushed%20on-nest.land-626890?style=for-the-badge
[cov-badge-url]: https://img.shields.io/coveralls/github/deno-web3/solc?style=for-the-badge&color=626890&
[cov-url]: https://coveralls.io/github/deno-web3/solc
[github-actions]: https://github.com/tinyhttp/deno-web3/solc
[gh-actions-img]: https://img.shields.io/github/actions/workflow/status/deno-web3/solc/main.yml?branch=master&style=for-the-badge&color=626890&label=&logo=github
