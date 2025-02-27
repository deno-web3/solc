import { wrapper } from 'solc'
import type { Input, Output } from 'solc/types'
import { download } from 'solc/download'
import { exists } from '../../helpers_test.ts'

if (!(await exists('./soljson.cjs'))) await download()

const mod = await import('./soljson.cjs')

const solc = wrapper(mod.default)

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

const result = JSON.parse(solc.compile(JSON.stringify(input))) as Output

console.log(result)
