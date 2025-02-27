<div align="center">

<img alt="logo" height="250px" src="./logo.png" />

# solc

[![GitHub Workflow Status][gh-actions-img]][github-actions]
[![Codecov][cov-badge-url]][cov-url] [![][code-quality-img]][code-quality]

</div>

Solidity bindings for Deno, based on [solc-js](https://github.com/ethereum/solc-js).

Solidity 0.7+ is supported.

For a CLI and a higher level API you can use [sol_build](https://github.com/deno-web3/sol_build).

## Docs

See [solc-js README](https://github.com/ethereum/solc-js#readme) and [Deno doc](https://deno.land/x/solc/mod.ts).

## Example

```ts
import { wrapper } from '@deno-web3/solc'
import { Input } from '@deno-web3/solc/types.ts'
import { download } from '@deno-web3/solc/download.ts'
import { createRequire } from 'node:module'

// Download latest Solidity compiler
await download()

const solc = wrapper(createRequire(import.meta.url)('./soljson.cjs'))

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
[cov-badge-url]: https://img.shields.io/coveralls/github/deno-web3/solc?style=for-the-badge&color=626890&
[cov-url]: https://coveralls.io/github/deno-web3/solc
[github-actions]: https://github.com/tinyhttp/deno-web3/solc
[gh-actions-img]: https://img.shields.io/github/actions/workflow/status/deno-web3/solc/main.yml?branch=master&style=for-the-badge&color=626890&label=&logo=github
